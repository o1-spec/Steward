"use client";

import React, { useEffect, useState } from "react";
import { Sidebar } from "@/components/Sidebar";
import { ApprovalCard, ApprovalItem } from "@/components/ApprovalCard";
import { ApprovalModal } from "@/components/ApprovalModal";

export default function ApprovalsPage() {
  const [approvals, setApprovals] = useState<ApprovalItem[]>([]);
  const [filter, setFilter] = useState<string>("PENDING");
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [selectedApproval, setSelectedApproval] = useState<ApprovalItem | null>(null);
  const [selectedDecision, setSelectedDecision] = useState<"APPROVED" | "REJECTED" | null>(null);

  useEffect(() => {
    let isMounted = true;

    const loadApprovals = async () => {
      try {
        const res = await fetch(`/api/v1/approvals?status=${filter}`);
        if (res.ok && isMounted) {
          const data = await res.json();
          setApprovals(data.approvals || []);
        }
      } catch (err) {
        console.error("Failed to fetch approvals:", err);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadApprovals();
    const interval = setInterval(loadApprovals, 3000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [filter]);

  const handleSelectDecision = (approval: ApprovalItem, decision: "APPROVED" | "REJECTED") => {
    setSelectedApproval(approval);
    setSelectedDecision(decision);
  };

  const handleConfirmDecision = async (approvalId: string, decision: "APPROVED" | "REJECTED", reason: string) => {
    const res = await fetch(`/api/v1/approval-requests/${approvalId}/decision`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ decision, reason }),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.error || `Decision failed with status ${res.status}`);
    }

    // Refresh inbox
    const refreshRes = await fetch(`/api/v1/approvals?status=${filter}`);
    if (refreshRes.ok) {
      const data = await refreshRes.json();
      setApprovals(data.approvals || []);
    }
  };

  const pendingCount = approvals.filter((a) => a.status === "PENDING").length;

  return (
    <div className="flex h-screen bg-slate-950 text-slate-100 antialiased overflow-hidden font-sans">
      <Sidebar pendingApprovalsCount={pendingCount} />

      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <header className="px-8 py-6 border-b border-slate-800 bg-slate-950/80 backdrop-blur-md sticky top-0 z-10 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-slate-100 flex items-center gap-3">
              Human Approval Inbox
              {pendingCount > 0 && (
                <span className="text-xs bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2.5 py-0.5 rounded-full font-mono">
                  {pendingCount} Pending
                </span>
              )}
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Review and authorize sensitive agent operations before tool execution.
            </p>
          </div>

          <div className="flex items-center gap-1.5 bg-slate-900/80 p-1 rounded-lg border border-slate-800">
            {["PENDING", "APPROVED", "REJECTED", "EXPIRED", "ALL"].map((tab) => (
              <button
                key={tab}
                onClick={() => setFilter(tab)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  filter === tab
                    ? "bg-indigo-600 text-white shadow-xs"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
                }`}
              >
                {tab.charAt(0) + tab.slice(1).toLowerCase()}
              </button>
            ))}
          </div>
        </header>

        <div className="p-8 max-w-5xl space-y-4">
          {isLoading && approvals.length === 0 ? (
            <div className="space-y-4 animate-pulse">
              <div className="h-32 bg-slate-900 rounded-lg border border-slate-800" />
              <div className="h-32 bg-slate-900 rounded-lg border border-slate-800" />
            </div>
          ) : approvals.length === 0 ? (
            <div className="text-center py-16 bg-slate-900/40 border border-slate-800/80 rounded-xl space-y-3">
              <div className="text-3xl">🛡️</div>
              <h3 className="text-sm font-semibold text-slate-200">No {filter.toLowerCase()} approval requests</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                When agents execute tools guarded by human supervision, permission requests will appear here in real-time.
              </p>
            </div>
          ) : (
            approvals.map((approval) => (
              <ApprovalCard
                key={approval.id}
                approval={approval}
                onSelectDecision={handleSelectDecision}
              />
            ))
          )}
        </div>
      </main>

      {selectedApproval && selectedDecision && (
        <ApprovalModal
          approval={selectedApproval}
          decision={selectedDecision}
          onClose={() => {
            setSelectedApproval(null);
            setSelectedDecision(null);
          }}
          onConfirm={handleConfirmDecision}
        />
      )}
    </div>
  );
}
