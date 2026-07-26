export class StewardConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "StewardConfigError";
    Object.setPrototypeOf(this, StewardConfigError.prototype);
  }
}

export class StewardStateError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "StewardStateError";
    Object.setPrototypeOf(this, StewardStateError.prototype);
  }
}

export class StewardApiError extends Error {
  public readonly status: number;
  public readonly isRetryable: boolean;
  public readonly details?: unknown;

  constructor(status: number, message: string, isRetryable: boolean, details?: unknown) {
    super(message);
    this.name = "StewardApiError";
    this.status = status;
    this.isRetryable = isRetryable;
    this.details = details;
    Object.setPrototypeOf(this, StewardApiError.prototype);
  }
}

export class StewardApprovalRejectedError extends Error {
  public readonly approvalId: string;
  public readonly decisionReason?: string;

  constructor(approvalId: string, decisionReason?: string) {
    super(`Approval request '${approvalId}' was rejected by human supervisor${decisionReason ? `: ${decisionReason}` : ""}`);
    this.name = "StewardApprovalRejectedError";
    this.approvalId = approvalId;
    this.decisionReason = decisionReason;
    Object.setPrototypeOf(this, StewardApprovalRejectedError.prototype);
  }
}

export class StewardApprovalExpiredError extends Error {
  public readonly approvalId: string;

  constructor(approvalId: string) {
    super(`Approval request '${approvalId}' expired before human decision`);
    this.name = "StewardApprovalExpiredError";
    this.approvalId = approvalId;
    Object.setPrototypeOf(this, StewardApprovalExpiredError.prototype);
  }
}

export class StewardRunCancelledError extends Error {
  public readonly runId: string;
  public readonly reason?: string;

  constructor(runId: string, reason?: string) {
    super(`Run '${runId}' was cancelled${reason ? `: ${reason}` : ""}`);
    this.name = "StewardRunCancelledError";
    this.runId = runId;
    this.reason = reason;
    Object.setPrototypeOf(this, StewardRunCancelledError.prototype);
  }
}

export class StewardRunPausedError extends Error {
  public readonly runId: string;

  constructor(runId: string) {
    super(`Run '${runId}' is currently paused`);
    this.name = "StewardRunPausedError";
    this.runId = runId;
    Object.setPrototypeOf(this, StewardRunPausedError.prototype);
  }
}
