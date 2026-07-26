import { z } from "zod";
import { StewardEventType } from "./event-types";

export const AgentRegisteredPayloadSchema = z.object({
  name: z.string().min(1, "Agent name is required"),
  version: z.string().optional(),
  capabilities: z.array(z.string()).optional(),
});
export type AgentRegisteredPayload = z.infer<typeof AgentRegisteredPayloadSchema>;

export const AgentHeartbeatPayloadSchema = z.object({
  status: z.string().min(1, "Status is required"),
  cpuUsage: z.number().optional(),
  memoryUsage: z.number().optional(),
  activeRunCount: z.number().optional(),
});
export type AgentHeartbeatPayload = z.infer<typeof AgentHeartbeatPayloadSchema>;

export const AgentStartedPayloadSchema = z.object({
  agentId: z.string().optional(),
  name: z.string().optional(),
  input: z.unknown().optional(),
});
export type AgentStartedPayload = z.infer<typeof AgentStartedPayloadSchema>;

export const AgentCompletedPayloadSchema = z.object({
  agentId: z.string().optional(),
  output: z.unknown().optional(),
  summary: z.string().optional(),
});
export type AgentCompletedPayload = z.infer<typeof AgentCompletedPayloadSchema>;

export const AgentFailedPayloadSchema = z.object({
  agentId: z.string().optional(),
  error: z.string().min(1, "Error message is required"),
  code: z.string().optional(),
});
export type AgentFailedPayload = z.infer<typeof AgentFailedPayloadSchema>;

export const RunStartedPayloadSchema = z.object({
  runId: z.string().optional(),
  task: z.string().min(1, "Task description is required"),
  input: z.record(z.string(), z.unknown()).optional(),
  parameters: z.record(z.string(), z.unknown()).optional(),
});
export type RunStartedPayload = z.infer<typeof RunStartedPayloadSchema>;

export const RunPausedPayloadSchema = z.object({
  reason: z.string().optional(),
  pausedAt: z.string().optional(),
});
export type RunPausedPayload = z.infer<typeof RunPausedPayloadSchema>;

export const RunResumedPayloadSchema = z.object({
  reason: z.string().optional(),
  resumedAt: z.string().optional(),
});
export type RunResumedPayload = z.infer<typeof RunResumedPayloadSchema>;

export const RunCompletedPayloadSchema = z.object({
  result: z.unknown().optional(),
  summary: z.string().optional(),
  output: z.record(z.string(), z.unknown()).optional(),
});
export type RunCompletedPayload = z.infer<typeof RunCompletedPayloadSchema>;

export const RunFailedPayloadSchema = z.object({
  error: z.string().min(1, "Error message is required"),
  code: z.string().optional(),
  stack: z.string().optional(),
});
export type RunFailedPayload = z.infer<typeof RunFailedPayloadSchema>;

export const RunCancelledPayloadSchema = z.object({
  reason: z.string().optional(),
  cancelledBy: z.string().optional(),
});
export type RunCancelledPayload = z.infer<typeof RunCancelledPayloadSchema>;

export const StepStartedPayloadSchema = z.object({
  stepId: z.string().optional(),
  name: z.string().min(1, "Step name is required"),
  input: z.unknown().optional(),
});
export type StepStartedPayload = z.infer<typeof StepStartedPayloadSchema>;

export const StepCompletedPayloadSchema = z.object({
  stepId: z.string().optional(),
  output: z.unknown().optional(),
  summary: z.string().optional(),
});
export type StepCompletedPayload = z.infer<typeof StepCompletedPayloadSchema>;

export const StepFailedPayloadSchema = z.object({
  stepId: z.string().optional(),
  error: z.string().min(1, "Error message is required"),
  code: z.string().optional(),
});
export type StepFailedPayload = z.infer<typeof StepFailedPayloadSchema>;

export const ModelStartedPayloadSchema = z.object({
  provider: z.string().min(1, "Provider is required"),
  model: z.string().min(1, "Model name is required"),
  inputSummary: z.string().optional(),
});
export type ModelStartedPayload = z.infer<typeof ModelStartedPayloadSchema>;

export const ModelCompletedPayloadSchema = z.object({
  provider: z.string().min(1, "Provider is required"),
  model: z.string().min(1, "Model name is required"),
  outputSummary: z.string().optional(),
  durationMs: z.number().optional(),
  inputTokens: z.number().optional(),
  outputTokens: z.number().optional(),
  totalTokens: z.number().optional(),
  costUsd: z.number().optional(),
});
export type ModelCompletedPayload = z.infer<typeof ModelCompletedPayloadSchema>;

export const ModelFailedPayloadSchema = z.object({
  provider: z.string().min(1, "Provider is required"),
  model: z.string().min(1, "Model name is required"),
  error: z.string().min(1, "Error message is required"),
  durationMs: z.number().optional(),
});
export type ModelFailedPayload = z.infer<typeof ModelFailedPayloadSchema>;

export const ToolRequestedPayloadSchema = z.object({
  toolName: z.string().min(1, "Tool name is required"),
  arguments: z.record(z.string(), z.unknown()),
  requestId: z.string().optional(),
});
export type ToolRequestedPayload = z.infer<typeof ToolRequestedPayloadSchema>;

export const ToolStartedPayloadSchema = z.object({
  toolName: z.string().min(1, "Tool name is required"),
  arguments: z.record(z.string(), z.unknown()).optional(),
});
export type ToolStartedPayload = z.infer<typeof ToolStartedPayloadSchema>;

export const ToolSucceededPayloadSchema = z.object({
  toolName: z.string().min(1, "Tool name is required"),
  result: z.unknown(),
});
export type ToolSucceededPayload = z.infer<typeof ToolSucceededPayloadSchema>;

export const ToolFailedPayloadSchema = z.object({
  toolName: z.string().min(1, "Tool name is required"),
  error: z.string().min(1, "Error message is required"),
  code: z.string().optional(),
});
export type ToolFailedPayload = z.infer<typeof ToolFailedPayloadSchema>;

export const ApprovalRequestedPayloadSchema = z.object({
  approvalId: z.string().min(1, "Approval ID is required"),
  action: z.string().optional(),
  toolName: z.string().optional(),
  description: z.string().optional(),
  reason: z.string().optional(),
  riskLevel: z.string().optional(),
  context: z.record(z.string(), z.unknown()).optional(),
});
export type ApprovalRequestedPayload = z.infer<typeof ApprovalRequestedPayloadSchema>;

export const ApprovalResolvedPayloadSchema = z.object({
  approvalId: z.string().min(1, "Approval ID is required"),
  approved: z.boolean({ message: "approved status is required" }),
  resolvedBy: z.string().optional(),
  reason: z.string().optional(),
});
export type ApprovalResolvedPayload = z.infer<typeof ApprovalResolvedPayloadSchema>;

export const ApprovalApprovedPayloadSchema = z.object({
  approvalId: z.string().min(1, "Approval ID is required"),
  decidedBy: z.string().optional(),
  reason: z.string().optional(),
});
export type ApprovalApprovedPayload = z.infer<typeof ApprovalApprovedPayloadSchema>;

export const ApprovalRejectedPayloadSchema = z.object({
  approvalId: z.string().min(1, "Approval ID is required"),
  decidedBy: z.string().optional(),
  reason: z.string().optional(),
});
export type ApprovalRejectedPayload = z.infer<typeof ApprovalRejectedPayloadSchema>;

export const ApprovalExpiredPayloadSchema = z.object({
  approvalId: z.string().min(1, "Approval ID is required"),
  reason: z.string().optional(),
});
export type ApprovalExpiredPayload = z.infer<typeof ApprovalExpiredPayloadSchema>;

export const ApprovalCancelledPayloadSchema = z.object({
  approvalId: z.string().min(1, "Approval ID is required"),
  reason: z.string().optional(),
});
export type ApprovalCancelledPayload = z.infer<typeof ApprovalCancelledPayloadSchema>;

export const CommandRequestedPayloadSchema = z.object({
  commandId: z.string().min(1, "Command ID is required"),
  commandType: z.string().min(1, "Command type is required"),
  requestedBy: z.string().optional(),
  reason: z.string().optional(),
});
export type CommandRequestedPayload = z.infer<typeof CommandRequestedPayloadSchema>;

export const CommandAcknowledgedPayloadSchema = z.object({
  commandId: z.string().min(1, "Command ID is required"),
  status: z.string().min(1, "Status is required"),
  message: z.string().optional(),
});
export type CommandAcknowledgedPayload = z.infer<typeof CommandAcknowledgedPayloadSchema>;

export const CommandCompletedPayloadSchema = z.object({
  commandId: z.string().min(1, "Command ID is required"),
  commandType: z.string().optional(),
  result: z.record(z.string(), z.unknown()).optional(),
});
export type CommandCompletedPayload = z.infer<typeof CommandCompletedPayloadSchema>;

export const CommandFailedPayloadSchema = z.object({
  commandId: z.string().min(1, "Command ID is required"),
  commandType: z.string().optional(),
  error: z.record(z.string(), z.unknown()).optional(),
  message: z.string().optional(),
});
export type CommandFailedPayload = z.infer<typeof CommandFailedPayloadSchema>;

export const CommandExpiredPayloadSchema = z.object({
  commandId: z.string().min(1, "Command ID is required"),
  commandType: z.string().optional(),
  reason: z.string().optional(),
});
export type CommandExpiredPayload = z.infer<typeof CommandExpiredPayloadSchema>;

export const payloadSchemas: Record<StewardEventType, z.ZodTypeAny> = {
  "agent.registered": AgentRegisteredPayloadSchema,
  "agent.heartbeat": AgentHeartbeatPayloadSchema,
  "agent.started": AgentStartedPayloadSchema,
  "agent.completed": AgentCompletedPayloadSchema,
  "agent.failed": AgentFailedPayloadSchema,
  "run.started": RunStartedPayloadSchema,
  "run.paused": RunPausedPayloadSchema,
  "run.resumed": RunResumedPayloadSchema,
  "run.completed": RunCompletedPayloadSchema,
  "run.failed": RunFailedPayloadSchema,
  "run.cancelled": RunCancelledPayloadSchema,
  "step.started": StepStartedPayloadSchema,
  "step.completed": StepCompletedPayloadSchema,
  "step.failed": StepFailedPayloadSchema,
  "model.started": ModelStartedPayloadSchema,
  "model.completed": ModelCompletedPayloadSchema,
  "model.failed": ModelFailedPayloadSchema,
  "tool.requested": ToolRequestedPayloadSchema,
  "tool.started": ToolStartedPayloadSchema,
  "tool.succeeded": ToolSucceededPayloadSchema,
  "tool.failed": ToolFailedPayloadSchema,
  "approval.requested": ApprovalRequestedPayloadSchema,
  "approval.resolved": ApprovalResolvedPayloadSchema,
  "approval.approved": ApprovalApprovedPayloadSchema,
  "approval.rejected": ApprovalRejectedPayloadSchema,
  "approval.expired": ApprovalExpiredPayloadSchema,
  "approval.cancelled": ApprovalCancelledPayloadSchema,
  "command.requested": CommandRequestedPayloadSchema,
  "command.acknowledged": CommandAcknowledgedPayloadSchema,
  "command.completed": CommandCompletedPayloadSchema,
  "command.failed": CommandFailedPayloadSchema,
  "command.expired": CommandExpiredPayloadSchema,
};
