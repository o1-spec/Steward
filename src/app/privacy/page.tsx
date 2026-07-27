import React from "react";
import {
  PublicDocumentLayout,
  DocumentSection,
  DocumentCallout,
  InlineCode,
  DocTocItem,
} from "@/components/docs/DocumentComponents";
import { LEGAL_CONFIG } from "@/lib/legal-config";

export const metadata = {
  title: "Privacy Policy — Steward",
  description: "Steward data boundary, telemetry redaction, and privacy policy.",
};

const TOC: DocTocItem[] = [
  { id: "scope", title: "A. Scope" },
  { id: "user-provided", title: "B. Information Users Provide" },
  { id: "agent-telemetry", title: "C. Agent Telemetry" },
  { id: "automatic-info", title: "D. Information Collected Automatically" },
  { id: "redaction", title: "E. Sensitive Data Redaction" },
  { id: "how-used", title: "F. How Information Is Used" },
  { id: "legal-bases", title: "G. Legal Bases" },
  { id: "data-sharing", title: "H. Data Sharing & Subprocessors" },
  { id: "retention", title: "I. Data Retention" },
  { id: "security", title: "J. Security Safeguards" },
  { id: "user-rights", title: "K. User Choices and Rights" },
  { id: "international", title: "L. International Processing" },
  { id: "children", title: "M. Children's Privacy" },
  { id: "changes", title: "N. Policy Changes" },
  { id: "contact", title: "O. Contact Information" },
];

export default function PrivacyPage() {
  return (
    <PublicDocumentLayout
      title="Privacy Policy"
      subtitle="How Steward handles account information, telemetry, secret redaction, and data retention."
      lastUpdated={LEGAL_CONFIG.LAST_UPDATED_DATE}
      toc={TOC}
      activePath="/privacy"
      prevLink={{ title: "Security Overview", href: "/security" }}
      nextLink={{ title: "Terms of Service", href: "/terms" }}
    >
      <DocumentCallout type="note" title="Review Draft Notice">
        This document is an accurate product draft describing Steward V1 operational behavior. It is subject to formal legal sign-off prior to commercial release.
      </DocumentCallout>

      <DocumentSection id="scope" title="A. Scope">
        <p>
          This Privacy Policy describes how {LEGAL_CONFIG.PRODUCT_NAME} (&quot;we,&quot; &quot;us,&quot; or &quot;our&quot;) collects, uses, and safeguards information when you use our website, dashboard, APIs, and Node.js SDK (<InlineCode>@steward/sdk</InlineCode>).
        </p>
      </DocumentSection>

      <DocumentSection id="user-provided" title="B. Information Users Provide">
        <p>We collect information you explicitly provide when creating an account or managing projects:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Full name and email address during account registration.</li>
          <li>Account passwords, stored securely using bcrypt hashing.</li>
          <li>Project names and configuration options.</li>
          <li>Human approval decision reasons and audit notes.</li>
        </ul>
      </DocumentSection>

      <DocumentSection id="agent-telemetry" title="C. Agent Telemetry">
        <p>
          When you connect an agent using <InlineCode>@steward/sdk</InlineCode>, your connected code transmits structured lifecycle events to our ingestion API. Telemetry fields may include:
        </p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Run identifiers and agent names.</li>
          <li>Event types, timestamps, and sequence numbers.</li>
          <li>Tool names, execution durations, and tool status.</li>
          <li>Model names, token usage, and cost estimates.</li>
          <li>Redacted argument payloads.</li>
        </ul>
      </DocumentSection>

      <DocumentSection id="automatic-info" title="D. Information Collected Automatically">
        <p>We collect basic server diagnostic logs required to maintain platform security and performance:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>IP addresses for rate limiting and threat detection.</li>
          <li>Browser user agent and request timestamp headers.</li>
          <li>HTTP status codes and error tracebacks.</li>
        </ul>
      </DocumentSection>

      <DocumentSection id="redaction" title="E. Sensitive Data Redaction">
        <p>
          The SDK performs recursive key matching on the client side before sending telemetry. Matching secret keys (such as <InlineCode>password</InlineCode>, <InlineCode>apiKey</InlineCode>, <InlineCode>token</InlineCode>, <InlineCode>authorization</InlineCode>) are replaced with <InlineCode>[REDACTED]</InlineCode>.
        </p>
      </DocumentSection>

      <DocumentSection id="how-used" title="F. How Information Is Used">
        <ul className="list-disc pl-5 space-y-1">
          <li>To display live execution timelines in your project dashboard.</li>
          <li>To route human approval requests and dispatch control commands.</li>
          <li>To enforce project access controls and API key rate limits.</li>
          <li>To preserve immutable audit logs of project actions.</li>
        </ul>
      </DocumentSection>

      <DocumentSection id="legal-bases" title="G. Legal Bases">
        <p>
          Processing is based on contract performance (delivering supervision services), legitimate interests (securing platform infrastructure), and compliance with legal obligations.
        </p>
      </DocumentSection>

      <DocumentSection id="data-sharing" title="H. Data Sharing & Subprocessors">
        <p>
          We do not sell personal data. Data is processed through verified cloud database and hosting infrastructure required to operate the service.
        </p>
      </DocumentSection>

      <DocumentSection id="retention" title="I. Data Retention">
        <p>{LEGAL_CONFIG.DEFAULT_RETENTION_DESCRIPTION}</p>
      </DocumentSection>

      <DocumentSection id="security" title="J. Security Safeguards">
        <p>
          We protect data using TLS/HTTPS transport encryption, bcrypt password hashing, SHA-256 API key hashing, multi-tenant database boundary isolation, and client-side secret redaction.
        </p>
      </DocumentSection>

      <DocumentSection id="user-rights" title="K. User Choices and Rights">
        <p>
          You may view, update, or revoke API keys and project settings at any time in the dashboard. For data access or deletion requests, contact <a href={`mailto:${LEGAL_CONFIG.PRIVACY_EMAIL}`} className="text-blue-600 underline">{LEGAL_CONFIG.PRIVACY_EMAIL}</a>.
        </p>
      </DocumentSection>

      <DocumentSection id="international" title="L. International Processing">
        <p>
          Data is processed and stored in verified cloud server regions bound by standard data protection agreements.
        </p>
      </DocumentSection>

      <DocumentSection id="children" title="M. Children's Privacy">
        <p>
          Steward is intended strictly for developer and business software operations. We do not knowingly collect personal data from individuals under {LEGAL_CONFIG.MINIMUM_USER_AGE} years of age.
        </p>
      </DocumentSection>

      <DocumentSection id="changes" title="N. Policy Changes">
        <p>
          Material updates to this policy will be communicated via notice on our website or direct project email notification.
        </p>
      </DocumentSection>

      <DocumentSection id="contact" title="O. Contact Information">
        <p>
          For privacy questions or data requests, contact our team at <a href={`mailto:${LEGAL_CONFIG.PRIVACY_EMAIL}`} className="text-blue-600 underline">{LEGAL_CONFIG.PRIVACY_EMAIL}</a>.
        </p>
      </DocumentSection>
    </PublicDocumentLayout>
  );
}
