export type ProtocolErrorCode =
  | "UNSUPPORTED_SPEC_VERSION"
  | "INVALID_EVENT_TYPE"
  | "MISSING_IDENTIFIER"
  | "INVALID_TIMESTAMP"
  | "NEGATIVE_SEQUENCE"
  | "INVALID_METADATA"
  | "INVALID_PAYLOAD"
  | "SCHEMA_VALIDATION_ERROR";

export class ProtocolValidationError extends Error {
  public readonly code: ProtocolErrorCode;
  public readonly details?: unknown;
  public readonly path?: (string | number | symbol)[];

  constructor(
    code: ProtocolErrorCode,
    message: string,
    details?: unknown,
    path?: (string | number | symbol)[]
  ) {
    super(message);
    this.name = "ProtocolValidationError";
    this.code = code;
    this.details = details;
    this.path = path;
    Object.setPrototypeOf(this, ProtocolValidationError.prototype);
  }
}
