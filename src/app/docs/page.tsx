import React from "react";
import Link from "next/link";
import {
  PublicDocumentLayout,
  DocumentSection,
  DocumentCallout,
  CodeBlock,
  InlineCode,
  DocTocItem,
} from "@/components/docs/DocumentComponents";

export const metadata = {
  title: "Steward Documentation — Node.js SDK & Telemetry Protocol",
  description:
    "Official guide for connecting Node.js agents, streaming structured lifecycle telemetry, setting up human approval gates, and handling cooperative control signals.",
};

const TOC: DocTocItem[] = [
  { id: "introduction", title: "A. Introduction" },
  { id: "quickstart", title: "B. Quick Start" },
  { id: "initialization", title: "C. SDK Initialization" },
  { id: "run-lifecycle", title: "D. Run Lifecycle" },
  { id: "agent-lifecycle", title: "E. Agent Lifecycle" },
  { id: "model-instrumentation", title: "F. Model Instrumentation" },
  { id: "tool-instrumentation", title: "G. Tool Instrumentation" },
  { id: "approval-gates", title: "H. Human Approval Gates" },
  { id: "cooperative-controls", title: "I. Cooperative Controls" },
  { id: "event-protocol", title: "J. Event Protocol" },
  { id: "http-ingestion", title: "K. Direct HTTP Ingestion" },
  { id: "errors-retries", title: "L. Errors & Retries" },
  { id: "redaction", title: "M. Sensitive Data Redaction" },
  { id: "v1-limitations", title: "N. V1 Product Limitations" },
  { id: "troubleshooting", title: "O. Troubleshooting" },
  { id: "next-steps", title: "P. Next Steps" },
];

export default function DocsPage() {
  return (
    <PublicDocumentLayout
      title="Steward Documentation"
      subtitle="Connect a Node.js agent, stream its activity, hold sensitive actions for approval, and respond to cooperative control commands."
      lastUpdated="2026-07-27"
      toc={TOC}
      activePath="/docs"
      nextLink={{ title: "Security Overview", href: "/security" }}
    >
      {/* A. Introduction */}
      <DocumentSection id="introduction" title="A. Introduction">
        <p>
          Steward is a supervision workspace for autonomous AI agents. It provides real-time event streaming, human approval gates, cooperative control signals (<InlineCode>PAUSE</InlineCode>, <InlineCode>RESUME</InlineCode>, <InlineCode>CANCEL</InlineCode>), and append-only audit history.
        </p>

        <DocumentCallout type="note" title="What Steward Does & Does Not Do">
          <ul className="list-disc pl-4 space-y-1">
            <li><strong>Steward DOES</strong> collect sequence-ordered telemetry events, hold sensitive tool calls until a human approves or rejects, and emit control commands to connected agents.</li>
            <li><strong>Steward DOES NOT</strong> host your agent code, execute tools on your infrastructure, or collect private LLM chain-of-thought unless explicitly passed in telemetry envelopes.</li>
          </ul>
        </DocumentCallout>

        <p>
          Agent execution remains completely inside your local or cloud environment. Controls operate cooperatively through the <InlineCode>@steward/sdk</InlineCode> client.
        </p>
      </DocumentSection>

      {/* B. Quick Start */}
      <DocumentSection id="quickstart" title="B. Quick Start">
        <p>Follow these steps to connect your first Node.js agent:</p>
        <ol className="list-decimal pl-5 space-y-2">
          <li>Register an account at <Link href="/register" className="text-blue-600 underline">/register</Link> and create a project.</li>
          <li>Generate an API key in <strong>Project Settings → API Keys</strong>.</li>
          <li>Install the SDK package in your agent project:</li>
        </ol>

        <CodeBlock code="npm install @steward/sdk" language="bash" title="Terminal" />

        <p>Configure environment variables in your local <InlineCode>.env</InlineCode> file:</p>

        <CodeBlock
          code={`STEWARD_API_URL=http://localhost:3000
STEWARD_API_KEY=stwd_live_98f421a...`}
          language="env"
          title=".env"
        />

        <p>Start a run and inspect execution live in the Steward dashboard:</p>

        <CodeBlock
          code={`import { Steward } from "@steward/sdk";

const steward = new Steward({
  apiKey: process.env.STEWARD_API_KEY!,
  agentName: "deployment-agent",
});

const run = steward.startRun();
await run.started({ task: "Deploy production container" });`}
          language="ts"
          title="agent.ts"
        />
      </DocumentSection>

      {/* C. SDK Initialization */}
      <DocumentSection id="initialization" title="C. SDK Initialization">
        <p>
          Initialize the <InlineCode>Steward</InlineCode> client instance with your project configuration options:
        </p>

        <CodeBlock
          code={`import { Steward } from "@steward/sdk";

const steward = new Steward({
  apiKey: process.env.STEWARD_API_KEY!, // Project API Key (Required)
  agentName: "research-worker-01",      // Default agent name (Required)
  baseUrl: "http://localhost:3000",       // API Endpoint URL (Optional)
  timeoutMs: 10000,                       // Request timeout in ms (Optional, default 10s)
  maxRetries: 3,                          // Exponential backoff retries (Optional, default 3)
});`}
          language="ts"
          title="SDK Initialization"
        />
      </DocumentSection>

      {/* D. Run Lifecycle */}
      <DocumentSection id="run-lifecycle" title="D. Run Lifecycle">
        <p>
          A run represents a single execution session of an autonomous agent pipeline. Lifecycle methods emit sequence-ordered events to the ingestion API:
        </p>

        <CodeBlock
          code={`const run = steward.startRun({
  runId: "run_custom_123", // Optional custom run ID
});

// Emits run.started
await run.started({ task: "Process customer refund request" });

// Emits run.completed (Terminal state)
await run.completed({ result: "Refund processed successfully" });

// Or emit run.failed (Terminal state)
await run.failed({ error: new Error("Payment gateway connection timeout") });

// Or emit run.cancelled (Terminal state)
await run.cancelled({ reason: "User cancelled operation" });`}
          language="ts"
          title="Run Lifecycle"
        />

        <DocumentCallout type="warning" title="Terminal Lifecycle States">
          Once a run enters a terminal state (<InlineCode>COMPLETED</InlineCode>, <InlineCode>FAILED</InlineCode>, or <InlineCode>CANCELLED</InlineCode>), subsequent event emissions for that run ID will produce invalid lifecycle transition errors.
        </DocumentCallout>
      </DocumentSection>

      {/* E. Agent Lifecycle */}
      <DocumentSection id="agent-lifecycle" title="E. Agent Lifecycle">
        <p>
          Complex multi-agent pipelines can spawn child agent instances under an active run:
        </p>

        <CodeBlock
          code={`const agent = run.createAgent({
  agentName: "sub-worker-browser",
});

await agent.started({ task: "Scrape product documentation" });
await agent.completed({ pagesScraped: 14 });`}
          language="ts"
          title="Agent Lifecycle"
        />
      </DocumentSection>

      {/* F. Model Instrumentation */}
      <DocumentSection id="model-instrumentation" title="F. Model Instrumentation">
        <p>
          Instrument LLM model invocations to record duration, token usage, and cost metadata:
        </p>

        <CodeBlock
          code={`const result = await run.modelCall({
  model: "gemini-2.5-flash",
  provider: "google",
  prompt: "Synthesize summary of recent deployment checks",
  fn: async () => {
    // Invoke your actual LLM provider here
    return {
      text: "Deployment checks clean.",
      tokens: { input: 120, output: 45 },
      cost: 0.0001,
    };
  },
});`}
          language="ts"
          title="Model Instrumentation"
        />
      </DocumentSection>

      {/* G. Tool Instrumentation */}
      <DocumentSection id="tool-instrumentation" title="G. Tool Instrumentation">
        <p>
          Wrap standard read-only or low-risk tool invocations to stream tool execution telemetry:
        </p>

        <CodeBlock
          code={`const queryResult = await run.toolCall({
  toolName: "db.query",
  arguments: { sql: "SELECT * FROM users WHERE status = 'active'" },
  fn: async () => {
    return await db.query("SELECT * FROM users WHERE status = 'active'");
  },
});`}
          language="ts"
          title="Tool Instrumentation"
        />
      </DocumentSection>

      {/* H. Approval Gates */}
      <DocumentSection id="approval-gates" title="H. Human Approval Gates">
        <p>
          Guard high-risk tools so execution pauses safely until an operator approves or rejects the action in Steward:
        </p>

        <CodeBlock
          code={`const deleteResult = await run.guardedToolCall({
  toolName: "aws.s3.delete_bucket",
  arguments: { bucket: "prod-backups-2026", accessKey: "secret_token_123" },
  riskLevel: "HIGH",
  reason: "Clean up deprecated production storage bucket",
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

        <DocumentCallout type="important" title="Approval Gate Sequence">
          <ol className="list-decimal pl-4 space-y-1">
            <li>SDK transmits <InlineCode>approval.requested</InlineCode> event with redacted arguments.</li>
            <li>Steward holds request in <InlineCode>PENDING</InlineCode> status.</li>
            <li>SDK polls <InlineCode>/api/v1/approval-requests/:id</InlineCode> until a decision is recorded.</li>
            <li>If approved, the callback executes. If rejected or expired, <InlineCode>StewardApprovalRejectedError</InlineCode> or <InlineCode>StewardApprovalExpiredError</InlineCode> is thrown.</li>
          </ol>
        </DocumentCallout>
      </DocumentSection>

      {/* I. Cooperative Controls */}
      <DocumentSection id="cooperative-controls" title="I. Cooperative Controls">
        <p>
          Listen for dashboard operator commands (<InlineCode>PAUSE</InlineCode>, <InlineCode>RESUME</InlineCode>, <InlineCode>CANCEL</InlineCode>):
        </p>

        <CodeBlock
          code={`run.startCommandListener({
  pollIntervalMs: 3000,
  onPause: async (cmd) => console.log("Run paused:", cmd.reason),
  onResume: async (cmd) => console.log("Run resumed:", cmd.reason),
  onCancel: async (cmd) => console.log("Run cancelled:", cmd.reason),
});

// Place checkpoints inside long-running execution loops
for (const item of itemsToProcess) {
  await run.checkpoint(); // Throws StewardRunCancelledError if cancelled
  await processItem(item);
}`}
          language="ts"
          title="Cooperative Control Listener"
        />
      </DocumentSection>

      {/* J. Event Protocol */}
      <DocumentSection id="event-protocol" title="J. Event Protocol">
        <p>All telemetry events follow the standard Steward V1 event envelope specification:</p>

        <CodeBlock
          code={`{
  "specVersion": "1.0",
  "eventId": "evt_98f421a5b",
  "runId": "run_prod_4802",
  "agentName": "deployment-worker-01",
  "eventType": "tool.succeeded",
  "occurredAt": "2026-07-27T00:12:04.102Z",
  "sequence": 4,
  "payload": {
    "toolName": "db.query",
    "durationMs": 142,
    "arguments": { "authToken": "[REDACTED]" }
  }
}`}
          language="json"
          title="Event Envelope Schema"
        />
      </DocumentSection>

      {/* K. Direct HTTP Ingestion */}
      <DocumentSection id="http-ingestion" title="K. Direct HTTP Ingestion">
        <p>Non-Node.js systems can transmit events directly via HTTP POST:</p>

        <CodeBlock
          code={`POST /api/v1/events
Authorization: Bearer stwd_live_98f421a...
Content-Type: application/json

{
  "events": [
    {
      "specVersion": "1.0",
      "eventId": "evt_101",
      "runId": "run_999",
      "agentName": "python-worker",
      "eventType": "run.started",
      "occurredAt": "2026-07-27T00:00:00Z",
      "sequence": 1,
      "payload": { "task": "Data pipeline processing" }
    }
  ]
}`}
          language="http"
          title="Direct Ingestion Request"
        />
      </DocumentSection>

      {/* L. Errors & Retries */}
      <DocumentSection id="errors-retries" title="L. Errors & Retries">
        <p>The SDK exports typed error classes for handling execution exceptions:</p>
        <ul className="list-disc pl-5 space-y-1 font-mono text-xs">
          <li><strong className="text-stone-900">StewardConfigError</strong> — Missing or invalid API key/URL options.</li>
          <li><strong className="text-stone-900">StewardStateError</strong> — Invalid lifecycle transition.</li>
          <li><strong className="text-stone-900">StewardApprovalRejectedError</strong> — Operator rejected tool execution.</li>
          <li><strong className="text-stone-900">StewardApprovalExpiredError</strong> — Approval request expired without decision.</li>
          <li><strong className="text-stone-900">StewardRunCancelledError</strong> — Run aborted by operator command.</li>
        </ul>
      </DocumentSection>

      {/* M. Sensitive Data Redaction */}
      <DocumentSection id="redaction" title="M. Sensitive Data Redaction">
        <p>
          Before transmitting payloads, <InlineCode>@steward/sdk</InlineCode> recursively redacts matching keys:
        </p>

        <CodeBlock
          code={`Default Redacted Keys:
- apiKey, api_key, secret, token, password, authToken
- authorization, cookie, set-cookie, privateKey, accessKey`}
          language="text"
          title="Redacted Keys List"
        />

        <DocumentCallout type="note" title="Redaction Risk Reduction">
          Key-based redaction reduces exposure of common credentials but does not replace careful handling of confidential inputs.
        </DocumentCallout>
      </DocumentSection>

      {/* N. V1 Limitations */}
      <DocumentSection id="v1-limitations" title="N. V1 Product Limitations">
        <ul className="list-disc pl-5 space-y-1.5">
          <li>Node.js / TypeScript SDK only.</li>
          <li>Process control is cooperative (requires checkpoint polling loops).</li>
          <li>Does not record private model chain-of-thought.</li>
          <li>Approval requests expire if not answered within configured timeout.</li>
        </ul>
      </DocumentSection>

      {/* O. Troubleshooting */}
      <DocumentSection id="troubleshooting" title="O. Troubleshooting">
        <div className="space-y-3">
          <div>
            <strong className="text-stone-900">HTTP 401 Unauthorized:</strong> Verify your <InlineCode>STEWARD_API_KEY</InlineCode> matches an active project API key.
          </div>
          <div>
            <strong className="text-stone-900">SSE Reconnecting:</strong> Check network connectivity; event streams automatically reconnect with exponential backoff.
          </div>
          <div>
            <strong className="text-stone-900">Approval Pending:</strong> Open the <Link href="/approvals" className="text-blue-600 underline">Approvals Inbox</Link> to inspect and record an operator decision.
          </div>
        </div>
      </DocumentSection>

      {/* P. Next Steps */}
      <DocumentSection id="next-steps" title="P. Next Steps">
        <div className="flex flex-wrap gap-3 pt-2">
          <Link href="/register" className="px-4 py-2 bg-stone-900 text-white rounded-lg text-xs font-medium hover:bg-stone-800">
            Create Account
          </Link>
          <Link href="/security" className="px-4 py-2 border border-stone-300 bg-white text-stone-800 rounded-lg text-xs font-medium hover:bg-stone-50">
            Security Overview
          </Link>
          <Link href="/privacy" className="px-4 py-2 border border-stone-300 bg-white text-stone-800 rounded-lg text-xs font-medium hover:bg-stone-50">
            Privacy Policy
          </Link>
        </div>
      </DocumentSection>
    </PublicDocumentLayout>
  );
}
