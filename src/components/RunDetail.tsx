"use client";

import React, { useState } from "react";
import { EventCard, EventItem } from "./EventCard";
import { formatDuration, formatTimestamp } from "@/lib/formatters";
import { Badge } from "./ui/Badge";
import { Button } from "./ui/Button";

export interface RunDetailData {
  id: string;
  externalId: string;
  projectId: string;
  agentName: string;
  status: string;
  controlState?: string;
  startedAt: string | Date;
  endedAt?: string | Date | null;
  createdAt: string | Date;
  updatedAt: string | Date;
  eventCount: number;
  events: EventItem[];
  project?: {
    id: string;
    name: string;
    slug: string;
  };
}

interface RunDetailProps {
  run: RunDetailData | null;
  isLoading?: boolean;
  onCommandSent?: () => void;
}

export const RunDetail: React.FC<RunDetailProps> = ({ run, isLoading = false, onCommandSent }) => {
  const [isSubmittingCommand, setIsSubmittingCommand] = useState<boolean>(false);
  const [showCancelModal, setShowCancelModal] = useState<boolean>(false);
  const [cancelReason, setCancelReason] = useState<string>("");
  const [commandError, setCommandError] = useState<string | null>(null);

  if (isLoading) {
    return (
      <div className="flex-1 p-8 space-y-6 overflow-y-auto bg-slate-950 text-slate-200">
        <div className="space-y-3 animate-pulse">
          <div className="h-7 bg-slate-900 rounded w-1/3" />
          <div className="h-4 bg-slate-900/60 rounded w-1/4" />
        </div>
        <div className="space-y-4 pt-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 bg-slate-900/40 border border-slate-800 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (!run) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-slate-950 text-slate-300">
        <div className="w-12 h-12 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-500 mb-3">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
          </svg>
        </div>
        <h3 className="text-sm font-semibold text-slate-200">Select an Agent Run</h3>
        <p className="text-xs text-slate-400 max-w-sm mt-1">
          Choose a run from the left panel to inspect real-time events, model calls, and cooperative execution controls.
        </p>
      </div>
    );
  }

  const hasPendingApproval = run.events.some(
    (e) =>
      e.type === "approval.requested" &&
      !run.events.some((e2) =>
        ["approval.approved", "approval.rejected", "approval.expired", "approval.cancelled"].includes(e2.type)
      )
  );

  const controlState = (run.controlState || "ACTIVE").toUpperCase();
  const lifecycleStatus = run.status.toUpperCase();
  const isTerminal = ["COMPLETED", "FAILED", "CANCELLED"].includes(lifecycleStatus);

  const handleSendCommand = async (type: "PAUSE" | "RESUME" | "CANCEL", reason?: string) => {
    setIsSubmittingCommand(true);
    setCommandError(null);

    try {
      const res = await fetch(`/api/v1/runs/${run.externalId}/commands`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, reason }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `Command failed with status ${res.status}`);
      }

      setShowCancelModal(false);
      setCancelReason("");
      if (onCommandSent) {
        onCommandSent();
      }
    } catch (err: unknown) {
      setCommandError((err as Error).message);
    } finally {
      setIsSubmittingCommand(false);
    }
  };

  const getControlStateBadge = () => {
    if (isTerminal) {
      if (lifecycleStatus === "COMPLETED") return <Badge variant="completed">COMPLETED</Badge>;
      if (lifecycleStatus === "FAILED") return <Badge variant="failed">FAILED</Badge>;
      return <Badge variant="cancelled">CANCELLED</Badge>;
    }

    switch (controlState) {
      case "PAUSE_REQUESTED":
        return <Badge variant="waiting">PAUSE REQUESTED</Badge>;
      case "PAUSED":
        return <Badge variant="waiting">PAUSED</Badge>;
      case "RESUME_REQUESTED":
        return <Badge variant="brand">RESUME REQUESTED</Badge>;
      case "CANCEL_REQUESTED":
        return <Badge variant="failed">CANCEL REQUESTED</Badge>;
      case "ACTIVE":
      default:
        return <Badge variant="running">ACTIVE</Badge>;
    }
  };

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-slate-950 text-slate-200 overflow-hidden">
      {/* Header */}
      <header className="px-6 py-4 border-b border-slate-800 bg-slate-900/80">
        <div className="flex items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-sm font-bold text-slate-100 tracking-tight font-mono">
                {run.externalId}
              </h2>
              {getControlStateBadge()}
              {hasPendingApproval && (
                <Badge variant="waiting">APPROVAL PENDING</Badge>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-1 font-mono">
              Agent: <span className="text-blue-400 font-medium">{run.agentName}</span>
              <span className="mx-2">•</span>
              Started {formatTimestamp(run.startedAt)}
              {run.endedAt && (
                <>
                  <span className="mx-2">•</span>
                  Duration: {formatDuration(run.startedAt, run.endedAt)}
                </>
              )}
            </p>
          </div>

          {/* Cooperative Control Actions */}
          {!isTerminal && (
            <div className="flex items-center gap-2">
              {controlState === "ACTIVE" && (
                <Button
                  variant="amber"
                  size="sm"
                  isLoading={isSubmittingCommand}
                  onClick={() => handleSendCommand("PAUSE", "Human operator paused run")}
                >
                  ⏸️ Pause Agent
                </Button>
              )}

              {controlState === "PAUSED" && (
                <Button
                  variant="success"
                  size="sm"
                  isLoading={isSubmittingCommand}
                  onClick={() => handleSendCommand("RESUME", "Human operator resumed run")}
                >
                  ▶️ Resume Agent
                </Button>
              )}

              {controlState !== "CANCEL_REQUESTED" ? (
                <Button
                  variant="destructive"
                  size="sm"
                  isLoading={isSubmittingCommand}
                  onClick={() => setShowCancelModal(true)}
                >
                  🛑 Cancel Run
                </Button>
              ) : (
                <span className="text-xs font-mono text-rose-400">Cancel Requested...</span>
              )}
            </div>
          )}
        </div>

        {commandError && (
          <div className="mt-3 p-2.5 bg-rose-950/60 border border-rose-800 rounded-md text-xs text-rose-300 flex items-center justify-between font-mono">
            <span>Error: {commandError}</span>
            <button onClick={() => setCommandError(null)} className="text-rose-400 hover:text-rose-200">
              ✕
            </button>
          </div>
        )}
      </header>

      {/* Timeline Stream Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-2">
        {hasPendingApproval && (
          <div className="mb-4 bg-amber-500/10 border border-amber-500/30 rounded-lg p-3.5 flex items-center justify-between text-xs text-amber-300">
            <span className="flex items-center gap-2 font-medium">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
              Operational Checkpoint: Waiting for Human Approval
            </span>
            <a
              href="/approvals"
              className="px-3 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/30 rounded font-semibold text-amber-200 transition-colors"
            >
              Open Approvals Inbox →
            </a>
          </div>
        )}

        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Execution Event Stream
          </h3>
          <span className="text-xs font-mono text-slate-400">{run.events.length} events</span>
        </div>

        {run.events.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-xs font-mono">
            No events recorded yet for this run.
          </div>
        ) : (
          <div className="space-y-1">
            {run.events.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        )}
      </div>

      {/* Cancel Confirmation Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 max-w-md w-full space-y-4 shadow-2xl">
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <span>⚠️ Confirm Agent Cancellation</span>
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              This sends a cancel command to the connected SDK. The run will abort safely at the next cooperative checkpoint.
            </p>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">
                Reason for Cancellation (Optional)
              </label>
              <textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="Unusual tool behavior or manual operator intervention..."
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none focus:border-rose-500 min-h-18 font-mono"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setShowCancelModal(false)}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                size="sm"
                isLoading={isSubmittingCommand}
                onClick={() => handleSendCommand("CANCEL", cancelReason || "Cancelled from dashboard")}
              >
                Confirm Cancellation
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
