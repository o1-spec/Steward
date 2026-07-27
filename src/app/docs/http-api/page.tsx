import React from "react";
import Link from "next/link";
import { DocumentSection, CodeBlock, InlineCode } from "@/components/docs/DocumentComponents";

export const metadata = {
  title: "HTTP API Reference — Steward Docs",
  description: "Direct REST API documentation for event ingestion, approval polling, and cooperative command management.",
};

export default function HttpApiDocsPage() {
  return (
    <div className="space-y-8">
      <div className="border-b border-stone-200 pb-6 space-y-2">
        <div className="text-xs font-mono text-stone-500">REFERENCE</div>
        <h1 className="text-2xl sm:text-3xl font-serif font-bold text-stone-900">
          HTTP API Reference
        </h1>
        <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
          Direct REST HTTP ingestion and supervision endpoints for non-Node.js agents or custom integrations.
        </p>
      </div>

      <DocumentSection id="authentication" title="Authentication Header">
        <p>Authenticate requests using your project API key as a Bearer token:</p>
        <CodeBlock
          code="Authorization: Bearer stwd_live_your_api_key"
          language="http"
          title="HTTP Header"
        />
      </DocumentSection>

      <DocumentSection id="post-events" title="POST /api/v1/events">
        <p>Batch ingest structured telemetry events:</p>
        <CodeBlock
          code={`POST /api/v1/events
Authorization: Bearer stwd_live_your_api_key
Content-Type: application/json

{
  "events": [
    {
      "specVersion": "1.0",
      "eventId": "evt_101",
      "runId": "run_custom_99",
      "agentName": "python-worker",
      "eventType": "run.started",
      "occurredAt": "2026-07-27T00:00:00Z",
      "sequence": 1,
      "payload": { "task": "Data pipeline run" }
    }
  ]
}`}
          language="http"
          title="Ingest Request"
        />
        <p className="text-xs text-stone-600 font-mono pt-1">
          Response: 201 Created <InlineCode>{`{ "accepted": 1, "duplicates": 0 }`}</InlineCode>
        </p>
      </DocumentSection>

      <DocumentSection id="poll-approval" title="GET /api/v1/approval-requests/:id">
        <p>Poll approval request status:</p>
        <CodeBlock
          code={`GET /api/v1/approval-requests/appr_98f421a
Authorization: Bearer stwd_live_your_api_key`}
          language="http"
          title="Poll Approval Status"
        />
      </DocumentSection>

      <DocumentSection id="post-command" title="POST /api/v1/runs/:runId/commands">
        <p>Dispatch a cooperative control command (<InlineCode>PAUSE</InlineCode>, <InlineCode>RESUME</InlineCode>, <InlineCode>CANCEL</InlineCode>):</p>
        <CodeBlock
          code={`POST /api/v1/runs/run_prod_4802/commands
Content-Type: application/json

{
  "type": "PAUSE",
  "reason": "Operator inspecting tool output"
}`}
          language="http"
          title="Dispatch Control Command"
        />
      </DocumentSection>

      <DocumentSection id="status-codes" title="HTTP Status Codes">
        <ul className="list-disc pl-5 space-y-1 font-mono text-xs text-stone-800">
          <li><strong>200 OK</strong> — Request succeeded.</li>
          <li><strong>201 Created</strong> — Telemetry events or command accepted.</li>
          <li><strong>400 Bad Request</strong> — Invalid event payload or schema validation failure.</li>
          <li><strong>401 Unauthorized</strong> — Missing or invalid API key / session.</li>
          <li><strong>404 Not Found</strong> — Run or approval request ID not found.</li>
          <li><strong>429 Too Many Requests</strong> — Rate limit exceeded.</li>
        </ul>
      </DocumentSection>

      {/* Pagination Nav */}
      <div className="pt-6 border-t border-stone-200 flex justify-between gap-4 text-xs font-medium">
        <Link
          href="/docs/sdk"
          className="p-3 rounded-xl border border-stone-200 bg-white hover:bg-stone-50 text-stone-700 transition-colors"
        >
          ← SDK Reference
        </Link>
        <Link
          href="/docs/security"
          className="p-3 rounded-xl border border-stone-200 bg-white hover:bg-stone-50 text-stone-700 transition-colors text-right"
        >
          Redaction & Security →
        </Link>
      </div>
    </div>
  );
}
