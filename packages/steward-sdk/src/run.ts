import { StartRunOptions, RunState } from "./types";
import { StewardStateError } from "./errors";
import { EventDeliveryClient, EventEnvelopeInput } from "./delivery";
import { StewardAgent, AgentInitOptions } from "./agent";
import { createRedactor } from "./redaction";

export class StewardRun {
  public readonly runId: string;
  public readonly defaultAgentName: string;
  private delivery: EventDeliveryClient;
  private state: RunState = "created";
  private redactor: <T>(data: T) => T;

  constructor(delivery: EventDeliveryClient, defaultAgentName: string, options: StartRunOptions = {}) {
    this.delivery = delivery;
    this.defaultAgentName = defaultAgentName;
    this.runId = options.runId || `run_${Math.random().toString(36).substring(2, 9)}_${Date.now()}`;
    this.redactor = createRedactor();
  }

  public getState(): RunState {
    return this.state;
  }

  public isTerminal(): boolean {
    return this.state === "completed" || this.state === "failed" || this.state === "cancelled";
  }

  public async emitEvent(input: Omit<EventEnvelopeInput, "runId">): Promise<{ eventId: string; duplicate: boolean }> {
    if (this.isTerminal()) {
      throw new StewardStateError(
        `Cannot emit event '${input.eventType}' after run '${this.runId}' reached terminal state '${this.state}'`
      );
    }

    return await this.delivery.sendEvent({
      ...input,
      runId: this.runId,
    });
  }

  public async started(payload: { task?: string; input?: Record<string, unknown> } = {}): Promise<void> {
    if (this.state !== "created") {
      throw new StewardStateError(`Cannot start run '${this.runId}' from state '${this.state}'`);
    }

    this.state = "running";

    await this.delivery.sendEvent({
      eventType: "run.started",
      agentKey: this.defaultAgentName,
      runId: this.runId,
      payload: {
        runId: this.runId,
        task: payload.task || "Agent run started",
        input: this.redactor(payload.input),
      },
    });
  }

  public async completed(payload: { output?: unknown; summary?: string } = {}): Promise<void> {
    if (this.isTerminal()) {
      throw new StewardStateError(`Cannot complete run '${this.runId}' from state '${this.state}'`);
    }

    const previousState = this.state;
    this.state = "completed";

    try {
      await this.delivery.sendEvent({
        eventType: "run.completed",
        agentKey: this.defaultAgentName,
        runId: this.runId,
        payload: {
          summary: payload.summary || "Run completed successfully",
          output: this.redactor(payload.output),
        },
      });
    } catch (err) {
      this.state = previousState;
      throw err;
    }
  }

  public async failed(payload: { error: string | Error; code?: string }): Promise<void> {
    if (this.isTerminal()) {
      throw new StewardStateError(`Cannot fail run '${this.runId}' from state '${this.state}'`);
    }

    const previousState = this.state;
    this.state = "failed";

    const errorMsg = payload.error instanceof Error ? payload.error.message : String(payload.error);

    try {
      await this.delivery.sendEvent({
        eventType: "run.failed",
        agentKey: this.defaultAgentName,
        runId: this.runId,
        payload: {
          error: errorMsg,
          code: payload.code,
        },
      });
    } catch (err) {
      this.state = previousState;
      throw err;
    }
  }

  public async cancelled(payload: { reason?: string } = {}): Promise<void> {
    if (this.isTerminal()) {
      throw new StewardStateError(`Cannot cancel run '${this.runId}' from state '${this.state}'`);
    }

    const previousState = this.state;
    this.state = "cancelled";

    try {
      await this.delivery.sendEvent({
        eventType: "run.cancelled",
        agentKey: this.defaultAgentName,
        runId: this.runId,
        payload: {
          reason: payload.reason || "Run cancelled",
        },
      });
    } catch (err) {
      this.state = previousState;
      throw err;
    }
  }

  public agent(options: Partial<AgentInitOptions> = {}): StewardAgent {
    return new StewardAgent(this, {
      agentId: options.agentId,
      name: options.name || this.defaultAgentName,
      metadata: options.metadata,
    });
  }
}
