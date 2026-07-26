import { beforeAll, afterAll, describe, expect, it } from "vitest";
import { prisma } from "../db";
import { createProjectApiKey, authenticateApiKey } from "../api-keys";
import { ingestEvent } from "../event-ingestion";
import { POST } from "../../app/api/v1/events/route";

describe("Milestone 2: Authenticated & Idempotent Event Ingestion", () => {
  let projectA: { id: string; name: string; slug: string };
  let projectB: { id: string; name: string; slug: string };
  let keyASecret: string;
  let revokedKeySecret: string;

  beforeAll(async () => {
    // Setup test projects
    projectA = await prisma.project.create({
      data: { name: "Test Project A", slug: `test-project-a-${Date.now()}` },
    });
    projectB = await prisma.project.create({
      data: { name: "Test Project B", slug: `test-project-b-${Date.now()}` },
    });

    const keyAResult = await createProjectApiKey(projectA.id, "Key A");
    keyASecret = keyAResult.secretKey;

    await createProjectApiKey(projectB.id, "Key B");

    const revokedResult = await createProjectApiKey(projectA.id, "Revoked Key");
    revokedKeySecret = revokedResult.secretKey;
    await prisma.projectApiKey.update({
      where: { id: revokedResult.apiKeyRecord.id },
      data: { revokedAt: new Date() },
    });
  });

  afterAll(async () => {
    // Clean up test projects
    if (projectA) {
      await prisma.project.delete({ where: { id: projectA.id } }).catch(() => {});
    }
    if (projectB) {
      await prisma.project.delete({ where: { id: projectB.id } }).catch(() => {});
    }
    await prisma.$disconnect();
  });

  describe("API Key Authentication", () => {
    it("should reject missing Authorization header", async () => {
      const auth = await authenticateApiKey(null);
      expect(auth.authenticated).toBe(false);

      const req = new Request("http://localhost:3000/api/v1/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const res = await POST(req);
      expect(res.status).toBe(401);
      const data = await res.json();
      expect(data.error).toBeDefined();
    });

    it("should reject invalid API key", async () => {
      const auth = await authenticateApiKey("Bearer stwd_live_invalid_key_123");
      expect(auth.authenticated).toBe(false);

      const req = new Request("http://localhost:3000/api/v1/events", {
        method: "POST",
        headers: {
          Authorization: "Bearer stwd_live_invalid_key_123",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({}),
      });
      const res = await POST(req);
      expect(res.status).toBe(401);
      const data = await res.json();
      expect(data.error).toBe("Invalid or revoked API key");
    });

    it("should reject revoked API key", async () => {
      const auth = await authenticateApiKey(`Bearer ${revokedKeySecret}`);
      expect(auth.authenticated).toBe(false);

      const req = new Request("http://localhost:3000/api/v1/events", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${revokedKeySecret}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({}),
      });
      const res = await POST(req);
      expect(res.status).toBe(401);
      const data = await res.json();
      expect(data.error).toBe("Invalid or revoked API key");
    });

    it("should authenticate valid API key", async () => {
      const auth = await authenticateApiKey(`Bearer ${keyASecret}`);
      expect(auth.authenticated).toBe(true);
      if (auth.authenticated) {
        expect(auth.project.id).toBe(projectA.id);
      }
    });
  });

  describe("Event Validation & Rejection", () => {
    it("should return HTTP 400 for an invalid event payload", async () => {
      const invalidEvent = {
        specVersion: "1.0",
        eventId: "evt_invalid_01",
        eventType: "agent.registered",
        occurredAt: "2026-07-26T02:00:00.000Z",
        agentKey: "agent_alpha",
        payload: {}, // Missing required 'name' field
      };

      const req = new Request("http://localhost:3000/api/v1/events", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${keyASecret}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(invalidEvent),
      });

      const res = await POST(req);
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toBeDefined();

      // Ensure invalid event was NOT stored in database
      const dbEvent = await prisma.event.findFirst({
        where: { externalId: "evt_invalid_01" },
      });
      expect(dbEvent).toBeNull();
    });
  });

  describe("Valid Event Ingestion & Idempotency", () => {
    const testEventId = `evt_valid_${Date.now()}`;
    const testRunId = `run_${Date.now()}`;
    const validEvent = {
      specVersion: "1.0",
      eventId: testEventId,
      eventType: "run.started",
      occurredAt: "2026-07-26T02:00:00.000Z",
      agentKey: "agent_steward_01",
      runId: testRunId,
      sequence: 1,
      payload: {
        task: "Execute test suite",
      },
    };

    it("should successfully ingest new event with HTTP 201", async () => {
      const req = new Request("http://localhost:3000/api/v1/events", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${keyASecret}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(validEvent),
      });

      const res = await POST(req);
      expect(res.status).toBe(201);
      const data = await res.json();
      expect(data.accepted).toBe(true);
      expect(data.duplicate).toBe(false);
      expect(data.eventId).toBeDefined();

      // Verify event in DB
      const dbEvent = await prisma.event.findUnique({
        where: { id: data.eventId },
      });
      expect(dbEvent).not.toBeNull();
      expect(dbEvent?.externalId).toBe(testEventId);
      expect(dbEvent?.projectId).toBe(projectA.id);
    });

    it("should return HTTP 200 with duplicate: true when ingesting the exact same event again", async () => {
      const req = new Request("http://localhost:3000/api/v1/events", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${keyASecret}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(validEvent),
      });

      const res = await POST(req);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.accepted).toBe(true);
      expect(data.duplicate).toBe(true);
      expect(data.eventId).toBeDefined();

      // Verify event count in DB remains 1
      const count = await prisma.event.count({
        where: { projectId: projectA.id, externalId: testEventId },
      });
      expect(count).toBe(1);
    });
  });

  describe("Run Creation & Lifecycle Status Updates", () => {
    const lifecycleRunId = `run_lifecycle_${Date.now()}`;

    it("should create run on run.started and set status to running", async () => {
      const event = {
        specVersion: "1.0",
        eventId: `evt_start_${Date.now()}`,
        eventType: "run.started",
        occurredAt: "2026-07-26T02:10:00.000Z",
        agentKey: "agent_steward_01",
        runId: lifecycleRunId,
        payload: { task: "Lifecycle test task" },
      };

      const result = await ingestEvent(projectA.id, event);
      expect(result.success).toBe(true);

      const run = await prisma.run.findUnique({
        where: {
          projectId_externalId: {
            projectId: projectA.id,
            externalId: lifecycleRunId,
          },
        },
      });
      expect(run).not.toBeNull();
      expect(run?.status).toBe("running");
      expect(run?.agentName).toBe("agent_steward_01");
      expect(run?.startedAt.toISOString()).toBe("2026-07-26T02:10:00.000Z");
      expect(run?.endedAt).toBeNull();
    });

    it("should update run status to paused on run.paused", async () => {
      const event = {
        specVersion: "1.0",
        eventId: `evt_pause_${Date.now()}`,
        eventType: "run.paused",
        occurredAt: "2026-07-26T02:11:00.000Z",
        agentKey: "agent_steward_01",
        runId: lifecycleRunId,
        payload: { reason: "User requested pause" },
      };

      const result = await ingestEvent(projectA.id, event);
      expect(result.success).toBe(true);

      const run = await prisma.run.findUnique({
        where: {
          projectId_externalId: {
            projectId: projectA.id,
            externalId: lifecycleRunId,
          },
        },
      });
      expect(run?.status).toBe("paused");
    });

    it("should update run status to running on run.resumed", async () => {
      const event = {
        specVersion: "1.0",
        eventId: `evt_resume_${Date.now()}`,
        eventType: "run.resumed",
        occurredAt: "2026-07-26T02:12:00.000Z",
        agentKey: "agent_steward_01",
        runId: lifecycleRunId,
        payload: { reason: "User resumed run" },
      };

      const result = await ingestEvent(projectA.id, event);
      expect(result.success).toBe(true);

      const run = await prisma.run.findUnique({
        where: {
          projectId_externalId: {
            projectId: projectA.id,
            externalId: lifecycleRunId,
          },
        },
      });
      expect(run?.status).toBe("running");
    });

    it("should update run status to completed and set endedAt on run.completed", async () => {
      const event = {
        specVersion: "1.0",
        eventId: `evt_complete_${Date.now()}`,
        eventType: "run.completed",
        occurredAt: "2026-07-26T02:15:00.000Z",
        agentKey: "agent_steward_01",
        runId: lifecycleRunId,
        payload: { summary: "All tasks completed successfully" },
      };

      const result = await ingestEvent(projectA.id, event);
      expect(result.success).toBe(true);

      const run = await prisma.run.findUnique({
        where: {
          projectId_externalId: {
            projectId: projectA.id,
            externalId: lifecycleRunId,
          },
        },
      });
      expect(run?.status).toBe("completed");
      expect(run?.endedAt?.toISOString()).toBe("2026-07-26T02:15:00.000Z");
    });

    it("should update run status to failed and set endedAt on run.failed", async () => {
      const failedRunId = `run_failed_${Date.now()}`;
      const event = {
        specVersion: "1.0",
        eventId: `evt_fail_${Date.now()}`,
        eventType: "run.failed",
        occurredAt: "2026-07-26T02:20:00.000Z",
        agentKey: "agent_steward_01",
        runId: failedRunId,
        payload: { error: "Fatal execution error" },
      };

      const result = await ingestEvent(projectA.id, event);
      expect(result.success).toBe(true);

      const run = await prisma.run.findUnique({
        where: {
          projectId_externalId: {
            projectId: projectA.id,
            externalId: failedRunId,
          },
        },
      });
      expect(run?.status).toBe("failed");
      expect(run?.endedAt?.toISOString()).toBe("2026-07-26T02:20:00.000Z");
    });
  });

  describe("Project Boundary Isolation", () => {
    it("should isolate events and runs across different projects", async () => {
      const sharedEventId = `evt_boundary_${Date.now()}`;
      const sharedRunId = `run_boundary_${Date.now()}`;

      const eventA = {
        specVersion: "1.0",
        eventId: sharedEventId,
        eventType: "run.started",
        occurredAt: "2026-07-26T02:30:00.000Z",
        agentKey: "agent_project_a",
        runId: sharedRunId,
        payload: { task: "Project A task" },
      };

      // Ingest under Project A
      const resA = await ingestEvent(projectA.id, eventA);
      expect(resA.success).toBe(true);
      if (resA.success) {
        expect(resA.duplicate).toBe(false);
      }

      // Ingest same event ID under Project B
      const resB = await ingestEvent(projectB.id, eventA);
      expect(resB.success).toBe(true);
      if (resB.success) {
        expect(resB.duplicate).toBe(false);
      }

      // Verify two separate Event records exist in DB under different projectIds
      const dbEventA = await prisma.event.findUnique({
        where: {
          projectId_externalId: {
            projectId: projectA.id,
            externalId: sharedEventId,
          },
        },
      });

      const dbEventB = await prisma.event.findUnique({
        where: {
          projectId_externalId: {
            projectId: projectB.id,
            externalId: sharedEventId,
          },
        },
      });

      expect(dbEventA).not.toBeNull();
      expect(dbEventB).not.toBeNull();
      expect(dbEventA?.id).not.toBe(dbEventB?.id);
      expect(dbEventA?.projectId).toBe(projectA.id);
      expect(dbEventB?.projectId).toBe(projectB.id);
    });
  });
});
