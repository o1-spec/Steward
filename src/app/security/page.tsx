import React from "react";
import {
  PublicDocumentLayout,
  DocumentSection,
  DocumentCallout,
  InlineCode,
  DocTocItem,
} from "@/components/docs/DocumentComponents";

export const metadata = {
  title: "Security Overview — Steward",
  description: "Steward security architecture, SHA-256 API key hashing, zero code execution, and automatic telemetry redaction.",
};

const TOC: DocTocItem[] = [
  { id: "isolation", title: "1. Multi-Tenant Project Isolation" },
  { id: "key-security", title: "2. API Key Management & Hashing" },
  { id: "zero-execution", title: "3. Zero Code Execution Boundary" },
  { id: "redaction", title: "4. Automatic Telemetry Redaction" },
  { id: "audit-logging", title: "5. Append-Only Audit Logging" },
  { id: "transport", title: "6. Transport & Session Security" },
];

export default function SecurityPage() {
  return (
    <PublicDocumentLayout
      title="Security Overview"
      subtitle="Architectural principles, secret handling, and data boundary design in Steward."
      lastUpdated="2026-07-27"
      toc={TOC}
      activePath="/security"
      prevLink={{ title: "Documentation", href: "/docs" }}
      nextLink={{ title: "Privacy Policy", href: "/privacy" }}
    >
      <DocumentSection id="isolation" title="1. Multi-Tenant Project Isolation">
        <p>
          Steward enforces strict multi-tenant project boundary isolation. Users belong to explicit project memberships with role-based access controls (<InlineCode>OWNER</InlineCode> or <InlineCode>MEMBER</InlineCode>).
        </p>
        <p>
          All API requests, telemetry events, human approvals, and cooperative control commands are scope-validated to verify project ownership before returning records.
        </p>
      </DocumentSection>

      <DocumentSection id="key-security" title="2. API Key Management & Hashing">
        <p>
          Project API keys generated in the Steward dashboard are presented to developers exactly once upon creation.
        </p>
        <DocumentCallout type="note" title="SHA-256 Key Storage">
          Steward stores only cryptographically secure SHA-256 hashes of project API keys (<InlineCode>ProjectApiKey.keyHash</InlineCode>). Raw secret keys are never persisted in our database or readable by database administrators.
        </DocumentCallout>
      </DocumentSection>

      <DocumentSection id="zero-execution" title="3. Zero Code Execution Boundary">
        <p>
          Steward operates as an external telemetry and supervision layer. Steward does not host your agent code, execute arbitrary customer tools, or maintain SSH/shell access to your runtime environment.
        </p>
        <p>
          Control signals (<InlineCode>PAUSE</InlineCode>, <InlineCode>RESUME</InlineCode>, <InlineCode>CANCEL</InlineCode>) are issued as cooperative state records that connected agents poll and acknowledge cleanly.
        </p>
      </DocumentSection>

      <DocumentSection id="redaction" title="4. Automatic Telemetry Redaction">
        <p>
          The <InlineCode>@steward/sdk</InlineCode> redacts sensitive fields recursively on the client side before events leave your environment.
        </p>
        <p>
          Keys matching sensitive terms (such as <InlineCode>password</InlineCode>, <InlineCode>apiKey</InlineCode>, <InlineCode>token</InlineCode>, <InlineCode>secret</InlineCode>, <InlineCode>authorization</InlineCode>, <InlineCode>cookie</InlineCode>) are replaced with <InlineCode>[REDACTED]</InlineCode>.
        </p>
      </DocumentSection>

      <DocumentSection id="audit-logging" title="5. Append-Only Audit Logging">
        <p>
          Critical operational events — such as human approval decisions, key creation, key revocation, and project member updates — are recorded in an append-only <InlineCode>AuditLog</InlineCode> table.
        </p>
      </DocumentSection>

      <DocumentSection id="transport" title="6. Transport & Session Security">
        <p>
          All network communication requires TLS/HTTPS transport encryption. User sessions are secured using HTTP-only, SameSite-protected session cookies (<InlineCode>stwd_session</InlineCode>), and user passwords are hashed using bcrypt.
        </p>
      </DocumentSection>
    </PublicDocumentLayout>
  );
}
