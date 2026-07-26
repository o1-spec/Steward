export interface StewardOptions {
  apiKey: string;
  baseUrl: string;
  agentName: string;
  projectId?: string;
  timeout?: number;
  maxRetries?: number;
  debug?: boolean;
  defaultMetadata?: Record<string, string | number | boolean>;
  customRedactedKeys?: string[];
  fetch?: typeof fetch;
}

export interface StartRunOptions {
  runId?: string;
  name?: string;
  input?: unknown;
  metadata?: Record<string, string | number | boolean>;
}

export interface AgentOptions {
  agentId?: string;
  name?: string;
  metadata?: Record<string, string | number | boolean>;
}

export interface ModelCallOptions {
  provider: string;
  model: string;
  inputSummary?: string;
  metadata?: Record<string, string | number | boolean>;
}

export interface ModelCallOutput {
  outputSummary?: string;
  inputTokens?: number;
  outputTokens?: number;
  totalTokens?: number;
  costUsd?: number;
}

export interface ToolCallOptions {
  toolName: string;
  arguments?: Record<string, unknown>;
  metadata?: Record<string, string | number | boolean>;
}

export interface RequestApprovalOptions {
  approvalId?: string;
  toolName: string;
  arguments?: Record<string, unknown>;
  reason: string;
  riskLevel?: "low" | "medium" | "high" | "critical" | string;
  timeoutMs?: number;
}

export interface GuardedToolCallOptions extends RequestApprovalOptions {
  metadata?: Record<string, string | number | boolean>;
}

export interface ApprovalDecisionResult {
  id: string;
  externalId: string;
  status: "APPROVED" | "REJECTED" | "EXPIRED" | "PENDING" | "CANCELLED";
  decidedAt?: string | null;
  decisionReason?: string | null;
  expiresAt: string;
}

export type RunState = "created" | "running" | "completed" | "failed" | "cancelled";
