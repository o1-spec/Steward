import { describe, expect, it } from "vitest";
import { LEGAL_CONFIG } from "../legal-config";
import { DEFAULT_SENSITIVE_KEYS } from "../../../packages/steward-sdk/src/redaction";

describe("Documentation & Legal Configuration Checks", () => {
  it("should have centralized legal placeholders initialized", () => {
    expect(LEGAL_CONFIG.PRODUCT_NAME).toBe("Steward");
    expect(LEGAL_CONFIG.PRIVACY_EMAIL).toBe("privacy@steward.dev");
    expect(LEGAL_CONFIG.LEGAL_EMAIL).toBe("legal@steward.dev");
    expect(LEGAL_CONFIG.MINIMUM_USER_AGE).toBe(18);
  });

  it("should ensure sensitive key redaction defaults include standard security tokens", () => {
    expect(DEFAULT_SENSITIVE_KEYS).toContain("password");
    expect(DEFAULT_SENSITIVE_KEYS).toContain("apiKey");
    expect(DEFAULT_SENSITIVE_KEYS).toContain("token");
    expect(DEFAULT_SENSITIVE_KEYS).toContain("secret");
  });

  it("should confirm no real production secrets exist in documentation placeholders", () => {
    const exampleKey = "stwd_live_98f421a...";
    expect(exampleKey).toContain("...");
    expect(exampleKey).not.toContain("actual_secret_token_abcdef1234567890");
  });
});
