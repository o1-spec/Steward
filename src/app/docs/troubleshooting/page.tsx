import React from "react";
import Link from "next/link";
import { DocumentSection } from "@/components/docs/DocumentComponents";

export const metadata = {
  title: "Troubleshooting — Steward Docs",
  description: "Diagnose common HTTP errors, connection issues, pending approvals, and SDK lifecycle exceptions.",
};

const TROUBLESHOOTING_ITEMS = [
  {
    code: "HTTP 401 Unauthorized",
    cause: "Missing or invalid STEWARD_API_KEY environment variable.",
    solution: "Verify your API key in Project Settings → API Keys and ensure STEWARD_API_KEY matches active key.",
  },
  {
    code: "HTTP 400 Bad Request",
    cause: "Event payload failed Zod schema validation (missing eventType, runId, or sequence).",
    solution: "Use @steward/sdk lifecycle methods (run.started, run.modelCall) to ensure automatic envelope formatting.",
  },
  {
    code: "No Run Appearing in Dashboard",
    cause: "Agent failed to emit run.started event or API URL points to incorrect host.",
    solution: "Confirm STEWARD_API_URL is configured (e.g., http://localhost:3000) and run.started() was awaited.",
  },
  {
    code: "SSE Stream Disconnected",
    cause: "Network interruption or proxy timeout.",
    solution: "Steward timeline automatically re-establishes SSE streaming with exponential backoff.",
  },
  {
    code: "Approval Request Remains Pending",
    cause: "Guarded tool call is waiting for human operator decision.",
    solution: "Open /approvals in Steward dashboard and click Approve or Reject to release the polling loop.",
  },
  {
    code: "StewardStateError: Run Terminal",
    cause: "Emitting events after run reached COMPLETED, FAILED, or CANCELLED status.",
    solution: "Do not invoke run methods after calling run.completed() or run.failed(). Start a new run instead.",
  },
];

export default function TroubleshootingDocsPage() {
  return (
    <div className="space-y-8">
      <div className="border-b border-stone-200 pb-6 space-y-2">
        <div className="text-xs font-mono text-stone-500">RESOURCES</div>
        <h1 className="text-2xl sm:text-3xl font-serif font-bold text-stone-900">
          Troubleshooting Guide
        </h1>
        <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
          Common error codes, connection diagnostic procedures, and SDK exception solutions.
        </p>
      </div>

      <DocumentSection id="error-table" title="Common Errors & Solutions">
        <div className="space-y-4">
          {TROUBLESHOOTING_ITEMS.map((item) => (
            <div key={item.code} className="p-4 rounded-xl bg-white border border-stone-200 space-y-1.5">
              <div className="font-mono text-xs font-bold text-stone-900 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                <span>{item.code}</span>
              </div>
              <div className="text-xs text-stone-600">
                <strong>Cause:</strong> {item.cause}
              </div>
              <div className="text-xs text-stone-800 bg-stone-50 p-2.5 rounded-lg border border-stone-200/80">
                <strong>Solution:</strong> {item.solution}
              </div>
            </div>
          ))}
        </div>
      </DocumentSection>

      <DocumentSection id="support" title="Need Further Assistance?">
        <p className="text-xs sm:text-sm text-stone-700">
          For technical issues or feature requests, visit the <Link href="/privacy" className="text-blue-600 underline">Privacy & Support contact page</Link> or consult the <Link href="/docs/sdk" className="text-blue-600 underline">SDK Reference</Link>.
        </p>
      </DocumentSection>

      {/* Pagination Nav */}
      <div className="pt-6 border-t border-stone-200 flex justify-between gap-4 text-xs font-medium">
        <Link
          href="/docs/security"
          className="p-3 rounded-xl border border-stone-200 bg-white hover:bg-stone-50 text-stone-700 transition-colors"
        >
          ← Redaction & Security
        </Link>
        <Link
          href="/docs"
          className="p-3 rounded-xl border border-stone-200 bg-white hover:bg-stone-50 text-stone-700 transition-colors text-right"
        >
          Documentation Home →
        </Link>
      </div>
    </div>
  );
}
