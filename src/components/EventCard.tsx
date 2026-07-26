"use client";

import React, { useState } from "react";
import {
  formatEventLabel,
  formatEventSummary,
  formatTimestamp,
  formatDuration,
  formatTokens,
  formatCost,
} from "@/lib/formatters";
import { redactSensitiveData } from "@/lib/redaction";

export interface EventItem {
  id: string;
  projectId: string;
  runId: string;
  externalId: string;
  type: string;
  timestamp: string | Date;
  sequence?: number | null;
  payload: unknown;
  createdAt: string | Date;
}

interface EventCardProps {
  event: EventItem;
}

export const EventCard: React.FC<EventCardProps> = ({ event }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const payloadObj =
    event.payload && typeof event.payload === "object"
      ? (event.payload as Record<string, unknown>)
      : {};

  const isError =
    event.type.endsWith(".failed") ||
    Boolean(payloadObj.error) ||
    Boolean(payloadObj.err);

  const getVariantStyles = () => {
    if (isError) {
      return {
        bg: "bg-rose-950/20 border-rose-900/50 hover:border-rose-700/60",
        badgeBg: "bg-rose-500/10 text-rose-400 border-rose-500/30",
        dotColor: "bg-rose-500 shadow-rose-500/50",
        icon: (
          <svg className="w-4 h-4 text-rose-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        ),
      };
    }

    if (event.type.startsWith("model.")) {
      return {
        bg: "bg-purple-950/20 border-purple-900/50 hover:border-purple-700/60",
        badgeBg: "bg-purple-500/10 text-purple-400 border-purple-500/30",
        dotColor: "bg-purple-400 shadow-purple-500/50",
        icon: (
          <svg className="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
        ),
      };
    }

    if (event.type.startsWith("tool.")) {
      return {
        bg: "bg-emerald-950/20 border-emerald-900/50 hover:border-emerald-700/60",
        badgeBg: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
        dotColor: "bg-emerald-400 shadow-emerald-500/50",
        icon: (
          <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          </svg>
        ),
      };
    }

    if (event.type.startsWith("approval.")) {
      return {
        bg: "bg-amber-950/20 border-amber-900/50 hover:border-amber-700/60",
        badgeBg: "bg-amber-500/10 text-amber-400 border-amber-500/30",
        dotColor: "bg-amber-400 shadow-amber-500/50",
        icon: (
          <svg className="w-4 h-4 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        ),
      };
    }

    // Default Lifecycle
    return {
      bg: "bg-slate-900/60 border-slate-800 hover:border-slate-700",
      badgeBg: "bg-indigo-500/10 text-indigo-400 border-indigo-500/30",
      dotColor: "bg-indigo-400 shadow-indigo-500/50",
      icon: (
        <svg className="w-4 h-4 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      ),
    };
  };

  const variant = getVariantStyles();
  const redactedPayload = redactSensitiveData(event.payload);

  const tokens =
    typeof payloadObj.tokens === "number"
      ? payloadObj.tokens
      : typeof payloadObj.totalTokens === "number"
      ? payloadObj.totalTokens
      : null;

  const cost =
    typeof payloadObj.cost === "number"
      ? payloadObj.cost
      : typeof payloadObj.costUsd === "number"
      ? payloadObj.costUsd
      : null;

  const durationMs =
    typeof payloadObj.durationMs === "number" ? payloadObj.durationMs : null;

  return (
    <div className="relative pl-6 pb-6 group">
      {/* Timeline Connector Line & Dot */}
      <div className="absolute left-[11px] top-6 bottom-0 w-px bg-slate-800 group-last:hidden" />
      <div
        className={`absolute left-[5px] top-3.5 w-3.5 h-3.5 rounded-full border-2 border-slate-950 ${variant.dotColor} shadow-sm z-10`}
      />

      {/* Card Content */}
      <div
        className={`rounded-xl border backdrop-blur-sm p-4 transition-all duration-200 shadow-sm ${variant.bg}`}
      >
        <div className="flex items-start justify-between gap-3 mb-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="p-1 rounded-md bg-slate-900/80 border border-slate-800">
              {variant.icon}
            </span>
            <span className="font-semibold text-sm text-slate-100">
              {formatEventLabel(event.type)}
            </span>
            <span
              className={`text-[10px] font-mono font-medium px-2 py-0.5 rounded-full border ${variant.badgeBg}`}
            >
              {event.type}
            </span>
            {event.sequence !== null && event.sequence !== undefined && (
              <span className="text-[10px] font-mono text-slate-400 bg-slate-900/80 px-1.5 py-0.5 rounded border border-slate-800">
                #{event.sequence}
              </span>
            )}
          </div>

          <div className="flex items-center gap-3 text-xs font-mono text-slate-400 shrink-0">
            {durationMs !== null && (
              <span className="text-slate-400">{formatDuration(0, durationMs)}</span>
            )}
            {tokens !== null && (
              <span className="text-slate-400">{formatTokens(tokens)} tok</span>
            )}
            {cost !== null && (
              <span className="text-emerald-400">{formatCost(cost)}</span>
            )}
            <span>{formatTimestamp(event.timestamp)}</span>
          </div>
        </div>

        {/* Human Readable Summary */}
        <p className="text-xs text-slate-300 font-medium mb-3">
          {formatEventSummary(event.type, event.payload)}
        </p>

        {/* Error Detail Block if applicable */}
        {isError && Boolean(payloadObj.error) && (
          <div className="mb-3 p-3 rounded-lg bg-rose-950/40 border border-rose-900/80 text-xs font-mono text-rose-300">
            <div className="font-semibold mb-1 flex items-center gap-1.5 text-rose-400">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Error Details
            </div>
            <div>{String(payloadObj.error)}</div>
          </div>
        )}

        {/* Expandable JSON viewer */}
        <div className="pt-1">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="inline-flex items-center gap-1.5 text-xs font-mono text-indigo-400 hover:text-indigo-300 transition-colors"
          >
            <svg
              className={`w-3.5 h-3.5 transition-transform duration-200 ${
                isExpanded ? "rotate-90" : ""
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            <span>{isExpanded ? "Hide Payload" : "View Raw Payload"}</span>
          </button>

          {isExpanded && (
            <div className="mt-2.5 p-3 rounded-lg bg-slate-950 border border-slate-900 font-mono text-[11px] leading-relaxed text-slate-300 overflow-x-auto">
              <pre>{JSON.stringify(redactSensitiveData(redactedPayload), null, 2)}</pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
