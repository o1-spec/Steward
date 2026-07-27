# Steward Legal & Commercial Release Review Checklist

> **IMPORTANT**: The public documentation, Privacy Policy (`/privacy`), and Terms of Service (`/terms`) rendered in this project are product implementation drafts. They require review and sign-off by qualified legal counsel before public commercial launch.

---

## 1. Corporate & Contact Identifiers
- [ ] **Legal Entity Name**: Confirm legal entity name (currently `[Legal Entity Name Pending]`).
- [ ] **Business Address**: Specify physical corporate/business address (currently `[Business Address Pending]`).
- [ ] **Contact Email Addresses**: Verify operational mailboxes for `support@steward.dev`, `privacy@steward.dev`, and `legal@steward.dev`.
- [ ] **Governing Jurisdiction**: Select governing state/country and dispute resolution location (currently `[Jurisdiction Pending]`).

---

## 2. Privacy & Telemetry Decisions
- [ ] **Personal Data Determination**: Confirm whether customer-submitted telemetry payloads containing IPs or agent identifiers qualify as Personal Data under GDPR / CCPA.
- [ ] **Minimum User Age**: Verify age eligibility requirement (currently defaulted to 18+ for business development accounts).
- [ ] **Data Retention Schedule**: Establish exact retention windows for account records, event telemetry, audit logs, and database backups (currently 30 days default telemetry retention).
- [ ] **Data Subprocessors**: Disclose production database, hosting, authentication, and error monitoring providers once deployed.
- [ ] **Manual Data Deletion Procedure**: Formalize process for processing customer data deletion / export requests submitted via `privacy@steward.dev`.

---

## 3. Terms of Service & Liability
- [ ] **Liability Cap**: Define liability cap (e.g. total fees paid in preceding 12 months or fixed amount).
- [ ] **Cooperative Control Disclaimer**: Validate legal disclaimer clarifying that Steward provides cooperative control signals and cannot forcibly terminate external customer-hosted OS processes.
- [ ] **Indemnification Scope**: Review mutual indemnification clauses for customer agent output responsibility vs service availability.
- [ ] **Beta / Preview Designation**: Confirm V1 beta status disclaimer while product features evolve.
