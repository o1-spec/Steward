"use client";

import React, { useState } from "react";
import { ApprovalItem } from "./ApprovalCard";
import { Button } from "./ui/Button";

interface ApprovalModalProps {
  approval: ApprovalItem;
  decision: "APPROVED" | "REJECTED";
  onClose: () => void;
  onConfirm: (approvalId: string, decision: "APPROVED" | "REJECTED", reason: string) => Promise<void>;
}

export const ApprovalModal: React.FC<ApprovalModalProps> = ({
  approval,
  decision,
  onClose,
  onConfirm,
}) => {
  const [reason, setReason] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const isHighRisk = approval.riskLevel.toLowerCase() === "high" || approval.riskLevel.toLowerCase() === "critical";
  const isApprove = decision === "APPROVED";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      await onConfirm(approval.id, decision, reason);
      onClose();
    } catch (err: unknown) {
      setError((err as Error).message || "Failed to record decision");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-xs p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-lg w-full p-6 shadow-2xl space-y-5 text-slate-200">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
            Confirm Action:{" "}
            <span className={isApprove ? "text-emerald-400" : "text-rose-400"}>
              {decision}
            </span>
          </h3>
          <button
            onClick={onClose}
            aria-label="Close dialog"
            className="text-slate-400 hover:text-slate-200 text-sm leading-none font-mono"
          >
            ✕
          </button>
        </div>

        {isHighRisk && isApprove && (
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3.5 text-xs text-amber-300 space-y-1">
            <span className="font-semibold flex items-center gap-1.5">
              ⚠️ High-Risk Action Confirmation
            </span>
            <p>
              This tool call (<code className="font-mono font-bold text-amber-200">{approval.toolName}</code>) is classified as{" "}
              <strong className="uppercase">{approval.riskLevel} RISK</strong>. Please confirm you have verified the parameters before granting permission.
            </p>
          </div>
        )}

        <div className="space-y-2 text-xs font-mono text-slate-300 bg-slate-950 p-3.5 rounded-lg border border-slate-800">
          <div>
            <span className="text-slate-500">Tool:</span> <span className="text-blue-300 font-bold">{approval.toolName}</span>
          </div>
          <div>
            <span className="text-slate-500">Agent:</span> <span className="text-slate-200">{approval.agentName}</span>
          </div>
          <div>
            <span className="text-slate-500">Reason:</span> <span className="text-slate-200">{approval.reason}</span>
          </div>
        </div>

        {error && (
          <div className="text-xs bg-rose-500/10 text-rose-400 p-3 rounded-lg border border-rose-500/30 font-mono">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="decisionReason" className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
              Decision Reason (Optional)
            </label>
            <input
              id="decisionReason"
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={isApprove ? "e.g. Verified parameter safety" : "e.g. Unauthorized production modification"}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500 font-mono"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant={isApprove ? "success" : "destructive"}
              size="sm"
              isLoading={isSubmitting}
            >
              Confirm {decision}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
