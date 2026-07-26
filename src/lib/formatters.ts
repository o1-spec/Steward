export function formatEventLabel(eventType: string): string {
  const labels: Record<string, string> = {
    "agent.registered": "Agent Registered",
    "agent.heartbeat": "Agent Heartbeat",
    "run.started": "Run Started",
    "run.paused": "Run Paused",
    "run.resumed": "Run Resumed",
    "run.completed": "Run Completed",
    "run.failed": "Run Failed",
    "run.cancelled": "Run Cancelled",
    "step.started": "Step Started",
    "step.completed": "Step Completed",
    "step.failed": "Step Failed",
    "tool.requested": "Tool Requested",
    "tool.started": "Tool Started",
    "tool.succeeded": "Tool Execution Succeeded",
    "tool.failed": "Tool Execution Failed",
    "approval.requested": "Approval Requested",
    "approval.resolved": "Approval Resolved",
    "command.acknowledged": "Command Acknowledged",
  };

  if (labels[eventType]) {
    return labels[eventType];
  }

  return eventType
    .split(".")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export function formatDuration(
  start: Date | string | number,
  end?: Date | string | number | null
): string {
  const startTime = new Date(start).getTime();
  if (isNaN(startTime)) return "N/A";

  const endTime = end ? new Date(end).getTime() : Date.now();
  if (isNaN(endTime)) return "N/A";

  const diffMs = Math.max(0, endTime - startTime);
  const diffSec = diffMs / 1000;

  if (diffSec < 1) {
    return `${Math.round(diffMs)}ms`;
  }
  if (diffSec < 60) {
    return `${diffSec.toFixed(1)}s`;
  }

  const mins = Math.floor(diffSec / 60);
  const remainingSec = Math.round(diffSec % 60);
  if (mins < 60) {
    return `${mins}m ${remainingSec}s`;
  }

  const hours = Math.floor(mins / 60);
  const remainingMins = mins % 60;
  return `${hours}h ${remainingMins}m`;
}

export function formatTokens(tokens?: number | null): string {
  if (tokens === undefined || tokens === null) {
    return "";
  }
  return new Intl.NumberFormat("en-US").format(tokens);
}

export function formatCost(usd?: number | null): string {
  if (usd === undefined || usd === null) {
    return "";
  }
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 4,
  }).format(usd);
}

export function formatTimestamp(timestamp: Date | string | number): string {
  const date = new Date(timestamp);
  if (isNaN(date.getTime())) {
    return String(timestamp);
  }
  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });
}

export function formatEventSummary(eventType: string, payload: unknown): string {
  if (!payload || typeof payload !== "object") {
    return formatEventLabel(eventType);
  }

  const p = payload as Record<string, unknown>;

  if (p.summary && typeof p.summary === "string") {
    return p.summary;
  }
  if (p.task && typeof p.task === "string") {
    return `Task: ${p.task}`;
  }
  if (p.error && typeof p.error === "string") {
    return `Error: ${p.error}`;
  }
  if (p.name && typeof p.name === "string") {
    return `Name: ${p.name}`;
  }
  if (p.toolName && typeof p.toolName === "string") {
    return `Tool: ${p.toolName}`;
  }
  if (p.action && typeof p.action === "string") {
    return `Action: ${p.action}`;
  }
  if (p.reason && typeof p.reason === "string") {
    return `Reason: ${p.reason}`;
  }

  return formatEventLabel(eventType);
}
