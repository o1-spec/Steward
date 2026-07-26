import { describe, expect, it, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { prisma } from "../db";
import { generateApiKeySecret, hashApiKey } from "../api-keys";

describe("Milestone 6: Cooperative Agent Controls & Command State Machine", () => {
  let testProjectId: string;
  let testApiKey: string;
  let testRunId: string;

  beforeEach(async () => {
    // Clear test tables
    await prisma.auditLog.deleteMany({});
    await prisma.runCommand.deleteMany({});
    await prisma.approvalRequest.deleteMany({});
    await prisma.event.deleteMany({});
    await prisma.run.deleteMany({});
    await prisma.projectApiKey.deleteMany({});
    await prisma.project.deleteMany({});

    const project = await prisma.project.create({
      data: {
        name: "Command Test Project",
        slug: "command-test-project",
      },
    });
    testProjectId = project.id;

    const rawSecret = generateApiKeySecret();
    testApiKey = rawSecret;
    const keyHash = hashApiKey(rawSecret);

    await prisma.projectApiKey.create({
      data: {
        projectId: project.id,
        name: "Test Key",
        keyPrefix: rawSecret.substring(0, 18),
        keyHash,
      },
    });

    const run = await prisma.run.create({
      data: {
        projectId: project.id,
        externalId: "run_cmd_test_001",
        agentName: "control_agent",
        status: "RUNNING",
        controlState: "ACTIVE",
        startedAt: new Date(),
      },
    });
    testRunId = run.externalId;
  });

  describe("POST /api/v1/runs/:runId/commands (Dashboard Control Endpoint)", () => {
    it("should accept PAUSE command on ACTIVE run and transition controlState to PAUSE_REQUESTED", async () => {
      const { POST } = await import("../../app/api/v1/runs/[runId]/commands/route");

      const req = new Request(`http://localhost:3000/api/v1/runs/${testRunId}/commands`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "PAUSE", reason: "Operator pause request" }),
      });

      const res = await POST(req as unknown as NextRequest, { params: Promise.resolve({ runId: testRunId }) });
      expect(res.status).toBe(202);

      const body = await res.json();
      expect(body.accepted).toBe(true);
      expect(body.runControlState).toBe("PAUSE_REQUESTED");

      const dbRun = await prisma.run.findFirst({ where: { externalId: testRunId } });
      expect(dbRun?.controlState).toBe("PAUSE_REQUESTED");

      const dbCmd = await prisma.runCommand.findFirst({ where: { runId: dbRun?.id } });
      expect(dbCmd?.type).toBe("PAUSE");
      expect(dbCmd?.status).toBe("PENDING");
    });

    it("should forbid Agent API Keys from issuing control commands with 403", async () => {
      const { POST } = await import("../../app/api/v1/runs/[runId]/commands/route");

      const req = new Request(`http://localhost:3000/api/v1/runs/${testRunId}/commands`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${testApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ type: "PAUSE" }),
      });

      const res = await POST(req as unknown as NextRequest, { params: Promise.resolve({ runId: testRunId }) });
      expect(res.status).toBe(403);
    });

    it("should return HTTP 409 Conflict when attempting RESUME on an ACTIVE run", async () => {
      const { POST } = await import("../../app/api/v1/runs/[runId]/commands/route");

      const req = new Request(`http://localhost:3000/api/v1/runs/${testRunId}/commands`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "RESUME" }),
      });

      const res = await POST(req as unknown as NextRequest, { params: Promise.resolve({ runId: testRunId }) });
      expect(res.status).toBe(409);
    });

    it("should return HTTP 409 Conflict when issuing duplicate unresolved commands", async () => {
      const { POST } = await import("../../app/api/v1/runs/[runId]/commands/route");

      const createReq = () =>
        new Request(`http://localhost:3000/api/v1/runs/${testRunId}/commands`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type: "PAUSE" }),
        });

      const res1 = await POST(createReq() as unknown as NextRequest, { params: Promise.resolve({ runId: testRunId }) });
      expect(res1.status).toBe(202);

      const res2 = await POST(createReq() as unknown as NextRequest, { params: Promise.resolve({ runId: testRunId }) });
      expect(res2.status).toBe(409);
    });

    it("should allow CANCEL command to override pending PAUSE request", async () => {
      const { POST } = await import("../../app/api/v1/runs/[runId]/commands/route");

      // First request PAUSE
      const pauseReq = new Request(`http://localhost:3000/api/v1/runs/${testRunId}/commands`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "PAUSE" }),
      });
      await POST(pauseReq as unknown as NextRequest, { params: Promise.resolve({ runId: testRunId }) });

      // Then request CANCEL
      const cancelReq = new Request(`http://localhost:3000/api/v1/runs/${testRunId}/commands`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "CANCEL", reason: "Emergency cancel" }),
      });

      const res = await POST(cancelReq as unknown as NextRequest, { params: Promise.resolve({ runId: testRunId }) });
      expect(res.status).toBe(202);

      const body = await res.json();
      expect(body.runControlState).toBe("CANCEL_REQUESTED");
    });
  });

  describe("Agent Command Lifecycle APIs (GET pending, POST ack/complete/fail)", () => {
    it("should require project API key for GET pending commands", async () => {
      const { GET } = await import("../../app/api/v1/runs/[runId]/commands/pending/route");

      const req = new Request(`http://localhost:3000/api/v1/runs/${testRunId}/commands/pending`, {
        method: "GET",
        headers: { Authorization: "Bearer invalid_key" },
      });

      const res = await GET(req as unknown as NextRequest, { params: Promise.resolve({ runId: testRunId }) });
      expect(res.status).toBe(401);
    });

    it("should process command acknowledgement, completion, and update control state", async () => {
      const { POST: postCmd } = await import("../../app/api/v1/runs/[runId]/commands/route");
      const { GET: getPending } = await import("../../app/api/v1/runs/[runId]/commands/pending/route");
      const { POST: postAck } = await import("../../app/api/v1/runs/[runId]/commands/[commandId]/acknowledge/route");
      const { POST: postComplete } = await import("../../app/api/v1/runs/[runId]/commands/[commandId]/complete/route");

      // 1. Dashboard issues PAUSE command
      const cmdReq = new Request(`http://localhost:3000/api/v1/runs/${testRunId}/commands`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "PAUSE" }),
      });
      await postCmd(cmdReq as unknown as NextRequest, { params: Promise.resolve({ runId: testRunId }) });

      // 2. Agent polls pending commands
      const pendingReq = new Request(`http://localhost:3000/api/v1/runs/${testRunId}/commands/pending`, {
        method: "GET",
        headers: { Authorization: `Bearer ${testApiKey}` },
      });
      const pendingRes = await getPending(pendingReq as unknown as NextRequest, { params: Promise.resolve({ runId: testRunId }) });
      const pendingBody = await pendingRes.json();
      expect(pendingBody.commands.length).toBe(1);
      const cmd = pendingBody.commands[0];

      // 3. Agent acknowledges command
      const ackReq = new Request(`http://localhost:3000/api/v1/runs/${testRunId}/commands/${cmd.externalId}/acknowledge`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${testApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: "ACKNOWLEDGED" }),
      });
      const ackRes = await postAck(ackReq as unknown as NextRequest, { params: Promise.resolve({ runId: testRunId, commandId: cmd.externalId }) });
      expect(ackRes.status).toBe(200);

      // 4. Agent completes command
      const cmplReq = new Request(`http://localhost:3000/api/v1/runs/${testRunId}/commands/${cmd.externalId}/complete`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${testApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: "COMPLETED", result: { state: "PAUSED", tokenSecret: "secret" } }),
      });
      const cmplRes = await postComplete(cmplReq as unknown as NextRequest, { params: Promise.resolve({ runId: testRunId, commandId: cmd.externalId }) });
      expect(cmplRes.status).toBe(200);

      const cmplBody = await cmplRes.json();
      expect(cmplBody.runControlState).toBe("PAUSED");

      // Verify DB state
      const dbRun = await prisma.run.findFirst({ where: { externalId: testRunId } });
      expect(dbRun?.controlState).toBe("PAUSED");
    });
  });

  describe("Lazy Command Expiration", () => {
    it("should lazily expire unacknowledged commands older than 5 minutes", async () => {
      const { GET: getPending } = await import("../../app/api/v1/runs/[runId]/commands/pending/route");

      const runDb = await prisma.run.findFirst({ where: { externalId: testRunId } });

      // Create an old pending command directly
      const oldDate = new Date(Date.now() - 360000); // 6 minutes ago
      await prisma.runCommand.create({
        data: {
          projectId: testProjectId,
          runId: runDb!.id,
          externalId: "cmd_old_001",
          type: "PAUSE",
          status: "PENDING",
          requestedAt: oldDate,
        },
      });

      const pendingReq = new Request(`http://localhost:3000/api/v1/runs/${testRunId}/commands/pending`, {
        method: "GET",
        headers: { Authorization: `Bearer ${testApiKey}` },
      });

      const pendingRes = await getPending(pendingReq as unknown as NextRequest, { params: Promise.resolve({ runId: testRunId }) });
      expect(pendingRes.status).toBe(200);

      const pendingBody = await pendingRes.json();
      expect(pendingBody.commands.length).toBe(0);

      const dbCmd = await prisma.runCommand.findFirst({ where: { externalId: "cmd_old_001" } });
      expect(dbCmd?.status).toBe("EXPIRED");
    });
  });
});
