import { StewardOptions, ApprovalDecisionResult, CommandItem } from "./types";
import { StewardApiError } from "./errors";
import { createRedactor } from "./redaction";

export interface EventEnvelopeInput {
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

export interface CreateApprovalInput {
  externalId: string;
  runId: string;
  agentName: string;
  toolName: string;
  arguments?: Record<string, unknown>;
  reason: string;
  riskLevel?: string;
  expiresInSeconds?: number;
}

export class EventDeliveryClient {
  private options: StewardOptions;
  private redactor: <T>(data: T) => T;
  private fetchImpl: typeof fetch;
  private sequenceMap: Map<string, number> = new Map();

  constructor(options: StewardOptions) {
    this.options = options;
    this.redactor = createRedactor(options.customRedactedKeys);
    this.fetchImpl = options.fetch || globalThis.fetch;
    if (!this.fetchImpl) {
      throw new Error("No fetch implementation available");
    }
  }

  public getNextSequence(runId: string): number {
    const current = this.sequenceMap.get(runId) || 0;
    const next = current + 1;
    this.sequenceMap.set(runId, next);
    return next;
  }

  public async sendEvent(input: EventEnvelopeInput): Promise<{ eventId: string; duplicate: boolean }> {
    const runId = input.runId || "global";
    const sequence = this.getNextSequence(runId);
    const eventId = input.eventId || `evt_${Math.random().toString(36).substring(2, 11)}_${Date.now()}`;
    const occurredAt = input.occurredAt || new Date().toISOString();

    const sanitizedPayload = this.redactor(input.payload);

    const envelope = {
      specVersion: "1.0",
      eventId,
      eventType: input.eventType,
      occurredAt,
      agentKey: input.agentKey,
      runId: input.runId,
      stepId: input.stepId,
      actionId: input.actionId,
      sequence,
      payload: sanitizedPayload,
      metadata: input.metadata || this.options.defaultMetadata,
    };

    const maxRetries = this.options.maxRetries ?? 3;
    const timeoutMs = this.options.timeout ?? 10000;
    const url = `${this.options.baseUrl.replace(/\/+$/, "")}/api/v1/events`;

    let attempt = 0;
    let lastError: Error | null = null;

    while (attempt <= maxRetries) {
      attempt++;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

      try {
        if (this.options.debug) {
          console.log(`[Steward SDK] Sending event ${envelope.eventType} (Attempt ${attempt}/${maxRetries + 1})`);
        }

        const response = await this.fetchImpl(url, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${this.options.apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(envelope),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (response.status === 201 || response.status === 200) {
          const body = (await response.json()) as { accepted?: boolean; duplicate?: boolean; eventId?: string };
          return {
            eventId: body.eventId || eventId,
            duplicate: Boolean(body.duplicate),
          };
        }

        const responseText = await response.text().catch(() => "");
        const isRetryable = response.status === 429 || response.status >= 500;

        if (!isRetryable) {
          throw new StewardApiError(
            response.status,
            `API request failed with status ${response.status}: ${responseText || response.statusText}`,
            false,
            responseText
          );
        }

        lastError = new StewardApiError(
          response.status,
          `API request failed with status ${response.status} (retryable)`,
          true,
          responseText
        );
      } catch (err: unknown) {
        clearTimeout(timeoutId);

        if (err instanceof StewardApiError && !err.isRetryable) {
          throw err;
        }

        const isAbort = err && typeof err === "object" && "name" in err && (err as { name: string }).name === "AbortError";
        const message = isAbort ? `Request timed out after ${timeoutMs}ms` : (err as Error).message || "Network failure";

        lastError = new StewardApiError(0, message, true, err);
      }

      if (attempt <= maxRetries) {
        const baseDelay = Math.min(3000, 200 * Math.pow(2, attempt - 1));
        const jitter = Math.floor(Math.random() * 100);
        await new Promise((res) => setTimeout(res, baseDelay + jitter));
      }
    }

    throw lastError || new StewardApiError(0, "Max retries exceeded", true);
  }

  public async createApprovalRequest(input: CreateApprovalInput): Promise<unknown> {
    const url = `${this.options.baseUrl.replace(/\/+$/, "")}/api/v1/approval-requests`;
    const response = await this.fetchImpl(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.options.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(input),
    });

    if (response.status !== 201 && response.status !== 200) {
      const text = await response.text().catch(() => "");
      throw new StewardApiError(response.status, `Failed to create approval request: ${text}`, false);
    }

    return await response.json();
  }

  public async checkApprovalStatus(externalId: string): Promise<ApprovalDecisionResult> {
    const url = `${this.options.baseUrl.replace(/\/+$/, "")}/api/v1/approval-requests/${encodeURIComponent(externalId)}`;
    const response = await this.fetchImpl(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${this.options.apiKey}`,
      },
    });

    if (response.status !== 200) {
      const text = await response.text().catch(() => "");
      throw new StewardApiError(response.status, `Failed to check approval status: ${text}`, false);
    }

    return (await response.json()) as ApprovalDecisionResult;
  }

  public async fetchPendingCommands(externalRunId: string): Promise<CommandItem[]> {
    const url = `${this.options.baseUrl.replace(/\/+$/, "")}/api/v1/runs/${encodeURIComponent(externalRunId)}/commands/pending`;
    const response = await this.fetchImpl(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${this.options.apiKey}`,
      },
    });

    if (response.status !== 200) {
      const text = await response.text().catch(() => "");
      throw new StewardApiError(response.status, `Failed to fetch pending commands: ${text}`, false);
    }

    const data = await response.json();
    return (data.commands || []) as CommandItem[];
  }

  public async acknowledgeCommand(externalRunId: string, commandId: string): Promise<unknown> {
    const url = `${this.options.baseUrl.replace(/\/+$/, "")}/api/v1/runs/${encodeURIComponent(externalRunId)}/commands/${encodeURIComponent(commandId)}/acknowledge`;
    const response = await this.fetchImpl(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.options.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ status: "ACKNOWLEDGED" }),
    });

    if (response.status !== 200) {
      const text = await response.text().catch(() => "");
      throw new StewardApiError(response.status, `Failed to acknowledge command: ${text}`, false);
    }

    return await response.json();
  }

  public async completeCommand(
    externalRunId: string,
    commandId: string,
    result?: Record<string, unknown>
  ): Promise<unknown> {
    const url = `${this.options.baseUrl.replace(/\/+$/, "")}/api/v1/runs/${encodeURIComponent(externalRunId)}/commands/${encodeURIComponent(commandId)}/complete`;
    const response = await this.fetchImpl(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.options.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ status: "COMPLETED", result }),
    });

    if (response.status !== 200) {
      const text = await response.text().catch(() => "");
      throw new StewardApiError(response.status, `Failed to complete command: ${text}`, false);
    }

    return await response.json();
  }

  public async failCommand(
    externalRunId: string,
    commandId: string,
    error?: Record<string, unknown>
  ): Promise<unknown> {
    const url = `${this.options.baseUrl.replace(/\/+$/, "")}/api/v1/runs/${encodeURIComponent(externalRunId)}/commands/${encodeURIComponent(commandId)}/fail`;
    const response = await this.fetchImpl(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.options.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ status: "FAILED", error }),
    });

    if (response.status !== 200) {
      const text = await response.text().catch(() => "");
      throw new StewardApiError(response.status, `Failed to fail command: ${text}`, false);
    }

    return await response.json();
  }
}
