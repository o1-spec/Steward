import React from "react";
import Link from "next/link";
import { DocumentSection, CodeBlock, InlineCode } from "@/components/docs/DocumentComponents";

export const metadata = {
  title: "Event Protocol — Steward Docs",
  description: "Steward V1 Event Envelope specification, sequence ordering, event types, payloads, and idempotency rules.",
};

const EVENT_TYPES = [
  { type: "run.started", component: "StewardRun", meaning: "Emitted when a new agent run starts execution." },
  { type: "run.completed", component: "StewardRun", meaning: "Emitted when a run finishes all tasks cleanly (Terminal State)." },
  { type: "run.failed", component: "StewardRun", meaning: "Emitted when a run encounters an unhandled exception (Terminal State)." },
  { type: "run.cancelled", component: "StewardRun", meaning: "Emitted when a run is aborted by an operator command (Terminal State)." },
  { type: "agent.started", component: "StewardAgent", meaning: "Emitted when a child subagent is initialized." },
  { type: "agent.completed", component: "StewardAgent", meaning: "Emitted when a child subagent completes its task." },
  { type: "agent.failed", component: "StewardAgent", meaning: "Emitted when a child subagent fails." },
  { type: "model.completed", component: "StewardRun", meaning: "Emitted when an LLM inference call completes." },
  { type: "tool.succeeded", component: "StewardRun", meaning: "Emitted when a standard tool callback executes successfully." },
  { type: "tool.failed", component: "StewardRun", meaning: "Emitted when a tool callback throws an error." },
  { type: "approval.requested", component: "StewardRun", meaning: "Emitted when a guarded tool call holds for human decision." },
  { type: "approval.decided", component: "Steward API", meaning: "Emitted when an operator records an APPROVE or REJECT decision." },
  { type: "command.requested", component: "Steward API", meaning: "Emitted when an operator dispatches a PAUSE, RESUME, or CANCEL signal." },
];

export default function EventsPage() {
  return (
    <div className="space-y-8">
      <div className="border-b border-stone-200 pb-6 space-y-2">
        <div className="text-xs font-mono text-stone-500">CORE CONCEPTS</div>
        <h1 className="text-2xl sm:text-3xl font-serif font-bold text-stone-900">
          Event Protocol Specification
        </h1>
        <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
          Structured telemetry envelopes, event sequence ordering, type definitions, and idempotency guarantees.
        </p>
      </div>

      <DocumentSection id="envelope" title="Standard Event Envelope Schema">
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
          title="Event Envelope JSON Schema"
        />
      </DocumentSection>

      <DocumentSection id="sequence-ordering" title="Sequence Ordering & Idempotency">
        <p>
          Every event emitted by <InlineCode>@steward/sdk</InlineCode> contains a strictly increasing integer <InlineCode>sequence</InlineCode> number starting at <InlineCode>1</InlineCode> per run ID.
        </p>
        <p>
          The ingestion API uses the combination of <InlineCode>runId + sequence</InlineCode> and <InlineCode>eventId</InlineCode> to guarantee idempotency. Re-transmitting duplicate events during network reconnects will not cause duplicate record insertion or corrupt sequence order.
        </p>
      </DocumentSection>

      <DocumentSection id="event-types" title="Supported V1 Event Types">
        <div className="border border-stone-200 rounded-xl overflow-hidden text-xs">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-stone-100 border-b border-stone-200 font-mono text-[11px] text-stone-600">
                <th className="p-3">Event Type</th>
                <th className="p-3">Emitted By</th>
                <th className="p-3">Meaning</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-200">
              {EVENT_TYPES.map((evt) => (
                <tr key={evt.type} className="hover:bg-stone-50">
                  <td className="p-3 font-mono font-bold text-stone-900">{evt.type}</td>
                  <td className="p-3 font-mono text-stone-500">{evt.component}</td>
                  <td className="p-3 text-stone-700">{evt.meaning}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </DocumentSection>

      {/* Pagination Nav */}
      <div className="pt-6 border-t border-stone-200 flex justify-between gap-4 text-xs font-medium">
        <Link
          href="/docs/quickstart"
          className="p-3 rounded-xl border border-stone-200 bg-white hover:bg-stone-50 text-stone-700 transition-colors"
        >
          ← Quickstart
        </Link>
        <Link
          href="/docs/approvals"
          className="p-3 rounded-xl border border-stone-200 bg-white hover:bg-stone-50 text-stone-700 transition-colors text-right"
        >
          Approval Gates →
        </Link>
      </div>
    </div>
  );
}
