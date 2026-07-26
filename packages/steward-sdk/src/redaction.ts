export const DEFAULT_SENSITIVE_KEYS = [
  "password",
  "passwd",
  "token",
  "accessToken",
  "refreshToken",
  "apiKey",
  "secret",
  "authorization",
  "cookie",
  "set-cookie",
  "privateKey",
];

const TOKEN_COUNT_KEYS = new Set([
  "totaltokens",
  "inputtokens",
  "outputtokens",
  "prompttokens",
  "completiontokens",
]);

export function isSensitiveKey(key: string, customKeys: string[] = []): boolean {
  const lower = key.toLowerCase();

  // Custom keys: substring match
  if (customKeys.some((k) => lower.includes(k.toLowerCase()))) {
    return true;
  }

  // Preserve token metrics (e.g. totalTokens, inputTokens, outputTokens)
  if (TOKEN_COUNT_KEYS.has(lower)) {
    return false;
  }

  // Default sensitive keys
  for (const sKey of DEFAULT_SENSITIVE_KEYS) {
    const sLower = sKey.toLowerCase();
    if (lower.includes(sLower)) {
      return true;
    }
  }

  return false;
}

export function createRedactor(customKeys: string[] = []) {
  function redact<T>(data: T): T {
    if (data === null || data === undefined) {
      return data;
    }

    if (typeof data !== "object") {
      return data;
    }

    if (Array.isArray(data)) {
      return data.map((item) => redact(item)) as unknown as T;
    }

    const redactedObj: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(data as Record<string, unknown>)) {
      if (isSensitiveKey(key, customKeys)) {
        redactedObj[key] = "[REDACTED]";
      } else if (typeof value === "object" && value !== null) {
        redactedObj[key] = redact(value);
      } else {
        redactedObj[key] = value;
      }
    }

    return redactedObj as unknown as T;
  }

  return redact;
}
