import { z } from "zod";
import { StewardEventType, StewardEventTypeSchema } from "./event-types";

export const MetadataValueSchema = z.union([
  z.string(),
  z.number(),
  z.boolean(),
]);

export const MetadataSchema = z.record(z.string(), MetadataValueSchema);

export type StewardMetadata = z.infer<typeof MetadataSchema>;

export const TimestampSchema = z.string().refine(
  (val) => {
    if (typeof val !== "string" || val.trim() === "") {
      return false;
    }
    const timestamp = Date.parse(val);
    return !isNaN(timestamp);
  },
  {
    message: "Invalid timestamp",
  }
);

export const EventEnvelopeSchema = z.object({
  specVersion: z.literal("1.0", {
    message: 'Unsupported spec version. Expected "1.0"',
  }),
  eventId: z.string().min(1, "eventId cannot be empty"),
  eventType: StewardEventTypeSchema,
  occurredAt: TimestampSchema,
  agentKey: z.string().min(1, "agentKey cannot be empty"),
  runId: z.string().optional(),
  stepId: z.string().optional(),
  actionId: z.string().optional(),
  sequence: z
    .number()
    .int("sequence must be an integer")
    .min(0, "sequence cannot be negative")
    .optional(),
  payload: z.unknown(),
  metadata: MetadataSchema.optional(),
});

export type StewardEventEnvelope<T = unknown> = {
  specVersion: "1.0";
  eventId: string;
  eventType: StewardEventType;
  occurredAt: string;
  agentKey: string;
  runId?: string;
  stepId?: string;
  actionId?: string;
  sequence?: number;
  payload: T;
  metadata?: Record<string, string | number | boolean>;
};
