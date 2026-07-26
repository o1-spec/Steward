import { describe, expect, it, vi } from "vitest";
import {
  Steward,
  StewardConfigError,
  StewardStateError,
  StewardApiError,
  StewardRunCancelledError,
  createRedactor,
} from "../index";

describe("@steward/sdk Test Suite", () => {
  const mockApiKey = "stwd_live_testkey12345";
  const mockBaseUrl = "http://localhost:3000";
  const mockAgentName = "test-agent";

  describe("Configuration Validation & API Key Protection", () => {
    it("should throw StewardConfigError when required parameters are missing", () => {
      expect(() => new Steward({ apiKey: "", baseUrl: mockBaseUrl, agentName: mockAgentName })).toThrow(
        StewardConfigError
      );
      expect(() => new Steward({ apiKey: mockApiKey, baseUrl: "", agentName: mockAgentName })).toThrow(
        StewardConfigError
      );
      expect(() => new Steward({ apiKey: mockApiKey, baseUrl: "invalid-url", agentName: mockAgentName })).toThrow(
        StewardConfigError
      );
      expect(() => new Steward({ apiKey: mockApiKey, baseUrl: mockBaseUrl, agentName: "" })).toThrow(
        StewardConfigError
      );
    });

    it("should never expose API key in error messages or stringified outputs", () => {
      try {
        new Steward({ apiKey: mockApiKey, baseUrl: "invalid-url", agentName: mockAgentName });
      } catch (err: unknown) {
        expect((err as Error).message).not.toContain(mockApiKey);
      }
    });
  });

  describe("Redaction Utility", () => {
    it("should recursively redact sensitive fields inside objects and arrays", () => {
      const redactor = createRedactor(["customSecret"]);
      const input = {
        user: "alice",
        apiKey: "key_123",
        token: "tok_456",
        customSecret: "sec_789",
        nested: {
          password: "pass",
        },
        list: [{ authorization: "Bearer xyz" }],
      };

      const result = redactor(input);
      expect(result.user).toBe("alice");
      expect(result.apiKey).toBe("[REDACTED]");
      expect(result.token).toBe("[REDACTED]");
      expect(result.customSecret).toBe("[REDACTED]");
      expect(result.nested.password).toBe("[REDACTED]");
      expect(result.list[0].authorization).toBe("[REDACTED]");
    });
  });

  describe("Run State Machine & Generated IDs", () => {
    it("should generate runId if omitted and track state transitions", async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        status: 201,
        json: async () => ({ accepted: true, duplicate: false, eventId: "evt_100" }),
      });

      const steward = new Steward({
        apiKey: mockApiKey,
        baseUrl: mockBaseUrl,
        agentName: mockAgentName,
        fetch: mockFetch,
      });

      const run = steward.startRun();
      expect(run.runId).toBeDefined();
      expect(run.runId.startsWith("run_")).toBe(true);
      expect(run.getState()).toBe("created");

      await run.started({ task: "Initial Task" });
      expect(run.getState()).toBe("running");

      await run.completed({ summary: "Done" });
      expect(run.getState()).toBe("completed");
    });

    it("should prevent invalid transitions and emitting events after terminal state", async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        status: 201,
        json: async () => ({ accepted: true, duplicate: false, eventId: "evt_100" }),
      });

      const steward = new Steward({
        apiKey: mockApiKey,
        baseUrl: mockBaseUrl,
        agentName: mockAgentName,
        fetch: mockFetch,
      });

      const run = steward.startRun();
      await run.started();
      await run.completed();

      // Cannot completed again
      await expect(run.completed()).rejects.toThrow(StewardStateError);
      // Cannot start after completion
      await expect(run.started()).rejects.toThrow(StewardStateError);
      // Cannot emit event after terminal state
      await expect(run.emitEvent({ eventType: "tool.started", agentKey: mockAgentName, payload: {} })).rejects.toThrow(
        StewardStateError
      );
    });
  });

  describe("Sequence Ordering & Delivery", () => {
    it("should assign monotonically increasing sequence numbers and delivery headers", async () => {
      const sentEnvelopes: Record<string, unknown>[] = [];
      const mockFetch = vi.fn().mockImplementation(async (_url, init) => {
        sentEnvelopes.push(JSON.parse(init.body));
        return {
          status: 201,
          json: async () => ({ accepted: true, duplicate: false, eventId: "evt_db" }),
        };
      });

      const steward = new Steward({
        apiKey: mockApiKey,
        baseUrl: mockBaseUrl,
        agentName: mockAgentName,
        fetch: mockFetch,
      });

      const run = steward.startRun({ runId: "run_seq_test" });
      await run.started();
      const agent = run.agent({ name: "worker" });
      await agent.started();
      await run.completed();

      expect(sentEnvelopes.length).toBe(3);
      expect(sentEnvelopes[0].sequence).toBe(1);
      expect(sentEnvelopes[1].sequence).toBe(2);
      expect(sentEnvelopes[2].sequence).toBe(3);
      expect(mockFetch).toHaveBeenCalledWith(
        "http://localhost:3000/api/v1/events",
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: `Bearer ${mockApiKey}`,
          }),
        })
      );
    });

    it("should handle HTTP 200 duplicate response as success", async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        status: 200,
        json: async () => ({ accepted: true, duplicate: true, eventId: "evt_existing" }),
      });

      const steward = new Steward({
        apiKey: mockApiKey,
        baseUrl: mockBaseUrl,
        agentName: mockAgentName,
        fetch: mockFetch,
      });

      const run = steward.startRun();
      await expect(run.started()).resolves.not.toThrow();
    });
  });

  describe("Retries & Error Handling", () => {
    it("should retry transient 500/429/network errors and succeed on retry", async () => {
      let attempts = 0;
      const mockFetch = vi.fn().mockImplementation(async () => {
        attempts++;
        if (attempts === 1) {
          return { status: 503, text: async () => "Service Unavailable" };
        }
        return {
          status: 201,
          json: async () => ({ accepted: true, duplicate: false, eventId: "evt_retry_ok" }),
        };
      });

      const steward = new Steward({
        apiKey: mockApiKey,
        baseUrl: mockBaseUrl,
        agentName: mockAgentName,
        fetch: mockFetch,
        maxRetries: 2,
      });

      const run = steward.startRun();
      await run.started();
      expect(attempts).toBe(2);
    });

    it("should NOT retry HTTP 400 or 401 errors", async () => {
      let attempts = 0;
      const mockFetch = vi.fn().mockImplementation(async () => {
        attempts++;
        return { status: 401, text: async () => "Unauthorized" };
      });

      const steward = new Steward({
        apiKey: mockApiKey,
        baseUrl: mockBaseUrl,
        agentName: mockAgentName,
        fetch: mockFetch,
        maxRetries: 3,
      });

      const run = steward.startRun();
      await expect(run.started()).rejects.toThrow(StewardApiError);
      expect(attempts).toBe(1);
    });

    it("should fail on request timeout", async () => {
      const mockFetch = vi.fn().mockImplementation(async (_url, init) => {
        return new Promise((_, reject) => {
          const signal = init.signal;
          signal?.addEventListener("abort", () => {
            const err = new Error("The operation was aborted");
            err.name = "AbortError";
            reject(err);
          });
        });
      });

      const steward = new Steward({
        apiKey: mockApiKey,
        baseUrl: mockBaseUrl,
        agentName: mockAgentName,
        fetch: mockFetch,
        timeout: 50,
        maxRetries: 0,
      });

      const run = steward.startRun();
      await expect(run.started()).rejects.toThrow(StewardApiError);
    });
  });

  describe("Model Call & Tool Call Instrumentation", () => {
    it("should instrument model calls and rethrow original callback error on failure", async () => {
      const sentEnvelopes: Record<string, unknown>[] = [];
      const mockFetch = vi.fn().mockImplementation(async (_url, init) => {
        sentEnvelopes.push(JSON.parse(init.body));
        return {
          status: 201,
          json: async () => ({ accepted: true, duplicate: false, eventId: "evt_1" }),
        };
      });

      const steward = new Steward({
        apiKey: mockApiKey,
        baseUrl: mockBaseUrl,
        agentName: mockAgentName,
        fetch: mockFetch,
      });

      const run = steward.startRun();
      const agent = run.agent({ name: "model-worker" });

      const res = await agent.modelCall(
        { provider: "openai", model: "gpt-4o", inputSummary: "Test prompt" },
        async ({ recordOutput } = { recordOutput: () => {} }) => {
          recordOutput({ inputTokens: 10, outputTokens: 20, totalTokens: 30, costUsd: 0.001 });
          return "model output text";
        }
      );

      expect(res).toBe("model output text");
      expect(sentEnvelopes.length).toBe(2);
      expect(sentEnvelopes[0].eventType).toBe("model.started");
      expect(sentEnvelopes[1].eventType).toBe("model.completed");
      expect((sentEnvelopes[1].payload as Record<string, unknown>).totalTokens).toBe(30);

      // Model failure
      await expect(
        agent.modelCall({ provider: "openai", model: "gpt-4o" }, async () => {
          throw new Error("API rate limit error");
        })
      ).rejects.toThrow("API rate limit error");

      expect(sentEnvelopes[sentEnvelopes.length - 1].eventType).toBe("model.failed");
    });

    it("should instrument tool calls with arguments redaction and rethrow on error", async () => {
      const sentEnvelopes: Record<string, unknown>[] = [];
      const mockFetch = vi.fn().mockImplementation(async (_url, init) => {
        sentEnvelopes.push(JSON.parse(init.body));
        return {
          status: 201,
          json: async () => ({ accepted: true, duplicate: false, eventId: "evt_1" }),
        };
      });

      const steward = new Steward({
        apiKey: mockApiKey,
        baseUrl: mockBaseUrl,
        agentName: mockAgentName,
        fetch: mockFetch,
      });

      const run = steward.startRun();
      const agent = run.agent({ name: "tool-worker" });

      const toolResult = await agent.toolCall(
        { toolName: "search_db", arguments: { secretToken: "tok_123", query: "steward" } },
        async () => {
          return { status: "found" };
        }
      );

      expect(toolResult).toEqual({ status: "found" });
      const firstPayload = sentEnvelopes[0].payload as { arguments?: Record<string, unknown> };
      expect(firstPayload.arguments?.secretToken).toBe("[REDACTED]");
      expect(sentEnvelopes[1].eventType).toBe("tool.succeeded");

      await expect(
        agent.toolCall({ toolName: "broken_tool" }, async () => {
          throw new Error("Tool execution failed");
        })
      ).rejects.toThrow("Tool execution failed");

      expect(sentEnvelopes[sentEnvelopes.length - 1].eventType).toBe("tool.failed");
    });
  });

  describe("Human Approval Gates Instrumentation", () => {
    it("should execute guarded tool callback once after approval", async () => {
      let pollCount = 0;
      const mockFetch = vi.fn().mockImplementation(async (url) => {
        if (url.includes("/approval-requests") && !url.includes("appr_")) {
          return {
            status: 201,
            json: async () => ({ accepted: true, duplicate: false }),
          };
        }
        pollCount++;
        return {
          status: 200,
          json: async () => ({
            id: "db_1",
            externalId: "appr_123",
            status: pollCount >= 2 ? "APPROVED" : "PENDING",
          }),
        };
      });

      const steward = new Steward({
        apiKey: mockApiKey,
        baseUrl: mockBaseUrl,
        agentName: mockAgentName,
        fetch: mockFetch,
      });

      const run = steward.startRun();
      const agent = run.agent({ name: "guarded-worker" });

      let callbackRan = false;
      const res = await agent.guardedToolCall(
        { toolName: "github.mergePR", reason: "Merge feature branch" },
        async () => {
          callbackRan = true;
          return { merged: true };
        }
      );

      expect(callbackRan).toBe(true);
      expect(res).toEqual({ merged: true });
    });

    it("should NEVER execute guarded tool callback when approval is rejected", async () => {
      const mockFetch = vi.fn().mockImplementation(async (url) => {
        if (url.includes("/approval-requests") && !url.includes("appr_")) {
          return {
            status: 201,
            json: async () => ({ accepted: true, duplicate: false }),
          };
        }
        return {
          status: 200,
          json: async () => ({
            id: "db_1",
            externalId: "appr_rejected",
            status: "REJECTED",
            decisionReason: "Security policy block",
          }),
        };
      });

      const steward = new Steward({
        apiKey: mockApiKey,
        baseUrl: mockBaseUrl,
        agentName: mockAgentName,
        fetch: mockFetch,
      });

      const run = steward.startRun();
      const agent = run.agent({ name: "guarded-worker" });

      let callbackRan = false;
      await expect(
        agent.guardedToolCall(
          { toolName: "deploy.prod", reason: "Deploy to production" },
          async () => {
            callbackRan = true;
            return { deployed: true };
          }
        )
      ).rejects.toThrow();

      expect(callbackRan).toBe(false);
    });
  });

  describe("Cooperative Agent Controls & Checkpoints", () => {
    it("should allow checkpoint to return immediately when run is ACTIVE", async () => {
      const mockFetch = vi.fn().mockImplementation(async () => ({
        status: 200,
        json: async () => ({ accepted: true }),
      }));

      const steward = new Steward({
        apiKey: mockApiKey,
        baseUrl: mockBaseUrl,
        agentName: mockAgentName,
        fetch: mockFetch,
      });

      const run = steward.startRun();
      await expect(run.checkpoint()).resolves.toBeUndefined();
    });

    it("should reject checkpoint with StewardRunCancelledError when run is CANCELLED", async () => {
      const mockFetch = vi.fn().mockImplementation(async () => ({
        status: 200,
        json: async () => ({ accepted: true }),
      }));

      const steward = new Steward({
        apiKey: mockApiKey,
        baseUrl: mockBaseUrl,
        agentName: mockAgentName,
        fetch: mockFetch,
      });

      const run = steward.startRun();
      await run.cancelled({ reason: "Operator cancelled" });

      await expect(run.checkpoint()).rejects.toThrow(StewardRunCancelledError);
    });

    it("should pause execution at checkpoint when PAUSED and resume when RESUMED", async () => {
      let pendingCmds = [
        { id: "c1", externalId: "c1", type: "PAUSE", status: "PENDING" },
      ];

      const mockFetch = vi.fn().mockImplementation(async (url) => {
        if (url.includes("/commands/pending")) {
          const res = [...pendingCmds];
          pendingCmds = [];
          return {
            status: 200,
            json: async () => ({ commands: res }),
          };
        }
        return {
          status: 200,
          json: async () => ({ success: true }),
        };
      });

      const steward = new Steward({
        apiKey: mockApiKey,
        baseUrl: mockBaseUrl,
        agentName: mockAgentName,
        fetch: mockFetch,
      });

      const run = steward.startRun();
      let pauseExecuted = false;

      run.startCommandListener({
        pollIntervalMs: 50,
        onPause: async () => {
          pauseExecuted = true;
        },
      });

      // Wait for poll
      await new Promise((res) => setTimeout(res, 100));
      expect(pauseExecuted).toBe(true);
      expect(run.getControlState()).toBe("PAUSED");

      run.stopCommandListener();
    });
  });
});
