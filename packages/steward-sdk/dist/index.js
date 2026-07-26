"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/index.ts
var index_exports = {};
__export(index_exports, {
  DEFAULT_SENSITIVE_KEYS: () => DEFAULT_SENSITIVE_KEYS,
  Steward: () => Steward,
  StewardAgent: () => StewardAgent,
  StewardApiError: () => StewardApiError,
  StewardApprovalExpiredError: () => StewardApprovalExpiredError,
  StewardApprovalRejectedError: () => StewardApprovalRejectedError,
  StewardConfigError: () => StewardConfigError,
  StewardRun: () => StewardRun,
  StewardRunCancelledError: () => StewardRunCancelledError,
  StewardRunPausedError: () => StewardRunPausedError,
  StewardStateError: () => StewardStateError,
  createRedactor: () => createRedactor,
  isSensitiveKey: () => isSensitiveKey
});
module.exports = __toCommonJS(index_exports);

// src/errors.ts
var StewardConfigError = class _StewardConfigError extends Error {
  constructor(message) {
    super(message);
    this.name = "StewardConfigError";
    Object.setPrototypeOf(this, _StewardConfigError.prototype);
  }
};
var StewardStateError = class _StewardStateError extends Error {
  constructor(message) {
    super(message);
    this.name = "StewardStateError";
    Object.setPrototypeOf(this, _StewardStateError.prototype);
  }
};
var StewardApiError = class _StewardApiError extends Error {
  status;
  isRetryable;
  details;
  constructor(status, message, isRetryable, details) {
    super(message);
    this.name = "StewardApiError";
    this.status = status;
    this.isRetryable = isRetryable;
    this.details = details;
    Object.setPrototypeOf(this, _StewardApiError.prototype);
  }
};
var StewardApprovalRejectedError = class _StewardApprovalRejectedError extends Error {
  approvalId;
  decisionReason;
  constructor(approvalId, decisionReason) {
    super(`Approval request '${approvalId}' was rejected by human supervisor${decisionReason ? `: ${decisionReason}` : ""}`);
    this.name = "StewardApprovalRejectedError";
    this.approvalId = approvalId;
    this.decisionReason = decisionReason;
    Object.setPrototypeOf(this, _StewardApprovalRejectedError.prototype);
  }
};
var StewardApprovalExpiredError = class _StewardApprovalExpiredError extends Error {
  approvalId;
  constructor(approvalId) {
    super(`Approval request '${approvalId}' expired before human decision`);
    this.name = "StewardApprovalExpiredError";
    this.approvalId = approvalId;
    Object.setPrototypeOf(this, _StewardApprovalExpiredError.prototype);
  }
};
var StewardRunCancelledError = class _StewardRunCancelledError extends Error {
  runId;
  reason;
  constructor(runId, reason) {
    super(`Run '${runId}' was cancelled${reason ? `: ${reason}` : ""}`);
    this.name = "StewardRunCancelledError";
    this.runId = runId;
    this.reason = reason;
    Object.setPrototypeOf(this, _StewardRunCancelledError.prototype);
  }
};
var StewardRunPausedError = class _StewardRunPausedError extends Error {
  runId;
  constructor(runId) {
    super(`Run '${runId}' is currently paused`);
    this.name = "StewardRunPausedError";
    this.runId = runId;
    Object.setPrototypeOf(this, _StewardRunPausedError.prototype);
  }
};

// src/redaction.ts
var DEFAULT_SENSITIVE_KEYS = [
  "password",
  "passwd",
  "token",
  "accessToken",
  "refreshToken",
  "apiKey",
  "secret",
  "authorization",
  "cookie",
  "set-cookie",
  "privateKey"
];
var TOKEN_COUNT_KEYS = /* @__PURE__ */ new Set([
  "totaltokens",
  "inputtokens",
  "outputtokens",
  "prompttokens",
  "completiontokens"
]);
function isSensitiveKey(key, customKeys = []) {
  const lower = key.toLowerCase();
  if (customKeys.some((k) => lower.includes(k.toLowerCase()))) {
    return true;
  }
  if (TOKEN_COUNT_KEYS.has(lower)) {
    return false;
  }
  for (const sKey of DEFAULT_SENSITIVE_KEYS) {
    const sLower = sKey.toLowerCase();
    if (lower.includes(sLower)) {
      return true;
    }
  }
  return false;
}
function createRedactor(customKeys = []) {
  function redact(data) {
    if (data === null || data === void 0) {
      return data;
    }
    if (typeof data !== "object") {
      return data;
    }
    if (Array.isArray(data)) {
      return data.map((item) => redact(item));
    }
    const redactedObj = {};
    for (const [key, value] of Object.entries(data)) {
      if (isSensitiveKey(key, customKeys)) {
        redactedObj[key] = "[REDACTED]";
      } else if (typeof value === "object" && value !== null) {
        redactedObj[key] = redact(value);
      } else {
        redactedObj[key] = value;
      }
    }
    return redactedObj;
  }
  return redact;
}

// src/delivery.ts
var EventDeliveryClient = class {
  options;
  redactor;
  fetchImpl;
  sequenceMap = /* @__PURE__ */ new Map();
  constructor(options) {
    this.options = options;
    this.redactor = createRedactor(options.customRedactedKeys);
    this.fetchImpl = options.fetch || globalThis.fetch;
    if (!this.fetchImpl) {
      throw new Error("No fetch implementation available");
    }
  }
  getNextSequence(runId) {
    const current = this.sequenceMap.get(runId) || 0;
    const next = current + 1;
    this.sequenceMap.set(runId, next);
    return next;
  }
  async sendEvent(input) {
    const runId = input.runId || "global";
    const sequence = this.getNextSequence(runId);
    const eventId = input.eventId || `evt_${Math.random().toString(36).substring(2, 11)}_${Date.now()}`;
    const occurredAt = input.occurredAt || (/* @__PURE__ */ new Date()).toISOString();
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
      metadata: input.metadata || this.options.defaultMetadata
    };
    const maxRetries = this.options.maxRetries ?? 3;
    const timeoutMs = this.options.timeout ?? 1e4;
    const url = `${this.options.baseUrl.replace(/\/+$/, "")}/api/v1/events`;
    let attempt = 0;
    let lastError = null;
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
            "Content-Type": "application/json"
          },
          body: JSON.stringify(envelope),
          signal: controller.signal
        });
        clearTimeout(timeoutId);
        if (response.status === 201 || response.status === 200) {
          const body = await response.json();
          return {
            eventId: body.eventId || eventId,
            duplicate: Boolean(body.duplicate)
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
      } catch (err) {
        clearTimeout(timeoutId);
        if (err instanceof StewardApiError && !err.isRetryable) {
          throw err;
        }
        const isAbort = err && typeof err === "object" && "name" in err && err.name === "AbortError";
        const message = isAbort ? `Request timed out after ${timeoutMs}ms` : err.message || "Network failure";
        lastError = new StewardApiError(0, message, true, err);
      }
      if (attempt <= maxRetries) {
        const baseDelay = Math.min(3e3, 200 * Math.pow(2, attempt - 1));
        const jitter = Math.floor(Math.random() * 100);
        await new Promise((res) => setTimeout(res, baseDelay + jitter));
      }
    }
    throw lastError || new StewardApiError(0, "Max retries exceeded", true);
  }
  async createApprovalRequest(input) {
    const url = `${this.options.baseUrl.replace(/\/+$/, "")}/api/v1/approval-requests`;
    const response = await this.fetchImpl(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.options.apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(input)
    });
    if (response.status !== 201 && response.status !== 200) {
      const text = await response.text().catch(() => "");
      throw new StewardApiError(response.status, `Failed to create approval request: ${text}`, false);
    }
    return await response.json();
  }
  async checkApprovalStatus(externalId) {
    const url = `${this.options.baseUrl.replace(/\/+$/, "")}/api/v1/approval-requests/${encodeURIComponent(externalId)}`;
    const response = await this.fetchImpl(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${this.options.apiKey}`
      }
    });
    if (response.status !== 200) {
      const text = await response.text().catch(() => "");
      throw new StewardApiError(response.status, `Failed to check approval status: ${text}`, false);
    }
    return await response.json();
  }
  async fetchPendingCommands(externalRunId) {
    const url = `${this.options.baseUrl.replace(/\/+$/, "")}/api/v1/runs/${encodeURIComponent(externalRunId)}/commands/pending`;
    const response = await this.fetchImpl(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${this.options.apiKey}`
      }
    });
    if (response.status !== 200) {
      const text = await response.text().catch(() => "");
      throw new StewardApiError(response.status, `Failed to fetch pending commands: ${text}`, false);
    }
    const data = await response.json();
    return data.commands || [];
  }
  async acknowledgeCommand(externalRunId, commandId) {
    const url = `${this.options.baseUrl.replace(/\/+$/, "")}/api/v1/runs/${encodeURIComponent(externalRunId)}/commands/${encodeURIComponent(commandId)}/acknowledge`;
    const response = await this.fetchImpl(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.options.apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ status: "ACKNOWLEDGED" })
    });
    if (response.status !== 200) {
      const text = await response.text().catch(() => "");
      throw new StewardApiError(response.status, `Failed to acknowledge command: ${text}`, false);
    }
    return await response.json();
  }
  async completeCommand(externalRunId, commandId, result) {
    const url = `${this.options.baseUrl.replace(/\/+$/, "")}/api/v1/runs/${encodeURIComponent(externalRunId)}/commands/${encodeURIComponent(commandId)}/complete`;
    const response = await this.fetchImpl(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.options.apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ status: "COMPLETED", result })
    });
    if (response.status !== 200) {
      const text = await response.text().catch(() => "");
      throw new StewardApiError(response.status, `Failed to complete command: ${text}`, false);
    }
    return await response.json();
  }
  async failCommand(externalRunId, commandId, error) {
    const url = `${this.options.baseUrl.replace(/\/+$/, "")}/api/v1/runs/${encodeURIComponent(externalRunId)}/commands/${encodeURIComponent(commandId)}/fail`;
    const response = await this.fetchImpl(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.options.apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ status: "FAILED", error })
    });
    if (response.status !== 200) {
      const text = await response.text().catch(() => "");
      throw new StewardApiError(response.status, `Failed to fail command: ${text}`, false);
    }
    return await response.json();
  }
};

// src/agent.ts
var StewardAgent = class {
  agentId;
  name;
  run;
  redactor;
  constructor(run, options) {
    this.run = run;
    this.agentId = options.agentId || `agent_${Math.random().toString(36).substring(2, 9)}`;
    this.name = options.name;
    this.redactor = createRedactor();
  }
  async started(payload = {}) {
    await this.run.checkpoint();
    await this.run.emitEvent({
      eventType: "agent.started",
      agentKey: this.name,
      payload: {
        agentId: this.agentId,
        name: this.name,
        input: this.redactor(payload.input)
      }
    });
  }
  async completed(payload = {}) {
    await this.run.emitEvent({
      eventType: "agent.completed",
      agentKey: this.name,
      payload: {
        agentId: this.agentId,
        summary: payload.summary || `Agent '${this.name}' completed`,
        output: this.redactor(payload.output)
      }
    });
  }
  async failed(payload) {
    const errorMsg = payload.error instanceof Error ? payload.error.message : String(payload.error);
    await this.run.emitEvent({
      eventType: "agent.failed",
      agentKey: this.name,
      payload: {
        agentId: this.agentId,
        error: errorMsg
      }
    });
  }
  async modelCall(options, fn) {
    await this.run.checkpoint();
    const startTime = Date.now();
    await this.run.emitEvent({
      eventType: "model.started",
      agentKey: this.name,
      payload: {
        provider: options.provider,
        model: options.model,
        inputSummary: options.inputSummary
      }
    });
    let extraOutput = {};
    const recordOutput = (output) => {
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
          costUsd: extraOutput.costUsd
        }
      });
      return result;
    } catch (err) {
      const durationMs = Date.now() - startTime;
      const errorMsg = err instanceof Error ? err.message : String(err);
      await this.run.emitEvent({
        eventType: "model.failed",
        agentKey: this.name,
        payload: {
          provider: options.provider,
          model: options.model,
          error: errorMsg,
          durationMs
        }
      });
      throw err;
    }
  }
  async toolCall(options, fn) {
    await this.run.checkpoint();
    const startTime = Date.now();
    const redactedArgs = this.redactor(options.arguments || {});
    await this.run.emitEvent({
      eventType: "tool.started",
      agentKey: this.name,
      payload: {
        toolName: options.toolName,
        arguments: redactedArgs
      }
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
          durationMs
        }
      });
      return result;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      if (!this.run.isTerminal()) {
        await this.run.emitEvent({
          eventType: "tool.failed",
          agentKey: this.name,
          payload: {
            toolName: options.toolName,
            error: errorMsg
          }
        }).catch(() => {
        });
      }
      throw err;
    }
  }
  async requestApproval(options) {
    await this.run.checkpoint();
    const externalId = options.approvalId || `appr_${Math.random().toString(36).substring(2, 10)}_${Date.now()}`;
    const timeoutMs = options.timeoutMs || 3e5;
    const expiresInSeconds = Math.ceil(timeoutMs / 1e3);
    const delivery = this.run.delivery;
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
      expiresInSeconds
    });
    const startTime = Date.now();
    let pollIntervalMs = 500;
    while (Date.now() - startTime < timeoutMs) {
      if (this.run.isTerminal() || this.run.getControlState() === "CANCELLED") {
        throw new StewardRunCancelledError(this.run.runId, "Run was cancelled while waiting for approval");
      }
      const statusResult = await delivery.checkApprovalStatus(externalId);
      if (statusResult.status === "APPROVED") {
        return statusResult;
      }
      if (statusResult.status === "REJECTED") {
        throw new StewardApprovalRejectedError(externalId, statusResult.decisionReason || void 0);
      }
      if (statusResult.status === "EXPIRED" || statusResult.status === "CANCELLED") {
        throw new StewardApprovalExpiredError(externalId);
      }
      await new Promise((res) => setTimeout(res, pollIntervalMs));
      pollIntervalMs = Math.min(2e3, pollIntervalMs * 1.5);
    }
    throw new StewardApprovalExpiredError(externalId);
  }
  async guardedToolCall(options, fn) {
    const approvalResult = await this.requestApproval({
      approvalId: options.approvalId,
      toolName: options.toolName,
      arguments: options.arguments,
      reason: options.reason,
      riskLevel: options.riskLevel,
      timeoutMs: options.timeoutMs
    });
    if (approvalResult.status !== "APPROVED") {
      throw new StewardApprovalRejectedError(approvalResult.externalId, approvalResult.decisionReason || void 0);
    }
    return await this.toolCall(
      {
        toolName: options.toolName,
        arguments: options.arguments,
        metadata: options.metadata
      },
      fn
    );
  }
};

// src/run.ts
var StewardRun = class {
  runId;
  defaultAgentName;
  delivery;
  state = "created";
  controlState = "ACTIVE";
  redactor;
  checkpointWaiters = [];
  processedCommandIds = /* @__PURE__ */ new Set();
  pollTimer = null;
  isPolling = false;
  abortController = new AbortController();
  constructor(delivery, defaultAgentName, options = {}) {
    this.delivery = delivery;
    this.defaultAgentName = defaultAgentName;
    this.runId = options.runId || `run_${Math.random().toString(36).substring(2, 9)}_${Date.now()}`;
    this.redactor = createRedactor();
  }
  getState() {
    return this.state;
  }
  getControlState() {
    return this.controlState;
  }
  isTerminal() {
    return this.state === "completed" || this.state === "failed" || this.state === "cancelled";
  }
  async checkpoint() {
    if (this.isTerminal() || this.controlState === "CANCELLED") {
      throw new StewardRunCancelledError(this.runId, "Run was cancelled or reaches terminal state");
    }
    if (this.controlState === "ACTIVE") {
      return;
    }
    if (this.controlState === "PAUSED" || this.controlState === "PAUSE_REQUESTED") {
      return new Promise((resolve, reject) => {
        this.checkpointWaiters.push({ resolve, reject });
      });
    }
  }
  startCommandListener(options = {}) {
    if (this.isPolling) {
      throw new StewardStateError(`Command listener is already running for run '${this.runId}'`);
    }
    this.isPolling = true;
    const intervalMs = options.pollIntervalMs || 2e3;
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
        }
      }
    };
    poll();
    this.pollTimer = setInterval(poll, intervalMs);
  }
  stopCommandListener() {
    if (this.pollTimer) {
      clearInterval(this.pollTimer);
      this.pollTimer = null;
    }
    this.isPolling = false;
  }
  async processCommand(cmd, options) {
    const cmdKey = cmd.externalId || cmd.id || cmd.commandId;
    try {
      await this.delivery.acknowledgeCommand(this.runId, cmdKey).catch(() => {
      });
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
        this.abortController.abort();
        const waiters = [...this.checkpointWaiters];
        this.checkpointWaiters = [];
        const cancelErr = new StewardRunCancelledError(this.runId, cmd.reason || "Run cancelled by dashboard");
        waiters.forEach((w) => w.reject(cancelErr));
        await this.delivery.completeCommand(this.runId, cmdKey, { state: "CANCELLED" });
        this.stopCommandListener();
      }
    } catch (err) {
      const errorObj = { message: err.message || "Handler execution failed" };
      await this.delivery.failCommand(this.runId, cmdKey, errorObj).catch(() => {
      });
      this.controlState = "ACTIVE";
      throw err;
    }
  }
  async emitEvent(input) {
    if (this.isTerminal()) {
      throw new StewardStateError(
        `Cannot emit event '${input.eventType}' after run '${this.runId}' reached terminal state '${this.state}'`
      );
    }
    return await this.delivery.sendEvent({
      ...input,
      runId: this.runId
    });
  }
  async started(payload = {}) {
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
        input: this.redactor(payload.input)
      }
    });
  }
  async completed(payload = {}) {
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
          output: this.redactor(payload.output)
        }
      });
    } catch (err) {
      this.state = previousState;
      throw err;
    } finally {
      this.stopCommandListener();
    }
  }
  async failed(payload) {
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
          code: payload.code
        }
      });
    } catch (err) {
      this.state = previousState;
      throw err;
    } finally {
      this.stopCommandListener();
    }
  }
  async cancelled(payload = {}) {
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
          reason: payload.reason || "Run cancelled"
        }
      });
    } catch (err) {
      this.state = previousState;
      throw err;
    } finally {
      this.stopCommandListener();
    }
  }
  agent(options = {}) {
    return new StewardAgent(this, {
      agentId: options.agentId,
      name: options.name || this.defaultAgentName,
      metadata: options.metadata
    });
  }
};

// src/steward.ts
var Steward = class {
  options;
  delivery;
  constructor(options) {
    this.validateOptions(options);
    this.options = { ...options };
    this.delivery = new EventDeliveryClient(this.options);
  }
  validateOptions(options) {
    if (!options || typeof options !== "object") {
      throw new StewardConfigError("Steward configuration object is required");
    }
    if (!options.apiKey || typeof options.apiKey !== "string" || options.apiKey.trim() === "") {
      throw new StewardConfigError("Configuration 'apiKey' is required and cannot be empty");
    }
    if (!options.baseUrl || typeof options.baseUrl !== "string" || options.baseUrl.trim() === "") {
      throw new StewardConfigError("Configuration 'baseUrl' is required and cannot be empty");
    }
    try {
      new URL(options.baseUrl);
    } catch {
      throw new StewardConfigError(`Invalid 'baseUrl': '${options.baseUrl}' is not a valid URL`);
    }
    if (!options.agentName || typeof options.agentName !== "string" || options.agentName.trim() === "") {
      throw new StewardConfigError("Configuration 'agentName' is required and cannot be empty");
    }
  }
  startRun(options = {}) {
    return new StewardRun(this.delivery, this.options.agentName, options);
  }
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  DEFAULT_SENSITIVE_KEYS,
  Steward,
  StewardAgent,
  StewardApiError,
  StewardApprovalExpiredError,
  StewardApprovalRejectedError,
  StewardConfigError,
  StewardRun,
  StewardRunCancelledError,
  StewardRunPausedError,
  StewardStateError,
  createRedactor,
  isSensitiveKey
});
