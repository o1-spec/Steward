import { z } from "zod";

export const STEWARD_EVENT_TYPES = [
  "agent.registered",
  "agent.heartbeat",
  "run.started",
  "run.paused",
  "run.resumed",
  "run.completed",
  "run.failed",
  "run.cancelled",
  "step.started",
  "step.completed",
  "step.failed",
  "tool.requested",
  "tool.started",
  "tool.succeeded",
  "tool.failed",
  "approval.requested",
  "approval.resolved",
  "command.acknowledged",
] as const;

export type StewardEventType = (typeof STEWARD_EVENT_TYPES)[number];

export const StewardEventTypeSchema = z.enum(STEWARD_EVENT_TYPES);
