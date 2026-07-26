interface StewardOptions {
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
interface StartRunOptions {
    runId?: string;
    name?: string;
    input?: unknown;
    metadata?: Record<string, string | number | boolean>;
}
interface AgentOptions {
    agentId?: string;
    name?: string;
    metadata?: Record<string, string | number | boolean>;
}
interface ModelCallOptions {
    provider: string;
    model: string;
    inputSummary?: string;
    metadata?: Record<string, string | number | boolean>;
}
interface ModelCallOutput {
    outputSummary?: string;
    inputTokens?: number;
    outputTokens?: number;
    totalTokens?: number;
    costUsd?: number;
}
interface ToolCallOptions {
    toolName: string;
    arguments?: Record<string, unknown>;
    metadata?: Record<string, string | number | boolean>;
}
interface RequestApprovalOptions {
    approvalId?: string;
    toolName: string;
    arguments?: Record<string, unknown>;
    reason: string;
    riskLevel?: "low" | "medium" | "high" | "critical" | string;
    timeoutMs?: number;
}
interface GuardedToolCallOptions extends RequestApprovalOptions {
    metadata?: Record<string, string | number | boolean>;
}
interface ApprovalDecisionResult {
    id: string;
    externalId: string;
    status: "APPROVED" | "REJECTED" | "EXPIRED" | "PENDING" | "CANCELLED";
    decidedAt?: string | null;
    decisionReason?: string | null;
    expiresAt: string;
}
type RunState = "created" | "running" | "completed" | "failed" | "cancelled";

interface EventEnvelopeInput {
    eventType: string;
    agentKey: string;
    runId?: string;
    stepId?: string;
    actionId?: string;
    payload: unknown;
    metadata?: Record<string, string | number | boolean>;
    occurredAt?: string;
    eventId?: string;
}
interface CreateApprovalInput {
    externalId: string;
    runId: string;
    agentName: string;
    toolName: string;
    arguments?: Record<string, unknown>;
    reason: string;
    riskLevel?: string;
    expiresInSeconds?: number;
}
declare class EventDeliveryClient {
    private options;
    private redactor;
    private fetchImpl;
    private sequenceMap;
    constructor(options: StewardOptions);
    getNextSequence(runId: string): number;
    sendEvent(input: EventEnvelopeInput): Promise<{
        eventId: string;
        duplicate: boolean;
    }>;
    createApprovalRequest(input: CreateApprovalInput): Promise<unknown>;
    checkApprovalStatus(externalId: string): Promise<ApprovalDecisionResult>;
}

interface AgentInitOptions {
    agentId?: string;
    name: string;
    metadata?: Record<string, string | number | boolean>;
}
declare class StewardAgent {
    readonly agentId: string;
    readonly name: string;
    private run;
    private redactor;
    constructor(run: StewardRun, options: AgentInitOptions);
    started(payload?: {
        input?: unknown;
    }): Promise<void>;
    completed(payload?: {
        output?: unknown;
        summary?: string;
    }): Promise<void>;
    failed(payload: {
        error: string | Error;
    }): Promise<void>;
    modelCall<T>(options: ModelCallOptions, fn: (info?: {
        recordOutput: (output: ModelCallOutput) => void;
    }) => Promise<T>): Promise<T>;
    toolCall<T>(options: ToolCallOptions, fn: () => Promise<T>): Promise<T>;
    requestApproval(options: RequestApprovalOptions): Promise<ApprovalDecisionResult>;
    guardedToolCall<T>(options: GuardedToolCallOptions, fn: () => Promise<T>): Promise<T>;
}

declare class StewardRun {
    readonly runId: string;
    readonly defaultAgentName: string;
    private delivery;
    private state;
    private redactor;
    constructor(delivery: EventDeliveryClient, defaultAgentName: string, options?: StartRunOptions);
    getState(): RunState;
    isTerminal(): boolean;
    emitEvent(input: Omit<EventEnvelopeInput, "runId">): Promise<{
        eventId: string;
        duplicate: boolean;
    }>;
    started(payload?: {
        task?: string;
        input?: Record<string, unknown>;
    }): Promise<void>;
    completed(payload?: {
        output?: unknown;
        summary?: string;
    }): Promise<void>;
    failed(payload: {
        error: string | Error;
        code?: string;
    }): Promise<void>;
    cancelled(payload?: {
        reason?: string;
    }): Promise<void>;
    agent(options?: Partial<AgentInitOptions>): StewardAgent;
}

declare class Steward {
    readonly options: StewardOptions;
    private delivery;
    constructor(options: StewardOptions);
    private validateOptions;
    startRun(options?: StartRunOptions): StewardRun;
}

declare class StewardConfigError extends Error {
    constructor(message: string);
}
declare class StewardStateError extends Error {
    constructor(message: string);
}
declare class StewardApiError extends Error {
    readonly status: number;
    readonly isRetryable: boolean;
    readonly details?: unknown;
    constructor(status: number, message: string, isRetryable: boolean, details?: unknown);
}
declare class StewardApprovalRejectedError extends Error {
    readonly approvalId: string;
    readonly decisionReason?: string;
    constructor(approvalId: string, decisionReason?: string);
}
declare class StewardApprovalExpiredError extends Error {
    readonly approvalId: string;
    constructor(approvalId: string);
}

declare const DEFAULT_SENSITIVE_KEYS: string[];
declare function isSensitiveKey(key: string, customKeys?: string[]): boolean;
declare function createRedactor(customKeys?: string[]): <T>(data: T) => T;

export { type AgentOptions, type ApprovalDecisionResult, DEFAULT_SENSITIVE_KEYS, type GuardedToolCallOptions, type ModelCallOptions, type ModelCallOutput, type RequestApprovalOptions, type RunState, type StartRunOptions, Steward, StewardAgent, StewardApiError, StewardApprovalExpiredError, StewardApprovalRejectedError, StewardConfigError, type StewardOptions, StewardRun, StewardStateError, type ToolCallOptions, createRedactor, isSensitiveKey };
