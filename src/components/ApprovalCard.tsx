"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { formatTimestamp } from "@/lib/formatters";
import { Badge } from "./ui/Badge";
import { Button } from "./ui/Button";

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

  const renderRiskBadge = (risk: string) => {
    const lower = risk.toLowerCase();
    if (lower === "high" || lower === "critical") return <Badge variant="high">HIGH RISK</Badge>;
    if (lower === "medium") return <Badge variant="medium">MEDIUM RISK</Badge>;
    return <Badge variant="low">LOW RISK</Badge>;
  };

  const renderStatusBadge = (status: string) => {
    switch (status) {
      case "APPROVED":
        return <Badge variant="completed">APPROVED</Badge>;
      case "REJECTED":
        return <Badge variant="failed">REJECTED</Badge>;
      case "EXPIRED":
        return <Badge variant="cancelled" className="font-mono">EXPIRED</Badge>;
      default:
        return <Badge variant="waiting">PENDING</Badge>;
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4 shadow-sm hover:border-slate-700 transition-colors text-slate-200">
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-mono text-sm font-bold text-white">{approval.toolName}</span>
            {renderRiskBadge(approval.riskLevel)}
            {renderStatusBadge(approval.status)}
          </div>
          <p className="text-xs text-slate-400 font-mono">
            Agent: <span className="font-medium text-slate-200">{approval.agentName}</span>
            {approval.run && (
              <>
                {" "}• Run:{" "}
                <Link href={`/runs?runId=${approval.run.id}`} className="text-blue-400 hover:underline">
                  {approval.run.externalId}
                </Link>
              </>
            )}
          </p>
        </div>

        {approval.status === "PENDING" && timeLeft && (
          <div className="text-right">
            <span className="text-xs font-mono font-medium text-amber-300 bg-amber-500/10 px-2.5 py-1 rounded border border-amber-500/30">
              Expires in: {timeLeft}
            </span>
          </div>
        )}
      </div>

      <div className="bg-slate-950/80 border border-slate-800/80 rounded-lg p-3 text-xs text-slate-300 font-mono">
        <span className="text-[11px] font-medium text-slate-500 block mb-1">Reason for Request:</span>
        <p className="leading-relaxed text-slate-200 font-sans">{approval.reason}</p>
      </div>

      <div>
        <button
          onClick={() => setShowJson(!showJson)}
          className="text-xs font-mono text-slate-400 hover:text-blue-400 flex items-center gap-1.5 transition-colors"
        >
          <span>{showJson ? "▼ Hide Arguments" : "▶ Show Redacted Tool Arguments"}</span>
        </button>
        {showJson && (
          <pre className="mt-2 text-xs font-mono bg-slate-950 p-3 rounded-lg border border-slate-800 text-slate-300 overflow-x-auto">
            {JSON.stringify(approval.arguments, null, 2)}
          </pre>
        )}
      </div>

      <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-xs text-slate-400 font-mono">
        <div>
          Requested: {formatTimestamp(approval.requestedAt)}
          {approval.decidedAt && (
            <span className="block text-slate-500 mt-0.5">
              Decided by <span className="text-slate-300">{approval.decidedBy || "Operator"}</span> at {formatTimestamp(approval.decidedAt)}
              {approval.decisionReason && ` ("${approval.decisionReason}")`}
            </span>
          )}
        </div>

        {approval.status === "PENDING" ? (
          <div className="flex items-center gap-2">
            <Button
              variant="destructive"
              size="sm"
              onClick={() => onSelectDecision(approval, "REJECTED")}
            >
              Reject
            </Button>
            <Button
              variant="success"
              size="sm"
              onClick={() => onSelectDecision(approval, "APPROVED")}
            >
              Approve
            </Button>
          </div>
        ) : (
          <span className="text-xs text-slate-500 italic">Decision recorded</span>
        )}
      </div>
    </div>
  );
};
