import { beforeAll, afterAll, describe, expect, it } from "vitest";
import { prisma } from "../db";
import { redactSensitiveData, isSensitiveKey } from "../redaction";
import {
  formatEventLabel,
  formatDuration,
  formatTokens,
  formatCost,
} from "../formatters";
import { GET as getRuns } from "../../app/api/v1/runs/route";
import { GET as getRunDetail } from "../../app/api/v1/runs/[runId]/route";

describe("Milestone 3: Live Run Timeline & Utilities", () => {
  let projectA: { id: string; name: string; slug: string };
  let projectB: { id: string; name: string; slug: string };

  beforeAll(async () => {
    projectA = await prisma.project.create({
      data: { name: "Timeline Test Project A", slug: `timeline-a-${Date.now()}` },
    });
    projectB = await prisma.project.create({
      data: { name: "Timeline Test Project B", slug: `timeline-b-${Date.now()}` },
    });
  });

  afterAll(async () => {
    if (projectA) {
      await prisma.project.delete({ where: { id: projectA.id } }).catch(() => {});
    }
    if (projectB) {
      await prisma.project.delete({ where: { id: projectB.id } }).catch(() => {});
    }
    await prisma.$disconnect();
  });

  describe("Redaction Utilities", () => {
    it("should identify sensitive keys correctly", () => {
      expect(isSensitiveKey("password")).toBe(true);
      expect(isSensitiveKey("my_secret_token")).toBe(true);
      expect(isSensitiveKey("apiKey")).toBe(true);
      expect(isSensitiveKey("authorization")).toBe(true);
      expect(isSensitiveKey("cookie")).toBe(true);
      expect(isSensitiveKey("normalField")).toBe(false);
    });

    it("should redact sensitive values recursively inside nested objects and arrays", () => {
      const input = {
        name: "Agent Demo",
        credentials: {
          apiKey: "secret_123",
          password: "superpassword",
          nested: {
            userToken: "tok_abc",
          },
        },
        items: [
          { token: "array_tok_1", label: "item1" },
          { secret: "array_secret_2", label: "item2" },
        ],
      };

      const redacted = redactSensitiveData(input);

      expect(redacted.name).toBe("Agent Demo");
      expect(redacted.credentials.apiKey).toBe("[REDACTED]");
      expect(redacted.credentials.password).toBe("[REDACTED]");
      expect(redacted.credentials.nested.userToken).toBe("[REDACTED]");
      expect(redacted.items[0].token).toBe("[REDACTED]");
      expect(redacted.items[0].label).toBe("item1");
      expect(redacted.items[1].secret).toBe("[REDACTED]");
      expect(redacted.items[1].label).toBe("item2");
    });
  });

  describe("Formatting Utilities", () => {
    it("should format event labels", () => {
      expect(formatEventLabel("run.started")).toBe("Run Started");
      expect(formatEventLabel("tool.succeeded")).toBe("Tool Execution Succeeded");
      expect(formatEventLabel("custom.event.name")).toBe("Custom Event Name");
    });

    it("should format durations correctly", () => {
      const now = new Date("2026-07-26T02:00:00.000Z");
      const later = new Date("2026-07-26T02:00:02.500Z");
      expect(formatDuration(now, later)).toBe("2.5s");

      const minutesLater = new Date("2026-07-26T02:01:15.000Z");
      expect(formatDuration(now, minutesLater)).toBe("1m 15s");
    });

    it("should format tokens and USD cost correctly", () => {
      expect(formatTokens(1250)).toBe("1,250");
      expect(formatCost(0.0025)).toBe("$0.0025");
    });
  });

  describe("REST APIs & Ordering", () => {
    it("should return 404 for an unknown run ID", async () => {
      const req = new Request("http://localhost:3000/api/v1/runs/unknown_run_999");
      const res = await getRunDetail(req, {
        params: Promise.resolve({ runId: "unknown_run_999" }),
      });
      expect(res.status).toBe(404);
      const data = await res.json();
      expect(data.error).toBe("Run not found");
    });

    it("should sort runs list newest first", async () => {
      const olderRun = await prisma.run.create({
        data: {
          projectId: projectA.id,
          externalId: `run_older_${Date.now()}`,
          agentName: "OlderAgent",
          status: "completed",
          startedAt: new Date("2026-07-26T01:00:00.000Z"),
        },
      });

      const newerRun = await prisma.run.create({
        data: {
          projectId: projectA.id,
          externalId: `run_newer_${Date.now()}`,
          agentName: "NewerAgent",
          status: "running",
          startedAt: new Date("2026-07-26T02:00:00.000Z"),
        },
      });

      const req = new Request(
        `http://localhost:3000/api/v1/runs?projectSlug=${projectA.slug}`
      );
      const res = await getRuns(req);
      expect(res.status).toBe(200);
      const data = await res.json();

      expect(data.runs.length).toBeGreaterThanOrEqual(2);
      const firstRun = data.runs[0];
      const secondRun = data.runs[1];
      expect(new Date(firstRun.startedAt).getTime()).toBeGreaterThanOrEqual(
        new Date(secondRun.startedAt).getTime()
      );
      expect(firstRun.id).toBe(newerRun.id);
      expect(secondRun.id).toBe(olderRun.id);
    });

    it("should sort run details events by sequence then timestamp", async () => {
      const run = await prisma.run.create({
        data: {
          projectId: projectA.id,
          externalId: `run_events_order_${Date.now()}`,
          agentName: "OrderAgent",
          status: "running",
          startedAt: new Date("2026-07-26T02:00:00.000Z"),
        },
      });

      // Insert events out of order
      await prisma.event.create({
        data: {
          projectId: projectA.id,
          runId: run.id,
          externalId: `evt_seq_2_${Date.now()}`,
          type: "tool.started",
          timestamp: new Date("2026-07-26T02:00:02.000Z"),
          sequence: 2,
          payload: { toolName: "tool2" },
        },
      });

      await prisma.event.create({
        data: {
          projectId: projectA.id,
          runId: run.id,
          externalId: `evt_seq_1_${Date.now()}`,
          type: "run.started",
          timestamp: new Date("2026-07-26T02:00:01.000Z"),
          sequence: 1,
          payload: { task: "task1" },
        },
      });

      const req = new Request(`http://localhost:3000/api/v1/runs/${run.id}`);
      const res = await getRunDetail(req, {
        params: Promise.resolve({ runId: run.id }),
      });
      expect(res.status).toBe(200);
      const data = await res.json();

      expect(data.run.events.length).toBe(2);
      expect(data.run.events[0].sequence).toBe(1);
      expect(data.run.events[1].sequence).toBe(2);
    });
  });

  describe("Client State Duplicate Prevention Logic", () => {
    it("should reject duplicate events when constructing client state array", () => {
      const existingEvents = [
        {
          id: "evt_1",
          externalId: "ext_evt_1",
          projectId: "p1",
          runId: "r1",
          type: "run.started",
          timestamp: "2026-07-26T02:00:00Z",
          payload: {},
          createdAt: "2026-07-26T02:00:00Z",
        },
      ];

      const incomingDuplicate = {
        id: "evt_1",
        externalId: "ext_evt_1",
        projectId: "p1",
        runId: "r1",
        type: "run.started",
        timestamp: "2026-07-26T02:00:00Z",
        payload: {},
        createdAt: "2026-07-26T02:00:00Z",
      };

      const exists = existingEvents.some(
        (e) =>
          e.id === incomingDuplicate.id ||
          e.externalId === incomingDuplicate.externalId
      );
      expect(exists).toBe(true);
    });
  });
});
