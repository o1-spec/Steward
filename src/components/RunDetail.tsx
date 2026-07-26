"use client";

import React, { useState } from "react";
import { EventCard, EventItem } from "./EventCard";
import { formatDuration, formatTimestamp } from "@/lib/formatters";

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
      <div className="flex-1 p-8 space-y-6 overflow-y-auto">
        <div className="space-y-3 animate-pulse">
          <div className="h-7 bg-slate-900 rounded w-1/3" />
          <div className="h-4 bg-slate-900/60 rounded w-1/4" />
        </div>
        <div className="space-y-4 pt-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 bg-slate-900/40 border border-slate-800/60 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (!run) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-slate-950/20">
        <div className="w-12 h-12 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-500 mb-4 shadow-inner">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
          </svg>
        </div>
        <h3 className="text-base font-semibold text-slate-200">Select a Run to Supervise</h3>
        <p className="text-xs text-slate-400 max-w-sm mt-1">
          Choose an agent run from the left menu to inspect its real-time event timeline and execution state.
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
      return (
        <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-800 text-slate-400 border border-slate-700">
          Terminal ({lifecycleStatus})
        </span>
      );
    }

    switch (controlState) {
      case "PAUSE_REQUESTED":
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/30 flex items-center gap-1.5 animate-pulse">
            <span className="w-2 h-2 rounded-full bg-amber-400" />
            Pause Requested
          </span>
        );
      case "PAUSED":
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-400" />
            Paused
          </span>
        );
      case "RESUME_REQUESTED":
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/30 flex items-center gap-1.5 animate-pulse">
            <span className="w-2 h-2 rounded-full bg-blue-400" />
            Resume Requested
          </span>
        );
      case "CANCEL_REQUESTED":
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/30 flex items-center gap-1.5 animate-pulse">
            <span className="w-2 h-2 rounded-full bg-rose-400" />
            Cancel Requested
          </span>
        );
      case "ACTIVE":
      default:
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Active
          </span>
        );
    }
  };

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-slate-950 overflow-hidden">
      {/* Run Header */}
      <header className="px-8 py-5 border-b border-slate-800 bg-slate-900/60 backdrop-blur-md">
        <div className="flex items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-bold text-slate-100 tracking-tight font-mono">
                {run.externalId}
              </h2>
              {getControlStateBadge()}
              {hasPendingApproval && (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center gap-1">
                  🛡️ Approval Pending
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-1 font-mono">
              Agent: <span className="text-indigo-400 font-semibold">{run.agentName}</span>
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

          {/* Cooperative Control Buttons */}
          {!isTerminal && (
            <div className="flex items-center gap-2">
              {controlState === "ACTIVE" && (
                <button
                  onClick={() => handleSendCommand("PAUSE", "Human operator paused run")}
                  disabled={isSubmittingCommand}
                  className="px-3.5 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 disabled:opacity-50"
                >
                  ⏸️ Pause Agent
                </button>
              )}

              {controlState === "PAUSE_REQUESTED" && (
                <button
                  disabled
                  className="px-3.5 py-1.5 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-lg text-xs font-semibold opacity-75 flex items-center gap-1.5"
                >
                  ⏳ Pause Requested...
                </button>
              )}

              {controlState === "PAUSED" && (
                <button
                  onClick={() => handleSendCommand("RESUME", "Human operator resumed run")}
                  disabled={isSubmittingCommand}
                  className="px-3.5 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 disabled:opacity-50"
                >
                  ▶️ Resume Agent
                </button>
              )}

              {controlState === "RESUME_REQUESTED" && (
                <button
                  disabled
                  className="px-3.5 py-1.5 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-lg text-xs font-semibold opacity-75 flex items-center gap-1.5"
                >
                  ⏳ Resume Requested...
                </button>
              )}

              {controlState !== "CANCEL_REQUESTED" ? (
                <button
                  onClick={() => setShowCancelModal(true)}
                  disabled={isSubmittingCommand}
                  className="px-3.5 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 disabled:opacity-50"
                >
                  🛑 Cancel Run
                </button>
              ) : (
                <button
                  disabled
                  className="px-3.5 py-1.5 bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded-lg text-xs font-semibold opacity-75 flex items-center gap-1.5"
                >
                  ⏳ Cancel Requested...
                </button>
              )}
            </div>
          )}
        </div>

        {commandError && (
          <div className="mt-3 p-2.5 bg-rose-500/10 border border-rose-500/30 rounded-lg text-xs text-rose-300 flex items-center justify-between">
            <span>Command Error: {commandError}</span>
            <button onClick={() => setCommandError(null)} className="text-rose-400 hover:text-rose-200">
              ✕
            </button>
          </div>
        )}
      </header>

      {/* Timeline Section */}
      <div className="flex-1 overflow-y-auto p-6 space-y-2">
        {hasPendingApproval && (
          <div className="mb-4 bg-amber-500/10 border border-amber-500/30 rounded-lg p-3.5 flex items-center justify-between text-xs text-amber-300">
            <span className="flex items-center gap-2 font-medium">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping" />
              Operational State: Waiting for Human Approval
            </span>
            <a
              href="/approvals"
              className="px-3 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/30 rounded font-semibold text-amber-200 transition-colors flex items-center gap-1"
            >
              Open Approvals Inbox →
            </a>
          </div>
        )}

        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Event Timeline
          </h3>
          <span className="text-xs font-mono text-slate-500">Chronological Stream ({run.events.length} events)</span>
        </div>

        {run.events.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-xs">
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
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 max-w-md w-full space-y-4 shadow-2xl">
            <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <span>⚠️ Confirm Agent Cancellation</span>
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              This will request the agent to cancel execution at the next cooperative checkpoint. Pending network requests and guarded tools will be aborted.
            </p>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">
                Reason for Cancellation (Optional)
              </label>
              <textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="e.g. Unusual tool behavior observed during research..."
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none focus:border-rose-500/50 min-h-17.5"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setShowCancelModal(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium transition-colors"
              >
                Never mind
              </button>
              <button
                onClick={() => handleSendCommand("CANCEL", cancelReason || "Cancelled from dashboard")}
                disabled={isSubmittingCommand}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-semibold transition-colors disabled:opacity-50"
              >
                Confirm Cancellation
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
