import React from "react";
import Link from "next/link";
import { DocumentSection, DocumentCallout, CodeBlock, InlineCode } from "@/components/docs/DocumentComponents";

export const metadata = {
  title: "Cooperative Controls — Steward Docs",
  description: "Cooperatively pause, resume, and cancel running agents using background command listeners and execution checkpoints.",
};

export default function ControlsDocsPage() {
  return (
    <div className="space-y-8">
      <div className="border-b border-stone-200 pb-6 space-y-2">
        <div className="text-xs font-mono text-stone-500">HUMAN SUPERVISION</div>
        <h1 className="text-2xl sm:text-3xl font-serif font-bold text-stone-900">
          Cooperative Controls (Pause, Resume, Cancel)
        </h1>
        <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
          Safely signal running agents to yield, resume, or abort execution from the Steward dashboard.
        </p>
      </div>

      <DocumentSection id="how-controls-work" title="Cooperative Control Model">
        <p>
          Steward uses a <strong>cooperative control model</strong>. Because connected agents execute within your own infrastructure (containers, cloud workers, or local processes), Steward cannot forcibly terminate an OS process or inject thread interrupts.
        </p>
        <p>
          Instead, dashboard operators dispatch command records (<InlineCode>PAUSE</InlineCode>, <InlineCode>RESUME</InlineCode>, <InlineCode>CANCEL</InlineCode>). The <InlineCode>@steward/sdk</InlineCode> polls for pending commands in a background listener and checks state at checkpoints.
        </p>
      </DocumentSection>

      <DocumentSection id="command-listener" title="Starting the Command Listener">
        <CodeBlock
          code={`run.startCommandListener({
  pollIntervalMs: 3000,
  onPause: async (cmd) => {
    console.log("Run paused by operator:", cmd.reason);
  },
  onResume: async (cmd) => {
    console.log("Run resumed by operator:", cmd.reason);
  },
  onCancel: async (cmd) => {
    console.log("Run cancelled by operator:", cmd.reason);
  },
});

// Place checkpoints inside long-running execution loops
for (const item of itemsToProcess) {
  await run.checkpoint(); // Throws StewardRunCancelledError if CANCEL is pending
  await processItem(item);
}`}
          language="ts"
          title="Command Listener & Checkpoint Example"
        />
      </DocumentSection>

      <DocumentSection id="offline-behavior" title="Offline Agent Behavior">
        <p>
          If an operator issues a command while an agent is offline or disconnected, the command remains in <InlineCode>PENDING</InlineCode> status until the agent reconnects and polls the pending commands endpoint (<InlineCode>GET /api/v1/runs/:runId/commands/pending</InlineCode>).
        </p>
      </DocumentSection>

      <DocumentSection id="limitations" title="Control Limitations">
        <DocumentCallout type="note" title="In-Flight Action Boundaries">
          Operations that have already started on third-party external services (such as an in-flight HTTP request to an external API) will complete before the next checkpoint takes effect.
        </DocumentCallout>
      </DocumentSection>

      {/* Pagination Nav */}
      <div className="pt-6 border-t border-stone-200 flex justify-between gap-4 text-xs font-medium">
        <Link
          href="/docs/approvals"
          className="p-3 rounded-xl border border-stone-200 bg-white hover:bg-stone-50 text-stone-700 transition-colors"
        >
          ← Approval Gates
        </Link>
        <Link
          href="/docs/sdk"
          className="p-3 rounded-xl border border-stone-200 bg-white hover:bg-stone-50 text-stone-700 transition-colors text-right"
        >
          SDK Reference →
        </Link>
      </div>
    </div>
  );
}
