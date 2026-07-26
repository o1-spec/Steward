"use client";

import React from "react";
import { formatDuration, formatTimestamp } from "@/lib/formatters";
import { Badge } from "./ui/Badge";

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

  const renderStatusBadge = (status: string) => {
    const lower = status.toLowerCase();
    switch (lower) {
      case "running":
      case "active":
        return <Badge variant="running">RUNNING</Badge>;
      case "completed":
        return <Badge variant="completed">COMPLETED</Badge>;
      case "failed":
        return <Badge variant="failed">FAILED</Badge>;
      case "paused":
        return <Badge variant="waiting" className="font-mono">PAUSED</Badge>;
      case "cancelled":
        return <Badge variant="cancelled">CANCELLED</Badge>;
      default:
        return <Badge variant="neutral">{status.toUpperCase()}</Badge>;
    }
  };

  return (
    <div className="w-80 border-r border-slate-800 bg-slate-950 flex flex-col shrink-0 h-screen overflow-hidden text-slate-200">
      {/* Search & Filter Header */}
      <div className="p-4 border-b border-slate-800 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-xs uppercase tracking-wider text-slate-400">
            Agent Runs
          </h2>
          <span className="text-xs font-mono text-slate-400 font-medium">
            {runs.length} {runs.length === 1 ? "run" : "runs"}
          </span>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-none">
          {filterOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={() => onStatusFilterChange(opt.value)}
              className={`px-2 py-1 rounded text-xs font-mono transition-all shrink-0 ${
                statusFilter === opt.value
                  ? "bg-blue-600 text-white font-medium"
                  : "bg-slate-900 text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-slate-800"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* List Content */}
      <div className="flex-1 overflow-y-auto divide-y divide-slate-800/80">
        {isLoading ? (
          <div className="p-4 space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="p-3.5 rounded-lg bg-slate-900/60 border border-slate-800 animate-pulse space-y-2"
              >
                <div className="h-4 bg-slate-800 rounded w-3/4" />
                <div className="h-3 bg-slate-800/60 rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : runs.length === 0 ? (
          <div className="p-8 text-center space-y-3">
            <div className="w-10 h-10 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center mx-auto text-slate-500 font-mono text-sm">
              Ø
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-300">No agent runs found</p>
              <p className="text-[11px] text-slate-400 mt-1">
                Connect @steward/sdk or execute your agent to stream runs.
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
                className={`w-full text-left p-3.5 transition-all flex flex-col gap-1.5 relative ${
                  isSelected
                    ? "bg-blue-950/40 border-l-2 border-l-blue-500 text-white"
                    : "hover:bg-slate-900/60 text-slate-300"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold text-xs font-mono text-slate-100 truncate">
                    {run.agentName}
                  </span>
                  {renderStatusBadge(run.status)}
                </div>

                <div className="text-[11px] font-mono text-slate-400 truncate">
                  {run.externalId}
                </div>

                <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 font-mono">
                  <span>{formatTimestamp(run.startedAt)}</span>
                  <div className="flex items-center gap-1.5">
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
