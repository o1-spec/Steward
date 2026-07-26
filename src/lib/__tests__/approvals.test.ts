import { describe, expect, it, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { prisma } from "../db";
import { generateApiKeySecret, hashApiKey } from "../api-keys";

describe("Milestone 5: Human Approval Gates & Security Tests", () => {
  let testProjectId: string;
  let testApiKey: string;
  let testRunId: string;

  beforeEach(async () => {
    // Clear test tables
    await prisma.auditLog.deleteMany({});
    await prisma.approvalRequest.deleteMany({});
    await prisma.event.deleteMany({});
    await prisma.run.deleteMany({});
    await prisma.projectMember.deleteMany({});
    await prisma.session.deleteMany({});
    await prisma.user.deleteMany({});

    const user = await prisma.user.create({
      data: { email: `appr_user_${Date.now()}@steward.dev`, passwordHash: "hash" },
    });

    // Create test project and API key
    const project = await prisma.project.create({
      data: {
        name: "Test Approval Project",
        slug: `test-approval-project-${Math.random().toString(36).substring(2)}`,
      },
    });
    testProjectId = project.id;

    await prisma.projectMember.create({
      data: { projectId: project.id, userId: user.id, role: "OWNER" },
    });

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
        externalId: "run_approval_test_001",
        agentName: "deployment_agent",
        status: "running",
        startedAt: new Date(),
      },
    });
    testRunId = run.externalId;
  });

  describe("POST /api/v1/approval-requests", () => {
    it("should create an approval request with redacted sensitive arguments", async () => {
      const { POST } = await import("../../app/api/v1/approval-requests/route");

      const req = new Request("http://localhost:3000/api/v1/approval-requests", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${testApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          externalId: "appr_req_001",
          runId: testRunId,
          agentName: "deployment_agent",
          toolName: "github.mergePR",
          arguments: {
            repository: "org/repo",
            apiToken: "secret_github_token_123",
          },
          reason: "Merge release branch into main",
          riskLevel: "high",
          expiresInSeconds: 300,
        }),
      });

      const res = await POST(req as unknown as NextRequest);
      expect(res.status).toBe(201);

      const body = await res.json();
      expect(body.accepted).toBe(true);
      expect(body.duplicate).toBe(false);
      expect(body.approvalRequest.externalId).toBe("appr_req_001");
      expect(body.approvalRequest.arguments.apiToken).toBe("[REDACTED]");

      // Check DB
      const dbRequest = await prisma.approvalRequest.findUnique({
        where: { id: body.approvalRequest.id },
      });
      expect(dbRequest).toBeDefined();
      expect(dbRequest?.status).toBe("PENDING");
      expect((dbRequest?.arguments as Record<string, unknown>).apiToken).toBe("[REDACTED]");

      // Check timeline event
      const event = await prisma.event.findFirst({
        where: { type: "approval.requested" },
      });
      expect(event).toBeDefined();
    });

    it("should return duplicate response idempotently for duplicate externalId", async () => {
      const { POST } = await import("../../app/api/v1/approval-requests/route");

      const createReq = () =>
        new Request("http://localhost:3000/api/v1/approval-requests", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${testApiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            externalId: "appr_dup_001",
            runId: testRunId,
            agentName: "deployment_agent",
            toolName: "deploy.prod",
            arguments: { env: "prod" },
            reason: "Deploy to production",
            expiresInSeconds: 300,
          }),
        });

      const res1 = await POST(createReq() as unknown as NextRequest);
      expect(res1.status).toBe(201);

      const res2 = await POST(createReq() as unknown as NextRequest);
      expect(res2.status).toBe(200);

      const body2 = await res2.json();
      expect(body2.duplicate).toBe(true);
    });

    it("should reject unauthenticated requests with 401", async () => {
      const { POST } = await import("../../app/api/v1/approval-requests/route");

      const req = new Request("http://localhost:3000/api/v1/approval-requests", {
        method: "POST",
        headers: {
          Authorization: "Bearer invalid_key",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          externalId: "appr_unauth",
          runId: testRunId,
          agentName: "agent",
          toolName: "tool",
          reason: "reason",
        }),
      });

      const res = await POST(req as unknown as NextRequest);
      expect(res.status).toBe(401);
    });
  });

  describe("GET /api/v1/approval-requests/:externalId (Lazy Expiration)", () => {
    it("should lazily expire pending request when past expiresAt", async () => {
      const { GET } = await import("../../app/api/v1/approval-requests/[id]/route");

      // Create an expired request directly
      const past = new Date(Date.now() - 5000);
      const reqDb = await prisma.approvalRequest.create({
        data: {
          projectId: testProjectId,
          runId: (await prisma.run.findFirst())!.id,
          externalId: "appr_exp_001",
          agentName: "deployment_agent",
          toolName: "db.migrate",
          arguments: {},
          reason: "Run migration",
          status: "PENDING",
          requestedAt: new Date(Date.now() - 300000),
          expiresAt: past,
        },
      });

      const req = new Request("http://localhost:3000/api/v1/approval-requests/appr_exp_001", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${testApiKey}`,
        },
      });

      const res = await GET(req as unknown as NextRequest, { params: Promise.resolve({ id: "appr_exp_001" }) });
      expect(res.status).toBe(200);

      const body = await res.json();
      expect(body.status).toBe("EXPIRED");

      // Check DB
      const updated = await prisma.approvalRequest.findUnique({ where: { id: reqDb.id } });
      expect(updated?.status).toBe("EXPIRED");
    });
  });

  describe("POST /api/v1/approval-requests/:id/decision (Human Decisions & Security)", () => {
    it("should forbid Agent API Keys from accessing decision endpoint with 403", async () => {
      const { POST } = await import("../../app/api/v1/approval-requests/[id]/decision/route");

      const req = new Request("http://localhost:3000/api/v1/approval-requests/appr_dummy/decision", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${testApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ decision: "APPROVED" }),
      });

      const res = await POST(req as unknown as NextRequest, { params: Promise.resolve({ id: "appr_dummy" }) });
      expect(res.status).toBe(403);
    });

    it("should atomically record decision APPROVED and audit log entry", async () => {
      const { POST } = await import("../../app/api/v1/approval-requests/[id]/decision/route");

      const approval = await prisma.approvalRequest.create({
        data: {
          projectId: testProjectId,
          runId: (await prisma.run.findFirst())!.id,
          externalId: "appr_dec_001",
          agentName: "deployment_agent",
          toolName: "deploy.prod",
          arguments: {},
          reason: "Deploy to prod",
          status: "PENDING",
          expiresAt: new Date(Date.now() + 300000),
        },
      });

      const req = new Request(`http://localhost:3000/api/v1/approval-requests/${approval.id}/decision`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          decision: "APPROVED",
          reason: "Reviewed by Lead Engineer",
          decidedBy: "lead_dev",
        }),
      });

      const res = await POST(req as unknown as NextRequest, { params: Promise.resolve({ id: approval.id }) });
      expect(res.status).toBe(200);

      const body = await res.json();
      expect(body.success).toBe(true);
      expect(body.approvalRequest.status).toBe("APPROVED");
      expect(body.approvalRequest.decisionReason).toBe("Reviewed by Lead Engineer");

      // Check Audit Log
      const audit = await prisma.auditLog.findFirst({
        where: { approvalRequestId: approval.id },
      });
      expect(audit).toBeDefined();
      expect(audit?.action).toBe("DECISION_APPROVED");
      expect(audit?.outcome).toBe("SUCCESS");
    });

    it("should return HTTP 409 Conflict when attempting to decide an already-decided request", async () => {
      const { POST } = await import("../../app/api/v1/approval-requests/[id]/decision/route");

      const approval = await prisma.approvalRequest.create({
        data: {
          projectId: testProjectId,
          runId: (await prisma.run.findFirst())!.id,
          externalId: "appr_dec_conflict",
          agentName: "deployment_agent",
          toolName: "deploy.prod",
          arguments: {},
          reason: "Deploy to prod",
          status: "APPROVED",
          expiresAt: new Date(Date.now() + 300000),
        },
      });

      const req = new Request(`http://localhost:3000/api/v1/approval-requests/${approval.id}/decision`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ decision: "REJECTED" }),
      });

      const res = await POST(req as unknown as NextRequest, { params: Promise.resolve({ id: approval.id }) });
      expect(res.status).toBe(409);
    });
  });
});
