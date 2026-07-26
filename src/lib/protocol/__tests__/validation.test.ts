import { describe, expect, it } from "vitest";
import { validateEvent } from "../validation";
import { STEWARD_EVENT_TYPES, StewardEventType } from "../event-types";

describe("Steward V1 Protocol Validation", () => {
  const baseEnvelope = {
    specVersion: "1.0",
    eventId: "evt_12345",
    occurredAt: "2026-07-26T02:30:00.000Z",
    agentKey: "agent_alpha_01",
    runId: "run_999",
    stepId: "step_001",
    actionId: "act_777",
    sequence: 1,
  };

  const validPayloads: Record<StewardEventType, unknown> = {
    "agent.registered": {
      name: "SupervisionAgent",
      version: "1.0.0",
      capabilities: ["cli", "code-edit"],
    },
    "agent.heartbeat": {
      status: "online",
      cpuUsage: 0.15,
      memoryUsage: 512,
      activeRunCount: 2,
    },
    "agent.started": {
      name: "ResearchAgent",
      input: { task: "Search literature" },
    },
    "agent.completed": {
      summary: "Agent finished literature search",
      output: { papersFound: 10 },
    },
    "agent.failed": {
      error: "Agent encountered unhandled exception",
      code: "ERR_UNHANDLED",
    },
    "run.started": {
      runId: "run_999",
      task: "Run system diagnosis",
    },
    "run.paused": {
      reason: "Waiting for human approval",
    },
    "run.resumed": {
      reason: "Human granted permission",
    },
    "run.completed": {
      summary: "Completed successfully",
      result: { ok: true },
    },
    "run.failed": {
      error: "Command timed out",
      code: "ERR_TIMEOUT",
    },
    "run.cancelled": {
      reason: "Cancelled by user",
      cancelledBy: "admin",
    },
    "step.started": {
      stepId: "step_001",
      name: "Initialize sandbox",
    },
    "step.completed": {
      stepId: "step_001",
      output: { status: "ready" },
    },
    "step.failed": {
      stepId: "step_001",
      error: "Sandbox initialization failed",
    },
    "model.started": {
      provider: "openai",
      model: "gpt-4o",
      inputSummary: "Summarize research document",
    },
    "model.completed": {
      provider: "openai",
      model: "gpt-4o",
      outputSummary: "Document summary generated",
      durationMs: 1200,
      inputTokens: 500,
      outputTokens: 150,
      totalTokens: 650,
      costUsd: 0.0025,
    },
    "model.failed": {
      provider: "openai",
      model: "gpt-4o",
      error: "Rate limit exceeded",
      durationMs: 300,
    },
    "tool.requested": {
      toolName: "run_command",
      arguments: { command: "ls -la" },
    },
    "tool.started": {
      toolName: "run_command",
    },
    "tool.succeeded": {
      toolName: "run_command",
      result: { exitCode: 0, stdout: "file1.txt" },
    },
    "tool.failed": {
      toolName: "run_command",
      error: "Permission denied",
    },
    "approval.requested": {
      approvalId: "appr_100",
      action: "execute_root_command",
      description: "Require permission to run bash",
    },
    "approval.resolved": {
      approvalId: "appr_100",
      approved: true,
      resolvedBy: "supervisor_1",
    },
    "approval.approved": {
      approvalId: "appr_100",
      decidedBy: "supervisor_1",
      reason: "Permitted after review",
    },
    "approval.rejected": {
      approvalId: "appr_100",
      decidedBy: "supervisor_1",
      reason: "Security policy violation",
    },
    "approval.expired": {
      approvalId: "appr_100",
      reason: "Request timed out after 300 seconds",
    },
    "approval.cancelled": {
      approvalId: "appr_100",
      reason: "Run terminated before decision",
    },
    "command.requested": {
      commandId: "cmd_456",
      commandType: "PAUSE",
      requestedBy: "operator_01",
      reason: "Inspect agent state",
    },
    "command.acknowledged": {
      commandId: "cmd_456",
      status: "ACKNOWLEDGED",
    },
    "command.completed": {
      commandId: "cmd_456",
      commandType: "PAUSE",
      result: { state: "PAUSED" },
    },
    "command.failed": {
      commandId: "cmd_456",
      commandType: "PAUSE",
      error: { message: "Checkpoint unreachable" },
    },
    "command.expired": {
      commandId: "cmd_456",
      commandType: "PAUSE",
      reason: "Command unacknowledged after 5 minutes",
    },
  };

  describe("Valid Events", () => {
    STEWARD_EVENT_TYPES.forEach((eventType) => {
      it(`should validate a valid ${eventType} event`, () => {
        const rawEvent = {
          ...baseEnvelope,
          eventType,
          payload: validPayloads[eventType],
          metadata: {
            environment: "production",
            attempt: 1,
            isRetry: false,
          },
        };

        const result = validateEvent(rawEvent);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.specVersion).toBe("1.0");
          expect(result.data.eventType).toBe(eventType);
          expect(result.data.eventId).toBe("evt_12345");
          expect(result.data.agentKey).toBe("agent_alpha_01");
          expect(result.data.sequence).toBe(1);
          expect(result.data.payload).toEqual(validPayloads[eventType]);
        }
      });
    });
  });

  describe("Envelope Rejections", () => {
    it("should reject an invalid protocol version", () => {
      const rawEvent = {
        ...baseEnvelope,
        specVersion: "2.0",
        eventType: "agent.heartbeat",
        payload: validPayloads["agent.heartbeat"],
      };

      const result = validateEvent(rawEvent);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe("UNSUPPORTED_SPEC_VERSION");
      }
    });

    it("should reject an invalid/unknown event type", () => {
      const rawEvent = {
        ...baseEnvelope,
        eventType: "invalid.event.type",
        payload: {},
      };

      const result = validateEvent(rawEvent);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe("INVALID_EVENT_TYPE");
      }
    });

    it("should reject empty eventId", () => {
      const rawEvent = {
        ...baseEnvelope,
        eventId: "",
        eventType: "agent.heartbeat",
        payload: validPayloads["agent.heartbeat"],
      };

      const result = validateEvent(rawEvent);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe("MISSING_IDENTIFIER");
      }
    });

    it("should reject empty agentKey", () => {
      const rawEvent = {
        ...baseEnvelope,
        agentKey: "",
        eventType: "agent.heartbeat",
        payload: validPayloads["agent.heartbeat"],
      };

      const result = validateEvent(rawEvent);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe("MISSING_IDENTIFIER");
      }
    });

    it("should reject malformed timestamp", () => {
      const rawEvent = {
        ...baseEnvelope,
        occurredAt: "not-a-timestamp",
        eventType: "agent.heartbeat",
        payload: validPayloads["agent.heartbeat"],
      };

      const result = validateEvent(rawEvent);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe("INVALID_TIMESTAMP");
      }
    });

    it("should reject negative sequence values", () => {
      const rawEvent = {
        ...baseEnvelope,
        sequence: -10,
        eventType: "agent.heartbeat",
        payload: validPayloads["agent.heartbeat"],
      };

      const result = validateEvent(rawEvent);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe("NEGATIVE_SEQUENCE");
      }
    });

    it("should reject metadata containing nested objects", () => {
      const rawEvent = {
        ...baseEnvelope,
        eventType: "agent.heartbeat",
        payload: validPayloads["agent.heartbeat"],
        metadata: {
          nestedObj: { invalid: true },
        },
      };

      const result = validateEvent(rawEvent);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe("INVALID_METADATA");
      }
    });

    it("should reject metadata containing arrays", () => {
      const rawEvent = {
        ...baseEnvelope,
        eventType: "agent.heartbeat",
        payload: validPayloads["agent.heartbeat"],
        metadata: {
          arrayVal: [1, 2, 3],
        },
      };

      const result = validateEvent(rawEvent);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe("INVALID_METADATA");
      }
    });
  });

  describe("Payload Rejections", () => {
    it("should reject invalid event-specific payload missing mandatory fields", () => {
      const rawEvent = {
        ...baseEnvelope,
        eventType: "agent.registered",
        payload: {}, // Missing required 'name'
      };

      const result = validateEvent(rawEvent);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe("INVALID_PAYLOAD");
      }
    });

    it("should reject approval.resolved payload missing boolean approved field", () => {
      const rawEvent = {
        ...baseEnvelope,
        eventType: "approval.resolved",
        payload: {
          approvalId: "appr_001",
        },
      };

      const result = validateEvent(rawEvent);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe("INVALID_PAYLOAD");
      }
    });
  });
});
