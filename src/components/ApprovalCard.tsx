"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { formatTimestamp } from "@/lib/formatters";

export interface ApprovalItem {
  id: string;
  projectId: string;
  runId: string;
  externalId: string;
  agentName: string;
  toolName: string;
  arguments: Record<string, unknown>;
  reason: string;
  riskLevel: string;
  status: string;
  requestedAt: string | Date;
  expiresAt: string | Date;
  decidedAt?: string | Date | null;
  decidedBy?: string | null;
  decisionReason?: string | null;
  run?: {
    id: string;
    externalId: string;
    agentName: string;
    status: string;
  };
}

interface ApprovalCardProps {
  approval: ApprovalItem;
  onSelectDecision: (approval: ApprovalItem, decision: "APPROVED" | "REJECTED") => void;
}

export const ApprovalCard: React.FC<ApprovalCardProps> = ({ approval, onSelectDecision }) => {
  const [timeLeft, setTimeLeft] = useState<string>("");
  const [showJson, setShowJson] = useState<boolean>(false);

  useEffect(() => {
    if (approval.status !== "PENDING") {
      return;
    }

    const updateCountdown = () => {
      const expires = new Date(approval.expiresAt).getTime();
      const now = Date.now();
      const diff = Math.max(0, Math.floor((expires - now) / 1000));

      if (diff <= 0) {
        setTimeLeft("Expired");
      } else {
        const mins = Math.floor(diff / 60);
        const secs = diff % 60;
        setTimeLeft(`${mins}m ${secs}s`);
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [approval.expiresAt, approval.status]);

  const riskBadgeColor = (risk: string) => {
    switch (risk.toLowerCase()) {
      case "critical":
        return "bg-red-500/10 text-red-400 border-red-500/20";
      case "high":
        return "bg-orange-500/10 text-orange-400 border-orange-500/20";
      case "medium":
        return "bg-yellow-500/10 text-yellow-400 border-yellow-500/20";
      default:
        return "bg-blue-500/10 text-blue-400 border-blue-500/20";
    }
  };

  const statusBadgeColor = (status: string) => {
    switch (status) {
      case "APPROVED":
        return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
      case "REJECTED":
        return "bg-rose-500/10 text-rose-400 border-rose-500/20";
      case "EXPIRED":
        return "bg-slate-500/10 text-slate-400 border-slate-500/20";
      default:
        return "bg-amber-500/10 text-amber-400 border-amber-500/20";
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-lg p-5 space-y-4 shadow-sm hover:border-slate-700 transition-colors">
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-mono text-sm font-semibold text-slate-100">{approval.toolName}</span>
            <span className={`text-xs px-2 py-0.5 rounded border uppercase tracking-wider font-medium ${riskBadgeColor(approval.riskLevel)}`}>
              {approval.riskLevel} risk
            </span>
            <span className={`text-xs px-2 py-0.5 rounded border font-semibold ${statusBadgeColor(approval.status)}`}>
              {approval.status}
            </span>
          </div>
          <p className="text-xs text-slate-400">
            Agent: <span className="font-medium text-slate-300">{approval.agentName}</span>
            {approval.run && (
              <>
                {" "}• Run:{" "}
                <Link href={`/runs?runId=${approval.run.id}`} className="font-mono text-indigo-400 hover:underline">
                  {approval.run.externalId}
                </Link>
              </>
            )}
          </p>
        </div>

        {approval.status === "PENDING" && timeLeft && (
          <div className="text-right">
            <span className="text-xs font-mono font-medium text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded border border-amber-500/20">
              Expires in: {timeLeft}
            </span>
          </div>
        )}
      </div>

      <div className="bg-slate-950/60 border border-slate-800/80 rounded p-3 text-sm text-slate-300">
        <span className="text-xs font-medium text-slate-500 block mb-1">Reason for Request:</span>
        <p className="leading-relaxed text-slate-200">{approval.reason}</p>
      </div>

      <div>
        <button
          onClick={() => setShowJson(!showJson)}
          className="text-xs font-mono text-slate-400 hover:text-indigo-400 flex items-center gap-1.5 transition-colors"
        >
          <span>{showJson ? "▼ Hide Arguments" : "▶ Show Redacted Arguments"}</span>
        </button>
        {showJson && (
          <pre className="mt-2 text-xs font-mono bg-slate-950 p-3 rounded border border-slate-800 text-slate-300 overflow-x-auto">
            {JSON.stringify(approval.arguments, null, 2)}
          </pre>
        )}
      </div>

      <div className="flex items-center justify-between pt-2 border-t border-slate-800/60 text-xs text-slate-400">
        <div>
          Requested: {formatTimestamp(approval.requestedAt)}
          {approval.decidedAt && (
            <span className="block text-slate-500 mt-0.5">
              Decided by <span className="text-slate-300">{approval.decidedBy || "Human Supervisor"}</span> at {formatTimestamp(approval.decidedAt)}
              {approval.decisionReason && ` ("${approval.decisionReason}")`}
            </span>
          )}
        </div>

        {approval.status === "PENDING" ? (
          <div className="flex items-center gap-2">
            <button
              onClick={() => onSelectDecision(approval, "REJECTED")}
              className="px-3.5 py-1.5 rounded text-xs font-medium bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 border border-rose-500/20 transition-colors"
            >
              Reject
            </button>
            <button
              onClick={() => onSelectDecision(approval, "APPROVED")}
              className="px-3.5 py-1.5 rounded text-xs font-medium bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/20 transition-colors"
            >
              Approve
            </button>
          </div>
        ) : (
          <span className="text-xs text-slate-500 italic">Decision recorded</span>
        )}
      </div>
    </div>
  );
};
