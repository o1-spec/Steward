"use client";

import React from "react";
import { formatDuration, formatTimestamp } from "@/lib/formatters";

export interface RunItem {
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
  latestEventAt?: string | Date;
}

interface RunListProps {
  runs: RunItem[];
  selectedRunId?: string;
  onSelectRun: (runId: string) => void;
  statusFilter: string;
  onStatusFilterChange: (status: string) => void;
  isLoading?: boolean;
}

export const RunList: React.FC<RunListProps> = ({
  runs,
  selectedRunId,
  onSelectRun,
  statusFilter,
  onStatusFilterChange,
  isLoading = false,
}) => {
  const filterOptions = [
    { label: "All", value: "all" },
    { label: "Running", value: "running" },
    { label: "Completed", value: "completed" },
    { label: "Failed", value: "failed" },
    { label: "Paused", value: "paused" },
    { label: "Cancelled", value: "cancelled" },
  ];

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case "running":
      case "active":
        return (
          <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Running
          </span>
        );
      case "completed":
        return (
          <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            Completed
          </span>
        );
      case "failed":
        return (
          <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
            Failed
          </span>
        );
      case "paused":
        return (
          <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
            Paused
          </span>
        );
      case "cancelled":
        return (
          <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-500/10 text-slate-400 border border-slate-500/20">
            Cancelled
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-500/10 text-slate-300 border border-slate-500/20">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="w-80 border-r border-slate-800 bg-slate-950/60 flex flex-col shrink-0 h-screen overflow-hidden">
      {/* Search & Filter Header */}
      <div className="p-4 border-b border-slate-800/80 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-sm text-slate-200">Runs</h2>
          <span className="text-xs font-mono text-slate-500">{runs.length} runs</span>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-none">
          {filterOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={() => onStatusFilterChange(opt.value)}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all shrink-0 ${
                statusFilter === opt.value
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "bg-slate-900 text-slate-400 hover:text-slate-200 hover:bg-slate-800"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* List Content */}
      <div className="flex-1 overflow-y-auto divide-y divide-slate-800/60">
        {isLoading ? (
          <div className="p-4 space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="p-3.5 rounded-xl bg-slate-900/40 border border-slate-800/50 animate-pulse space-y-2"
              >
                <div className="h-4 bg-slate-800 rounded w-3/4" />
                <div className="h-3 bg-slate-800/60 rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : runs.length === 0 ? (
          <div className="p-8 text-center space-y-3">
            <div className="w-10 h-10 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center mx-auto text-slate-500">
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-slate-300">No agent runs found</p>
              <p className="text-xs text-slate-400 mt-1">
                Run the demo script or ingest events to populate this workspace.
              </p>
            </div>
          </div>
        ) : (
          runs.map((run) => {
            const isSelected = selectedRunId === run.id || selectedRunId === run.externalId;
            return (
              <button
                key={run.id}
                onClick={() => onSelectRun(run.id)}
                className={`w-full text-left p-3.5 transition-all flex flex-col gap-2 relative ${
                  isSelected
                    ? "bg-indigo-950/40 border-l-2 border-l-indigo-500 bg-gradient-to-r from-indigo-900/20 to-transparent"
                    : "hover:bg-slate-900/50"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold text-sm text-slate-100 truncate">
                    {run.agentName}
                  </span>
                  {getStatusBadge(run.status)}
                </div>

                <div className="text-xs font-mono text-slate-400 truncate">
                  {run.externalId}
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                  <span>{formatTimestamp(run.startedAt)}</span>
                  <div className="flex items-center gap-2 font-mono">
                    <span>{formatDuration(run.startedAt, run.endedAt)}</span>
                    <span>•</span>
                    <span>{run.eventCount} evts</span>
                  </div>
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
};
