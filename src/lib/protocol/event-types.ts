import { z } from "zod";

export const STEWARD_EVENT_TYPES = [
  "agent.registered",
  "agent.heartbeat",
  "agent.started",
  "agent.completed",
  "agent.failed",
  "run.started",
  "run.paused",
  "run.resumed",
  "run.completed",
  "run.failed",
  "run.cancelled",
  "step.started",
  "step.completed",
  "step.failed",
  "model.started",
  "model.completed",
  "model.failed",
  "tool.requested",
  "tool.started",
  "tool.succeeded",
  "tool.failed",
  "approval.requested",
  "approval.resolved",
  "approval.approved",
  "approval.rejected",
  "approval.expired",
  "approval.cancelled",
  "command.requested",
  "command.acknowledged",
  "command.completed",
  "command.failed",
  "command.expired",
] as const;

export type StewardEventType = (typeof STEWARD_EVENT_TYPES)[number];

export const StewardEventTypeSchema = z.enum(STEWARD_EVENT_TYPES);
