import React from "react";
import Link from "next/link";
import { StewardLogo } from "@/components/StewardLogo";
import { PageContainer, Section, SectionHeader } from "@/components/ui/Layout";

export const metadata = {
  title: "Terms of Service — Steward",
  description: "Terms of Service and Acceptable Use Policy for Steward.",
};

export default function TermsPage() {
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
              title="Terms of Service"
              subtitle="Rules and policies governing your use of Steward autonomous agent supervision services."
              centered={false}
            />

            <div className="max-w-3xl space-y-8 text-xs sm:text-sm text-stone-700 leading-relaxed">
              <div className="space-y-3 bg-white p-6 rounded-xl border border-stone-200">
                <h3 className="text-base font-semibold text-stone-900">1. Acceptance of Terms</h3>
                <p>
                  By creating an account, generating an API key, or connecting an agent using <code className="bg-stone-100 px-1 py-0.5 rounded text-stone-900 font-mono text-xs">@steward/sdk</code>, you agree to these Terms of Service.
                </p>
              </div>

              <div className="space-y-3 bg-white p-6 rounded-xl border border-stone-200">
                <h3 className="text-base font-semibold text-stone-900">2. Cooperative Control Responsibility</h3>
                <p>
                  Steward provides human approval gates and control signals (`PAUSE`, `RESUME`, `CANCEL`). Connected agents remain executed in your own infrastructure environment. You are responsible for ensuring your agent code respects control command polling loops.
                </p>
              </div>

              <div className="space-y-3 bg-white p-6 rounded-xl border border-stone-200">
                <h3 className="text-base font-semibold text-stone-900">3. Acceptable Use</h3>
                <p>
                  You agree not to use Steward to transmit illegal payloads, bypass security controls, or attempt unauthorized access to project telemetry belonging to other accounts.
                </p>
              </div>

              <div className="space-y-3 bg-white p-6 rounded-xl border border-stone-200">
                <h3 className="text-base font-semibold text-stone-900">4. Service Availability</h3>
                <p>
                  Steward strives for high availability on ingestion endpoints and SSE event streams. Ingestion APIs are rate-limited to ensure platform stability.
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
            <Link href="/privacy" className="hover:text-white transition-colors">
              Privacy Policy
            </Link>
          </div>
        </PageContainer>
      </footer>
    </div>
  );
}
