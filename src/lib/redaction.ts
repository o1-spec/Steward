import { createRedactor, DEFAULT_SENSITIVE_KEYS, isSensitiveKey } from "../../packages/steward-sdk/src/redaction";

const defaultRedactor = createRedactor();

export function redactSensitiveData<T>(data: T, customKeys: string[] = []): T {
  if (customKeys.length === 0) {
    return defaultRedactor(data);
  }
  return createRedactor(customKeys)(data);
}

export { DEFAULT_SENSITIVE_KEYS, isSensitiveKey };
