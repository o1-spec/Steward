import {
  ModelCallOptions,
  ModelCallOutput,
  ToolCallOptions,
  RequestApprovalOptions,
  GuardedToolCallOptions,
  ApprovalDecisionResult,
} from "./types";
import { StewardRun } from "./run";
import { EventDeliveryClient } from "./delivery";
import { createRedactor } from "./redaction";
import { StewardApprovalRejectedError, StewardApprovalExpiredError } from "./errors";

export interface AgentInitOptions {
  agentId?: string;
  name: string;
  metadata?: Record<string, string | number | boolean>;
}

export class StewardAgent {
  public readonly agentId: string;
  public readonly name: string;
  private run: StewardRun;
  private redactor: <T>(data: T) => T;

  constructor(run: StewardRun, options: AgentInitOptions) {
    this.run = run;
    this.agentId = options.agentId || `agent_${Math.random().toString(36).substring(2, 9)}`;
    this.name = options.name;
    this.redactor = createRedactor();
  }

  public async started(payload: { input?: unknown } = {}): Promise<void> {
    await this.run.emitEvent({
      eventType: "agent.started",
      agentKey: this.name,
      payload: {
        agentId: this.agentId,
        name: this.name,
        input: this.redactor(payload.input),
      },
    });
  }

  public async completed(payload: { output?: unknown; summary?: string } = {}): Promise<void> {
    await this.run.emitEvent({
      eventType: "agent.completed",
      agentKey: this.name,
      payload: {
        agentId: this.agentId,
        summary: payload.summary || `Agent '${this.name}' completed`,
        output: this.redactor(payload.output),
      },
    });
  }

  public async failed(payload: { error: string | Error }): Promise<void> {
    const errorMsg = payload.error instanceof Error ? payload.error.message : String(payload.error);
    await this.run.emitEvent({
      eventType: "agent.failed",
      agentKey: this.name,
      payload: {
        agentId: this.agentId,
        error: errorMsg,
      },
    });
  }

  public async modelCall<T>(
    options: ModelCallOptions,
    fn: (info?: { recordOutput: (output: ModelCallOutput) => void }) => Promise<T>
  ): Promise<T> {
    const startTime = Date.now();

    await this.run.emitEvent({
      eventType: "model.started",
      agentKey: this.name,
      payload: {
        provider: options.provider,
        model: options.model,
        inputSummary: options.inputSummary,
      },
    });

    let extraOutput: ModelCallOutput = {};
    const recordOutput = (output: ModelCallOutput) => {
      extraOutput = { ...extraOutput, ...output };
    };

    try {
      const result = await fn({ recordOutput });
      const durationMs = Date.now() - startTime;

      await this.run.emitEvent({
        eventType: "model.completed",
        agentKey: this.name,
        payload: {
          provider: options.provider,
          model: options.model,
          outputSummary: extraOutput.outputSummary || "Model execution completed",
          durationMs,
          inputTokens: extraOutput.inputTokens,
          outputTokens: extraOutput.outputTokens,
          totalTokens: extraOutput.totalTokens,
          costUsd: extraOutput.costUsd,
        },
      });

      return result;
    } catch (err: unknown) {
      const durationMs = Date.now() - startTime;
      const errorMsg = err instanceof Error ? err.message : String(err);

      await this.run.emitEvent({
        eventType: "model.failed",
        agentKey: this.name,
        payload: {
          provider: options.provider,
          model: options.model,
          error: errorMsg,
          durationMs,
        },
      });

      throw err;
    }
  }

  public async toolCall<T>(
    options: ToolCallOptions,
    fn: () => Promise<T>
  ): Promise<T> {
    const startTime = Date.now();
    const redactedArgs = this.redactor(options.arguments || {});

    await this.run.emitEvent({
      eventType: "tool.started",
      agentKey: this.name,
      payload: {
        toolName: options.toolName,
        arguments: redactedArgs,
      },
    });

    try {
      const result = await fn();
      const durationMs = Date.now() - startTime;
      const redactedResult = this.redactor(result);

      await this.run.emitEvent({
        eventType: "tool.succeeded",
        agentKey: this.name,
        payload: {
          toolName: options.toolName,
          result: redactedResult,
          durationMs,
        },
      });

      return result;
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);

      await this.run.emitEvent({
        eventType: "tool.failed",
        agentKey: this.name,
        payload: {
          toolName: options.toolName,
          error: errorMsg,
        },
      });

      throw err;
    }
  }

  public async requestApproval(options: RequestApprovalOptions): Promise<ApprovalDecisionResult> {
    const externalId = options.approvalId || `appr_${Math.random().toString(36).substring(2, 10)}_${Date.now()}`;
    const timeoutMs = options.timeoutMs || 300000;
    const expiresInSeconds = Math.ceil(timeoutMs / 1000);

    const delivery = (this.run as unknown as { delivery: EventDeliveryClient }).delivery;
    if (!delivery) {
      throw new Error("Delivery client unavailable on StewardRun instance");
    }

    await delivery.createApprovalRequest({
      externalId,
      runId: this.run.runId,
      agentName: this.name,
      toolName: options.toolName,
      arguments: options.arguments,
      reason: options.reason,
      riskLevel: options.riskLevel || "medium",
      expiresInSeconds,
    });

    const startTime = Date.now();
    let pollIntervalMs = 500;

    while (Date.now() - startTime < timeoutMs) {
      if (this.run.isTerminal()) {
        throw new StewardApprovalExpiredError(externalId);
      }

      const statusResult: ApprovalDecisionResult = await delivery.checkApprovalStatus(externalId);

      if (statusResult.status === "APPROVED") {
        return statusResult;
      }

      if (statusResult.status === "REJECTED") {
        throw new StewardApprovalRejectedError(externalId, statusResult.decisionReason || undefined);
      }

      if (statusResult.status === "EXPIRED" || statusResult.status === "CANCELLED") {
        throw new StewardApprovalExpiredError(externalId);
      }

      await new Promise((res) => setTimeout(res, pollIntervalMs));
      pollIntervalMs = Math.min(2000, pollIntervalMs * 1.5);
    }

    throw new StewardApprovalExpiredError(externalId);
  }

  public async guardedToolCall<T>(
    options: GuardedToolCallOptions,
    fn: () => Promise<T>
  ): Promise<T> {
    const approvalResult = await this.requestApproval({
      approvalId: options.approvalId,
      toolName: options.toolName,
      arguments: options.arguments,
      reason: options.reason,
      riskLevel: options.riskLevel,
      timeoutMs: options.timeoutMs,
    });

    if (approvalResult.status !== "APPROVED") {
      throw new StewardApprovalRejectedError(approvalResult.externalId, approvalResult.decisionReason || undefined);
    }

    // Now execute tool safely
    return await this.toolCall(
      {
        toolName: options.toolName,
        arguments: options.arguments,
        metadata: options.metadata,
      },
      fn
    );
  }
}
