import React from "react";
import Link from "next/link";
import { DocumentSection, DocumentCallout, CodeBlock, InlineCode } from "@/components/docs/DocumentComponents";

export const metadata = {
  title: "Human Approval Gates — Steward Docs",
  description: "Hold sensitive tool calls for human review, approve or reject execution, and enforce security boundaries.",
};

export default function ApprovalsDocsPage() {
  return (
    <div className="space-y-8">
      <div className="border-b border-stone-200 pb-6 space-y-2">
        <div className="text-xs font-mono text-stone-500">HUMAN SUPERVISION</div>
        <h1 className="text-2xl sm:text-3xl font-serif font-bold text-stone-900">
          Human Approval Gates
        </h1>
        <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
          Hold high-risk tool invocations in a safe polling loop until an operator approves or rejects execution in the Steward dashboard.
        </p>
      </div>

      <DocumentSection id="lifecycle" title="Approval Request Lifecycle">
        <p>An approval request passes through four explicit statuses:</p>
        <ul className="list-disc pl-5 space-y-1 font-mono text-xs text-stone-800">
          <li><strong>PENDING</strong> — The SDK has requested approval and is polling for a decision.</li>
          <li><strong>APPROVED</strong> — An operator explicitly authorized execution. Callback executes immediately.</li>
          <li><strong>REJECTED</strong> — An operator denied execution with a documented reason. SDK throws <InlineCode>StewardApprovalRejectedError</InlineCode>.</li>
          <li><strong>EXPIRED</strong> — No decision was recorded before the timeout window. SDK throws <InlineCode>StewardApprovalExpiredError</InlineCode>.</li>
        </ul>
      </DocumentSection>

      <DocumentSection id="guarded-example" title="Guarded Tool Call Example">
        <CodeBlock
          code={`const deleteResult = await run.guardedToolCall({
  toolName: "aws.s3.delete_bucket",
  arguments: { bucket: "prod-backups-2026", accessKey: "secret_123" },
  riskLevel: "HIGH",
  reason: "Clean deprecated production bucket",
  pollIntervalMs: 2000,
  timeoutMs: 300000, // 5 minute approval window
  fn: async () => {
    // Callback executes ONLY after human approval is recorded in Steward
    return await s3.deleteBucket("prod-backups-2026");
  },
});`}
          language="ts"
          title="Guarded Tool Call"
        />
      </DocumentSection>

      <DocumentSection id="security-boundary" title="Security Boundary Guarantees">
        <DocumentCallout type="important" title="Deterministic Guard Rail">
          <ul className="list-disc pl-4 space-y-1">
            <li><strong>Steward DOES NOT execute the tool.</strong> Your callback function remains in your local code.</li>
            <li><strong>The callback WILL NOT run before approval.</strong> Guarded wrappers poll HTTP endpoints until an <InlineCode>APPROVED</InlineCode> decision record exists.</li>
            <li><strong>Sensitive arguments are redacted.</strong> Arguments sent to Steward are filtered through client-side recursive key redaction before transmission.</li>
          </ul>
        </DocumentCallout>
      </DocumentSection>

      {/* Pagination Nav */}
      <div className="pt-6 border-t border-stone-200 flex justify-between gap-4 text-xs font-medium">
        <Link
          href="/docs/events"
          className="p-3 rounded-xl border border-stone-200 bg-white hover:bg-stone-50 text-stone-700 transition-colors"
        >
          ← Event Protocol
        </Link>
        <Link
          href="/docs/controls"
          className="p-3 rounded-xl border border-stone-200 bg-white hover:bg-stone-50 text-stone-700 transition-colors text-right"
        >
          Cooperative Controls →
        </Link>
      </div>
    </div>
  );
}
