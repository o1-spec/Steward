import React from "react";
import Link from "next/link";
import { DocumentSection, DocumentCallout, CodeBlock, InlineCode } from "@/components/docs/DocumentComponents";

export const metadata = {
  title: "Node.js SDK Reference — Steward Docs",
  description: "Complete API reference for @steward/sdk classes, methods, error types, and configuration options.",
};

export default function SdkReferencePage() {
  return (
    <div className="space-y-8">
      <div className="border-b border-stone-200 pb-6 space-y-2">
        <div className="text-xs font-mono text-stone-500">REFERENCE</div>
        <h1 className="text-2xl sm:text-3xl font-serif font-bold text-stone-900">
          Node.js SDK Reference
        </h1>
        <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
          Comprehensive class and method reference for the official <InlineCode>@steward/sdk</InlineCode> package.
        </p>
      </div>

      <DocumentSection id="initialization" title="Steward Client Constructor">
        <CodeBlock
          code={`import { Steward } from "@steward/sdk";

const steward = new Steward({
  apiKey: process.env.STEWARD_API_KEY!, // Required: Project API Key
  agentName: "worker-01",                // Required: Default agent identifier
  baseUrl: "https://your-steward-instance.example", // Optional: Base API URL
  timeoutMs: 10000,                      // Optional: Request timeout (default 10s)
  maxRetries: 3,                         // Optional: Max retry attempts (default 3)
});`}
          language="ts"
          title="Steward Constructor"
        />
      </DocumentSection>

      <DocumentSection id="run-methods" title="StewardRun Lifecycle Methods">
        <CodeBlock
          code={`const run = steward.startRun({ runId: "custom_run_101" });

// Mark run started
await run.started({ task: "Process customer support ticket" });

// Mark run completed successfully (Terminal State)
await run.completed({ result: "Refund issued successfully" });

// Mark run failed (Terminal State)
await run.failed({ error: new Error("Payment gateway failure") });

// Mark run cancelled (Terminal State)
await run.cancelled({ reason: "Aborted by operator command" });`}
          language="ts"
          title="Run Lifecycle Methods"
        />

        <DocumentCallout type="warning" title="Terminal States">
          Once a run enters <InlineCode>COMPLETED</InlineCode>, <InlineCode>FAILED</InlineCode>, or <InlineCode>CANCELLED</InlineCode>, subsequent events emitted for that run produce a <InlineCode>StewardStateError</InlineCode>.
        </DocumentCallout>
      </DocumentSection>

      <DocumentSection id="agent-methods" title="StewardAgent Child Methods">
        <CodeBlock
          code={`const childAgent = run.createAgent({ agentName: "browser-subagent" });

await childAgent.started({ task: "Scrape product details" });
await childAgent.completed({ itemsScraped: 42 });`}
          language="ts"
          title="Child Agent Methods"
        />
      </DocumentSection>

      <DocumentSection id="model-call" title="modelCall()">
        <CodeBlock
          code={`const result = await run.modelCall({
  model: "gemini-2.5-flash",
  provider: "google",
  prompt: "Synthesize summary",
  fn: async () => {
    return {
      text: "Summary content",
      tokens: { input: 120, output: 40 },
      cost: 0.0001,
    };
  },
});`}
          language="ts"
          title="modelCall Instrumentation"
        />
      </DocumentSection>

      <DocumentSection id="tool-call" title="toolCall()">
        <CodeBlock
          code={`const queryResult = await run.toolCall({
  toolName: "db.query",
  arguments: { sql: "SELECT * FROM users" },
  fn: async () => {
    return await db.query("SELECT * FROM users");
  },
});`}
          language="ts"
          title="toolCall Instrumentation"
        />
      </DocumentSection>

      <DocumentSection id="guarded-tool-call" title="guardedToolCall()">
        <CodeBlock
          code={`const deleteResult = await run.guardedToolCall({
  toolName: "aws.s3.delete_bucket",
  arguments: { bucket: "prod-backups-2026", accessKey: "secret_123" },
  riskLevel: "HIGH",
  reason: "Clean deprecated production bucket",
  pollIntervalMs: 2000,
  timeoutMs: 300000,
  fn: async () => {
    return await s3.deleteBucket("prod-backups-2026");
  },
});`}
          language="ts"
          title="guardedToolCall Instrumentation"
        />
      </DocumentSection>

      <DocumentSection id="typed-errors" title="Typed Error Classes">
        <ul className="list-disc pl-5 space-y-1 font-mono text-xs text-stone-800">
          <li><strong>StewardConfigError</strong> — Invalid API key, empty agent name, or bad URL options.</li>
          <li><strong>StewardStateError</strong> — Emitting events after run reaches a terminal state.</li>
          <li><strong>StewardApprovalRejectedError</strong> — Human operator rejected a guarded tool call.</li>
          <li><strong>StewardApprovalExpiredError</strong> — Approval request timed out without a decision.</li>
          <li><strong>StewardRunCancelledError</strong> — Operator issued CANCEL command at checkpoint.</li>
        </ul>
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
          href="/docs/http-api"
          className="p-3 rounded-xl border border-stone-200 bg-white hover:bg-stone-50 text-stone-700 transition-colors text-right"
        >
          HTTP API Reference →
        </Link>
      </div>
    </div>
  );
}
