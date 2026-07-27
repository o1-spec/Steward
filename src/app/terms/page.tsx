import React from "react";
import Link from "next/link";
import {
  PublicDocumentLayout,
  DocumentSection,
  DocumentCallout,
  InlineCode,
  DocTocItem,
} from "@/components/docs/DocumentComponents";
import { LEGAL_CONFIG } from "@/lib/legal-config";

export const metadata = {
  title: "Terms of Service — Steward",
  description: "Terms of Service and Acceptable Use Policy for Steward.",
};

const TOC: DocTocItem[] = [
  { id: "agreement", title: "A. Agreement to Terms" },
  { id: "eligibility", title: "B. Account Eligibility" },
  { id: "accounts", title: "C. Accounts & Security" },
  { id: "keys", title: "D. Projects & API Keys" },
  { id: "description", title: "E. Service Description" },
  { id: "acceptable-use", title: "F. Acceptable Use Policy" },
  { id: "responsibilities", title: "G. Customer Responsibilities" },
  { id: "approvals-controls", title: "H. Approvals & Cooperative Controls" },
  { id: "availability", title: "I. Service Availability" },
  { id: "beta-status", title: "J. V1 Beta Status" },
  { id: "fees", title: "K. Pricing & Fees" },
  { id: "intellectual-property", title: "L. Intellectual Property & Data Rights" },
  { id: "privacy", title: "M. Privacy & Telemetry" },
  { id: "third-party", title: "N. Third-Party Services" },
  { id: "termination", title: "O. Suspension & Termination" },
  { id: "disclaimers", title: "P. Disclaimers" },
  { id: "liability", title: "Q. Limitation of Liability" },
  { id: "indemnity", title: "R. Indemnification" },
  { id: "disputes", title: "S. Governing Law & Disputes" },
  { id: "changes", title: "T. Changes to Terms" },
  { id: "contact", title: "U. Contact Information" },
];

export default function TermsPage() {
  return (
    <PublicDocumentLayout
      title="Terms of Service"
      subtitle="Rules, policies, and responsibilities governing your use of Steward agent supervision services."
      lastUpdated={LEGAL_CONFIG.LAST_UPDATED_DATE}
      toc={TOC}
      activePath="/terms"
      prevLink={{ title: "Privacy Policy", href: "/privacy" }}
      nextLink={{ title: "Documentation", href: "/docs" }}
    >
      <DocumentCallout type="note" title="Review Draft Notice">
        This document is an accurate product draft describing Steward V1 operational terms. It requires formal legal sign-off prior to commercial release.
      </DocumentCallout>

      <DocumentSection id="agreement" title="A. Agreement to Terms">
        <p>
          By creating an account, generating an API key, or integrating <InlineCode>@steward/sdk</InlineCode>, you agree to be bound by these Terms of Service.
        </p>
      </DocumentSection>

      <DocumentSection id="eligibility" title="B. Account Eligibility">
        <p>
          You must be at least {LEGAL_CONFIG.MINIMUM_USER_AGE} years of age and authorized to form a binding contract to create an account.
        </p>
      </DocumentSection>

      <DocumentSection id="accounts" title="C. Accounts & Security">
        <p>
          You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your project accounts.
        </p>
      </DocumentSection>

      <DocumentSection id="keys" title="D. Projects & API Keys">
        <p>
          Project API keys grant connected agents access to stream telemetry to your project timeline. You must not embed secret API keys in public browser code. Keys may be revoked immediately in Project Settings.
        </p>
      </DocumentSection>

      <DocumentSection id="description" title="E. Service Description">
        <p>
          Steward provides live execution visibility, human approval gates, cooperative control signals (<InlineCode>PAUSE</InlineCode>, <InlineCode>RESUME</InlineCode>, <InlineCode>CANCEL</InlineCode>), and audit logging for connected agents. Steward does not operate or host your connected agent code.
        </p>
      </DocumentSection>

      <DocumentSection id="acceptable-use" title="F. Acceptable Use Policy">
        <p>You agree not to:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Transmit malicious code, malware, or illegal telemetry payloads.</li>
          <li>Attempt unauthorized access to project telemetry belonging to other accounts.</li>
          <li>Bypass rate limits or multi-tenant database isolation boundaries.</li>
        </ul>
      </DocumentSection>

      <DocumentSection id="responsibilities" title="G. Customer Responsibilities">
        <p>
          You are solely responsible for your agent&apos;s behavior, tool execution callbacks, and compliance with external API provider terms.
        </p>
      </DocumentSection>

      <DocumentSection id="approvals-controls" title="H. Approvals & Cooperative Controls">
        <p>
          Human approval recorded in Steward authorizes your connected agent to proceed with a callback execution. Pause, resume, and cancel signals operate cooperatively through connected SDK checkpoint polling.
        </p>
      </DocumentSection>

      <DocumentSection id="availability" title="I. Service Availability">
        <p>
          While Steward strives for continuous ingestion availability, service is provided on an &quot;AS IS&quot; basis without uptime guarantees unless explicitly covered under an enterprise SLA agreement.
        </p>
      </DocumentSection>

      <DocumentSection id="beta-status" title="J. V1 Beta Status">
        <p>
          Steward V1 features are subject to ongoing refinement. High-impact agent pipelines should maintain independent application-level safeguards.
        </p>
      </DocumentSection>

      <DocumentSection id="fees" title="K. Pricing & Fees">
        <p>
          Current V1 development features are provided under standard account tier limits. Any future paid features will be disclosed prior to fee assessment.
        </p>
      </DocumentSection>

      <DocumentSection id="intellectual-property" title="L. Intellectual Property & Data Rights">
        <p>
          Steward retains all rights to the platform software and branding. Customers retain full ownership of their agent code, telemetry data, and agent outputs.
        </p>
      </DocumentSection>

      <DocumentSection id="privacy" title="M. Privacy & Telemetry">
        <p>
          Telemetry collection and secret redaction are governed by our <Link href="/privacy" className="text-blue-600 underline">Privacy Policy</Link>.
        </p>
      </DocumentSection>

      <DocumentSection id="third-party" title="N. Third-Party Services">
        <p>
          Interactions between your agents and third-party APIs (such as LLM providers or cloud services) remain governed by separate third-party agreements.
        </p>
      </DocumentSection>

      <DocumentSection id="termination" title="O. Suspension & Termination">
        <p>
          We reserve the right to suspend API key access or accounts in the event of security compromise, illegal activity, or material breach of these terms.
        </p>
      </DocumentSection>

      <DocumentSection id="disclaimers" title="P. Disclaimers">
        <p>
          STEWARD IS PROVIDED &quot;AS IS&quot; WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED.
        </p>
      </DocumentSection>

      <DocumentSection id="liability" title="Q. Limitation of Liability">
        <p>
          TO THE MAXIMUM EXTENT PERMITTED BY LAW, STEWARD SHALL NOT BE LIABLE FOR INDIRECT, INCIDENTAL, OR CONSEQUENTIAL DAMAGES ARISING FROM AGENT EXECUTION OR CONTROL DELAYS.
        </p>
      </DocumentSection>

      <DocumentSection id="indemnity" title="R. Indemnification">
        <p>
          You agree to hold harmless Steward against claims arising from your agent&apos;s actions or violation of third-party API policies.
        </p>
      </DocumentSection>

      <DocumentSection id="disputes" title="S. Governing Law & Disputes">
        <p>
          These terms are governed by the laws of {LEGAL_CONFIG.GOVERNING_JURISDICTION}.
        </p>
      </DocumentSection>

      <DocumentSection id="changes" title="T. Changes to Terms">
        <p>
          We will notify users of material changes to these terms by updating the effective date and displaying a notice in the dashboard.
        </p>
      </DocumentSection>

      <DocumentSection id="contact" title="U. Contact Information">
        <p>
          For legal inquiries, contact <a href={`mailto:${LEGAL_CONFIG.LEGAL_EMAIL}`} className="text-blue-600 underline">{LEGAL_CONFIG.LEGAL_EMAIL}</a>.
        </p>
      </DocumentSection>
    </PublicDocumentLayout>
  );
}
