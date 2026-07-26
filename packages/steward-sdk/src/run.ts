import {
  StartRunOptions,
  RunState,
  RunControlState,
  CommandItem,
  CommandListenerOptions,
} from "./types";
import { StewardStateError, StewardRunCancelledError } from "./errors";
import { EventDeliveryClient, EventEnvelopeInput } from "./delivery";
import { StewardAgent, AgentInitOptions } from "./agent";
import { createRedactor } from "./redaction";

export class StewardRun {
  public readonly runId: string;
  public readonly defaultAgentName: string;
  private delivery: EventDeliveryClient;
  private state: RunState = "created";
  private controlState: RunControlState = "ACTIVE";
  private redactor: <T>(data: T) => T;

  private checkpointWaiters: Array<{ resolve: () => void; reject: (err: Error) => void }> = [];
  private processedCommandIds: Set<string> = new Set();
  private pollTimer: ReturnType<typeof setInterval> | null = null;
  private isPolling = false;
  public readonly abortController: AbortController = new AbortController();

  constructor(delivery: EventDeliveryClient, defaultAgentName: string, options: StartRunOptions = {}) {
    this.delivery = delivery;
    this.defaultAgentName = defaultAgentName;
    this.runId = options.runId || `run_${Math.random().toString(36).substring(2, 9)}_${Date.now()}`;
    this.redactor = createRedactor();
  }

  public getState(): RunState {
    return this.state;
  }

  public getControlState(): RunControlState {
    return this.controlState;
  }

  public isTerminal(): boolean {
    return this.state === "completed" || this.state === "failed" || this.state === "cancelled";
  }

  public async checkpoint(): Promise<void> {
    if (this.isTerminal() || this.controlState === "CANCELLED") {
      throw new StewardRunCancelledError(this.runId, "Run was cancelled or reaches terminal state");
    }

    if (this.controlState === "ACTIVE") {
      return;
    }

    if (this.controlState === "PAUSED" || this.controlState === "PAUSE_REQUESTED") {
      return new Promise<void>((resolve, reject) => {
        this.checkpointWaiters.push({ resolve, reject });
      });
    }
  }

  public startCommandListener(options: CommandListenerOptions = {}): void {
    if (this.isPolling) {
      throw new StewardStateError(`Command listener is already running for run '${this.runId}'`);
    }

    this.isPolling = true;
    const intervalMs = options.pollIntervalMs || 2000;

    const poll = async () => {
      if (!this.isPolling || this.isTerminal()) {
        this.stopCommandListener();
        return;
      }

      try {
        const commands = await this.delivery.fetchPendingCommands(this.runId);
        for (const cmd of commands) {
          const cmdKey = cmd.externalId || cmd.id || cmd.commandId;
          if (this.processedCommandIds.has(cmdKey)) {
            continue;
          }
          this.processedCommandIds.add(cmdKey);

          await this.processCommand(cmd, options);
        }
      } catch {
        if (this.isPolling) {
          // Log/handle transient network poll errors without throwing unhandled
        }
      }
    };

    // Run first poll immediately
    poll();
    this.pollTimer = setInterval(poll, intervalMs);
  }

  public stopCommandListener(): void {
    if (this.pollTimer) {
      clearInterval(this.pollTimer);
      this.pollTimer = null;
    }
    this.isPolling = false;
  }

  private async processCommand(cmd: CommandItem, options: CommandListenerOptions): Promise<void> {
    const cmdKey = cmd.externalId || cmd.id || cmd.commandId;

    try {
      // 1. Acknowledge command first
      await this.delivery.acknowledgeCommand(this.runId, cmdKey).catch(() => {});

      // 2. Handle command type
      const type = cmd.type.toUpperCase();

      if (type === "PAUSE") {
        this.controlState = "PAUSED";
        if (options.onPause) {
          await options.onPause(cmd);
        }
        await this.delivery.completeCommand(this.runId, cmdKey, { state: "PAUSED" });
      } else if (type === "RESUME") {
        this.controlState = "ACTIVE";
        if (options.onResume) {
          await options.onResume(cmd);
        }
        // Resolve waiting checkpoints
        const waiters = [...this.checkpointWaiters];
        this.checkpointWaiters = [];
        waiters.forEach((w) => w.resolve());

        await this.delivery.completeCommand(this.runId, cmdKey, { state: "ACTIVE" });
      } else if (type === "CANCEL") {
        this.state = "cancelled";
        this.controlState = "CANCELLED";

        if (options.onCancel) {
          await options.onCancel(cmd);
        }

        // Abort SDK-managed network requests
        this.abortController.abort();

        // Reject all waiting checkpoints
        const waiters = [...this.checkpointWaiters];
        this.checkpointWaiters = [];
        const cancelErr = new StewardRunCancelledError(this.runId, cmd.reason || "Run cancelled by dashboard");
        waiters.forEach((w) => w.reject(cancelErr));

        await this.delivery.completeCommand(this.runId, cmdKey, { state: "CANCELLED" });
        this.stopCommandListener();
      }
    } catch (err: unknown) {
      const errorObj = { message: (err as Error).message || "Handler execution failed" };
      await this.delivery.failCommand(this.runId, cmdKey, errorObj).catch(() => {});
      this.controlState = "ACTIVE";
      throw err;
    }
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
    } finally {
      this.stopCommandListener();
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
    } finally {
      this.stopCommandListener();
    }
  }

  public async cancelled(payload: { reason?: string } = {}): Promise<void> {
    if (this.isTerminal()) {
      throw new StewardStateError(`Cannot cancel run '${this.runId}' from state '${this.state}'`);
    }

    const previousState = this.state;
    this.state = "cancelled";
    this.controlState = "CANCELLED";

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
    } finally {
      this.stopCommandListener();
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
