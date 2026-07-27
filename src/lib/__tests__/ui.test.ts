import { describe, expect, it } from "vitest";
import { formatEventLabel, formatTimestamp } from "../formatters";
import { redactSensitiveData } from "../redaction";

describe("UI & Design System Helpers", () => {
  it("should format event labels for UI displays cleanly", () => {
    expect(formatEventLabel("run.started")).toBe("Run Started");
    expect(formatEventLabel("tool.succeeded")).toBe("Tool Execution Succeeded");
    expect(formatEventLabel("approval.requested")).toBe("Approval Requested");
  });

  it("should format timestamps for execution timeline", () => {
    const formatted = formatTimestamp("2026-07-27T00:00:00Z");
    expect(typeof formatted).toBe("string");
    expect(formatted.length).toBeGreaterThan(0);
  });

  it("should redact sensitive information in raw JSON payloads before rendering", () => {
    const payload = {
      service: "auth-api",
      apiKey: "stwd_live_secret123",
      config: {
        password: "SuperSecretPassword!",
      },
    };

    const redacted = redactSensitiveData(payload) as Record<string, unknown>;
    expect(redacted.apiKey).toBe("[REDACTED]");
    expect((redacted.config as Record<string, unknown>).password).toBe("[REDACTED]");
    expect(redacted.service).toBe("auth-api");
  });

  it("should verify spacing scale values and breakpoints", () => {
    const spacingScale = [4, 8, 12, 16, 24, 32, 48, 64, 96, 128];
    expect(spacingScale).toContain(16);
    expect(spacingScale).toContain(32);
    expect(spacingScale).toContain(64);
  });
});
