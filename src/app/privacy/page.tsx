import React from "react";
import Link from "next/link";
import { StewardLogo } from "@/components/StewardLogo";
import { PageContainer, Section, SectionHeader } from "@/components/ui/Layout";

export const metadata = {
  title: "Privacy Policy — Steward",
  description: "Steward data boundary, telemetry redaction, and privacy policy.",
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-stone-warm text-stone-900 flex flex-col font-sans">
      <header className="sticky top-0 z-40 bg-stone-warm/90 backdrop-blur-md border-b border-stone-200/80">
        <PageContainer>
          <div className="h-14 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <StewardLogo size="md" variant="dark" />
            </Link>
            <Link
              href="/"
              className="text-xs font-medium text-stone-600 hover:text-stone-900 transition-colors"
            >
              ← Back to Steward
            </Link>
          </div>
        </PageContainer>
      </header>

      <main className="flex-1">
        <Section bg="warm">
          <PageContainer>
            <SectionHeader
              title="Privacy Policy"
              subtitle="How Steward handles telemetry, secret redaction, and data retention."
              centered={false}
            />

            <div className="max-w-3xl space-y-8 text-xs sm:text-sm text-stone-700 leading-relaxed">
              <div className="space-y-3 bg-white p-6 rounded-xl border border-stone-200">
                <h3 className="text-base font-semibold text-stone-900">1. Data Boundaries</h3>
                <p>
                  Steward is a supervision and telemetry workspace for autonomous agents. We do not host your agent code, execute tools on your servers, or inspect private model chain-of-thought unless explicitly transmitted in standard lifecycle event envelopes.
                </p>
              </div>

              <div className="space-y-3 bg-white p-6 rounded-xl border border-stone-200">
                <h3 className="text-base font-semibold text-stone-900">2. Automatic Telemetry Redaction</h3>
                <p>
                  The official <code className="bg-stone-100 px-1 py-0.5 rounded text-stone-900 font-mono text-xs">@steward/sdk</code> automatically redacts sensitive fields (such as passwords, API keys, bearer tokens, and session cookies) before transmitting event payloads to our ingestion API. Redacted fields are stored as <code className="bg-stone-100 px-1 py-0.5 rounded text-stone-900 font-mono text-xs">[REDACTED]</code>.
                </p>
              </div>

              <div className="space-y-3 bg-white p-6 rounded-xl border border-stone-200">
                <h3 className="text-base font-semibold text-stone-900">3. Authentication & API Key Hashing</h3>
                <p>
                  Project API keys generated in Steward are presented to developers exactly once. We store only SHA-256 hashes of your API keys. User account passwords are hashed using bcrypt.
                </p>
              </div>

              <div className="space-y-3 bg-white p-6 rounded-xl border border-stone-200">
                <h3 className="text-base font-semibold text-stone-900">4. Audit Logs & Data Retention</h3>
                <p>
                  Human decisions (approvals, rejections), key generation events, and cooperative control commands are recorded in an append-only audit log bound to your project. Audit logs are preserved according to your workspace plan.
                </p>
              </div>
            </div>
          </PageContainer>
        </Section>
      </main>

      <footer className="bg-stone-950 text-stone-400 text-xs border-t border-stone-800 py-6">
        <PageContainer>
          <div className="flex justify-between items-center">
            <span>© 2026 Steward. All rights reserved.</span>
            <Link href="/terms" className="hover:text-white transition-colors">
              Terms of Service
            </Link>
          </div>
        </PageContainer>
      </footer>
    </div>
  );
}
