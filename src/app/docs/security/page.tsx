import React from "react";
import Link from "next/link";
import { DocumentSection, DocumentCallout, CodeBlock, InlineCode } from "@/components/docs/DocumentComponents";

export const metadata = {
  title: "Redaction & Security Boundaries — Steward Docs",
  description: "Steward security architecture, SHA-256 API key hashing, zero code execution, and automatic telemetry redaction.",
};

export default function RedactionSecurityDocsPage() {
  return (
    <div className="space-y-8">
      <div className="border-b border-stone-200 pb-6 space-y-2">
        <div className="text-xs font-mono text-stone-500">REFERENCE</div>
        <h1 className="text-2xl sm:text-3xl font-serif font-bold text-stone-900">
          Redaction & Security Boundaries
        </h1>
        <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
          Architectural security principles, secret handling, recursive key redaction, and project isolation in Steward.
        </p>
      </div>

      <DocumentSection id="api-key-security" title="API Key Security & SHA-256 Hashing">
        <p>
          Project API keys generated in Steward are presented to developers exactly once. Steward stores only cryptographically secure SHA-256 hashes of API keys (<InlineCode>ProjectApiKey.keyHash</InlineCode>). Raw secret keys are never persisted in our database.
        </p>
      </DocumentSection>

      <DocumentSection id="project-isolation" title="Multi-Tenant Project Isolation">
        <p>
          All database records (runs, events, approval requests, and control commands) are strictly bound to explicit project IDs. Authorization middleware verifies project membership before returning telemetry records.
        </p>
      </DocumentSection>

      <DocumentSection id="recursive-redaction" title="Recursive Secret Redaction">
        <p>
          The <InlineCode>@steward/sdk</InlineCode> performs client-side recursive key redaction before event envelopes leave your environment:
        </p>
        <CodeBlock
          code={`Default Redacted Keys:
- apiKey, api_key, secret, token, password, authToken
- authorization, cookie, set-cookie, privateKey, accessKey`}
          language="text"
          title="Redacted Keys List"
        />
        <DocumentCallout type="note" title="Risk Reduction Notice">
          Key-based redaction reduces exposure of common credentials but cannot guarantee detection of unstructured secrets embedded inside freeform text prompts.
        </DocumentCallout>
      </DocumentSection>

      <DocumentSection id="audit-logging" title="Append-Only Audit History">
        <p>
          Critical project operations — including human approval decisions, key creation, key revocation, and member updates — are stored in an append-only <InlineCode>AuditLog</InlineCode> table.
        </p>
      </DocumentSection>

      {/* Pagination Nav */}
      <div className="pt-6 border-t border-stone-200 flex justify-between gap-4 text-xs font-medium">
        <Link
          href="/docs/http-api"
          className="p-3 rounded-xl border border-stone-200 bg-white hover:bg-stone-50 text-stone-700 transition-colors"
        >
          ← HTTP API Reference
        </Link>
        <Link
          href="/docs/troubleshooting"
          className="p-3 rounded-xl border border-stone-200 bg-white hover:bg-stone-50 text-stone-700 transition-colors text-right"
        >
          Troubleshooting →
        </Link>
      </div>
    </div>
  );
}
