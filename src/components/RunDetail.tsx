"use client";

import React from "react";
import { EventCard, EventItem } from "./EventCard";
import { formatDuration, formatTimestamp } from "@/lib/formatters";

export interface RunDetailData {
  id: string;
  externalId: string;
  projectId: string;
  agentName: string;
  status: string;
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
}

export const RunDetail: React.FC<RunDetailProps> = ({ run, isLoading = false }) => {
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

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case "running":
      case "active":
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1.5 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Running
          </span>
        );
      case "completed":
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 shadow-sm">
            Completed
          </span>
        );
      case "failed":
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20 shadow-sm">
            Failed
          </span>
        );
      case "paused":
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20 shadow-sm">
            Paused
          </span>
        );
      case "cancelled":
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-500/10 text-slate-400 border border-slate-500/20 shadow-sm">
            Cancelled
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-500/10 text-slate-300 border border-slate-500/20">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="flex-1 flex flex-col h-screen overflow-hidden bg-slate-950/30">
      {/* Run Header */}
      <header className="p-6 border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md shrink-0 space-y-4">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-bold text-white tracking-tight">
                {run.agentName}
              </h2>
              {getStatusBadge(run.status)}
            </div>
            <p className="text-xs font-mono text-slate-400 mt-1">
              External ID: <span className="text-slate-300">{run.externalId}</span>
            </p>
          </div>

          {/* Action Control Buttons (Disabled with Tooltips) */}
          <div className="flex items-center gap-2">
            <div className="relative group">
              <button
                disabled
                className="px-3 py-1.5 rounded-lg bg-slate-900 text-slate-500 border border-slate-800 text-xs font-medium cursor-not-allowed opacity-60 flex items-center gap-1.5"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Pause
              </button>
              <div className="absolute right-0 bottom-full mb-2 hidden group-hover:block z-50 px-2 py-1 rounded bg-slate-900 border border-slate-800 text-[11px] text-slate-300 whitespace-nowrap shadow-xl">
                Coming in Milestone 5
              </div>
            </div>

            <div className="relative group">
              <button
                disabled
                className="px-3 py-1.5 rounded-lg bg-slate-900 text-slate-500 border border-slate-800 text-xs font-medium cursor-not-allowed opacity-60 flex items-center gap-1.5"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                </svg>
                Resume
              </button>
              <div className="absolute right-0 bottom-full mb-2 hidden group-hover:block z-50 px-2 py-1 rounded bg-slate-900 border border-slate-800 text-[11px] text-slate-300 whitespace-nowrap shadow-xl">
                Coming in Milestone 5
              </div>
            </div>

            <div className="relative group">
              <button
                disabled
                className="px-3 py-1.5 rounded-lg bg-slate-900 text-slate-500 border border-slate-800 text-xs font-medium cursor-not-allowed opacity-60 flex items-center gap-1.5"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                Cancel
              </button>
              <div className="absolute right-0 bottom-full mb-2 hidden group-hover:block z-50 px-2 py-1 rounded bg-slate-900 border border-slate-800 text-[11px] text-slate-300 whitespace-nowrap shadow-xl">
                Coming in Milestone 5
              </div>
            </div>
          </div>
        </div>

        {/* Metadata Bar */}
        <div className="flex items-center gap-6 text-xs text-slate-400 font-mono pt-2 border-t border-slate-800/60">
          <div>
            <span className="text-slate-400 font-sans">Started: </span>
            <span className="text-slate-200">{formatTimestamp(run.startedAt)}</span>
          </div>
          <div>
            <span className="text-slate-400 font-sans">Duration: </span>
            <span className="text-slate-200">{formatDuration(run.startedAt, run.endedAt)}</span>
          </div>
          <div>
            <span className="text-slate-400 font-sans">Events: </span>
            <span className="text-slate-200">{run.events.length} recorded</span>
          </div>
        </div>
      </header>

      {/* Timeline Section */}
      <div className="flex-1 overflow-y-auto p-6 space-y-2">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Event Timeline
          </h3>
          <span className="text-xs font-mono text-slate-500">Chronological Stream</span>
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
    </div>
  );
};
