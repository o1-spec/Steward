import { z } from "zod";
import { StewardEventType } from "./event-types";
import { EventEnvelopeSchema, StewardEventEnvelope } from "./event-envelope";
import { payloadSchemas } from "./payload-schemas";
import { ProtocolValidationError } from "./protocol-errors";

export type ValidationResult<T = StewardEventEnvelope> =
  | { success: true; data: T; error?: undefined }
  | { success: false; data?: undefined; error: ProtocolValidationError };

function mapZodIssueToProtocolError(
  issue: z.ZodIssue
): ProtocolValidationError {
  const firstPath = issue.path[0];

  if (firstPath === "specVersion") {
    return new ProtocolValidationError(
      "UNSUPPORTED_SPEC_VERSION",
      issue.message || 'Unsupported spec version. Expected "1.0"',
      issue,
      issue.path
    );
  }
  if (firstPath === "eventType") {
    return new ProtocolValidationError(
      "INVALID_EVENT_TYPE",
      issue.message || "Unknown or invalid event type",
      issue,
      issue.path
    );
  }
  if (firstPath === "eventId" || firstPath === "agentKey") {
    return new ProtocolValidationError(
      "MISSING_IDENTIFIER",
      issue.message ||
        `Required identifier '${String(firstPath)}' is missing or empty`,
      issue,
      issue.path
    );
  }
  if (firstPath === "occurredAt") {
    return new ProtocolValidationError(
      "INVALID_TIMESTAMP",
      issue.message || "Invalid timestamp format",
      issue,
      issue.path
    );
  }
  if (firstPath === "sequence") {
    return new ProtocolValidationError(
      "NEGATIVE_SEQUENCE",
      issue.message || "Sequence value cannot be negative",
      issue,
      issue.path
    );
  }
  if (firstPath === "metadata") {
    return new ProtocolValidationError(
      "INVALID_METADATA",
      "Metadata values must be primitive strings, numbers, or booleans (objects and arrays are not allowed)",
      issue,
      issue.path
    );
  }

  return new ProtocolValidationError(
    "SCHEMA_VALIDATION_ERROR",
    issue.message || "Envelope schema validation error",
    issue,
    issue.path
  );
}

export function validateEvent(raw: unknown): ValidationResult<StewardEventEnvelope> {
  if (!raw || typeof raw !== "object") {
    return {
      success: false,
      error: new ProtocolValidationError(
        "SCHEMA_VALIDATION_ERROR",
        "Event envelope must be a non-null object"
      ),
    };
  }

  const envelopeParseResult = EventEnvelopeSchema.safeParse(raw);
  if (!envelopeParseResult.success) {
    const primaryIssue = envelopeParseResult.error.issues[0];
    const error = primaryIssue
      ? mapZodIssueToProtocolError(primaryIssue)
      : new ProtocolValidationError(
          "SCHEMA_VALIDATION_ERROR",
          "Envelope validation failed"
        );
    return {
      success: false,
      error,
    };
  }

  const envelopeData = envelopeParseResult.data;
  const payloadSchema = payloadSchemas[envelopeData.eventType as StewardEventType];

  if (!payloadSchema) {
    return {
      success: false,
      error: new ProtocolValidationError(
        "INVALID_EVENT_TYPE",
        `Unknown event type '${envelopeData.eventType}'`
      ),
    };
  }

  const payloadParseResult = payloadSchema.safeParse(envelopeData.payload);
  if (!payloadParseResult.success) {
    const firstIssue = payloadParseResult.error.issues[0];
    const issuePath = firstIssue ? firstIssue.path : [];
    return {
      success: false,
      error: new ProtocolValidationError(
        "INVALID_PAYLOAD",
        `Invalid payload for event '${envelopeData.eventType}': ${
          firstIssue ? firstIssue.message : "validation failed"
        }`,
        payloadParseResult.error.issues,
        ["payload", ...issuePath]
      ),
    };
  }

  const validatedEnvelope: StewardEventEnvelope = {
    specVersion: envelopeData.specVersion,
    eventId: envelopeData.eventId,
    eventType: envelopeData.eventType,
    occurredAt: envelopeData.occurredAt,
    agentKey: envelopeData.agentKey,
    runId: envelopeData.runId,
    stepId: envelopeData.stepId,
    actionId: envelopeData.actionId,
    sequence: envelopeData.sequence,
    payload: payloadParseResult.data,
    metadata: envelopeData.metadata,
  };

  return {
    success: true,
    data: validatedEnvelope,
  };
}
