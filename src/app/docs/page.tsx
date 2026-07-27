import React from "react";
import Link from "next/link";
import { StewardLogo } from "@/components/StewardLogo";
import { PageContainer, Section, SectionHeader } from "@/components/ui/Layout";
import { DragScroll } from "@/components/ui/DragScroll";

export const metadata = {
  title: "Documentation — Steward SDK & Telemetry API",
  description: "Official guide for integrating @steward/sdk, setting up human approval gates, and streaming telemetry.",
};

export default function DocsPage() {
  return (
    <div className="min-h-screen bg-stone-warm text-stone-900 flex flex-col font-sans">
      <header className="sticky top-0 z-40 bg-stone-warm/90 backdrop-blur-md border-b border-stone-200/80">
        <PageContainer>
          <div className="h-14 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <StewardLogo size="md" variant="dark" />
            </Link>
            <div className="flex items-center gap-4 text-xs font-medium">
              <Link href="/runs" className="text-blue-600 hover:text-blue-700">
                Dashboard →
              </Link>
              <Link
                href="/"
                className="text-stone-600 hover:text-stone-900 transition-colors"
              >
                ← Back to Steward
              </Link>
            </div>
          </div>
        </PageContainer>
      </header>

      <main className="flex-1">
        <Section bg="warm">
          <PageContainer>
            <SectionHeader
              title="Steward SDK Documentation"
              subtitle="Learn how to connect Node.js agents, emit structured telemetry events, hold sensitive tool calls for human approval, and respond to cooperative control commands."
              centered={false}
            />

            <div className="max-w-4xl space-y-10 text-xs sm:text-sm text-stone-800">
              {/* Section 1: Installation & Setup */}
              <div className="space-y-4 bg-white p-6 sm:p-8 rounded-xl border border-stone-200 shadow-2xs">
                <h2 className="text-lg font-bold text-stone-900 font-serif">1. Installation & Initialization</h2>
                <p className="text-stone-600 leading-relaxed">
                  Install the official TypeScript SDK package from npm:
                </p>
                <div className="bg-stone-950 text-stone-200 p-3 rounded-lg font-mono text-xs">
                  npm install @steward/sdk
                </div>

                <p className="text-stone-600 leading-relaxed pt-2">
                  Initialize the client with your project API key generated in the Steward dashboard:
                </p>
                <DragScroll className="bg-stone-950 text-stone-200 p-4 rounded-lg font-mono text-xs">
                  <pre className="text-stone-300">
                    {`import { Steward } from "@steward/sdk";

const steward = new Steward({
  apiKey: process.env.STEWARD_API_KEY!,
  agentName: "deployment-agent",
  baseUrl: process.env.STEWARD_API_URL || "http://localhost:3000",
});`}
                  </pre>
                </DragScroll>
              </div>

              {/* Section 2: Human Approval Gates */}
              <div className="space-y-4 bg-white p-6 sm:p-8 rounded-xl border border-stone-200 shadow-2xs">
                <h2 className="text-lg font-bold text-stone-900 font-serif">2. Human Approval Gates</h2>
                <p className="text-stone-600 leading-relaxed">
                  Guard sensitive tool callbacks so execution pauses until an operator explicitly approves or rejects the action:
                </p>
                <DragScroll className="bg-stone-950 text-stone-200 p-4 rounded-lg font-mono text-xs">
                  <pre className="text-amber-300">
                    {`const run = steward.startRun();
await run.started({ task: "Clean production S3 buckets" });

// Execution holds until approved in Steward dashboard
await run.requestApproval({
  toolName: "aws.s3.delete_bucket",
  arguments: { bucketName: "prod-backups-2026", accessKey: "secret_123" },
  riskLevel: "HIGH",
  reason: "Remove expired staging backups",
});`}
                  </pre>
                </DragScroll>
              </div>

              {/* Section 3: Cooperative Commands */}
              <div className="space-y-4 bg-white p-6 sm:p-8 rounded-xl border border-stone-200 shadow-2xs">
                <h2 className="text-lg font-bold text-stone-900 font-serif">3. Cooperative Pause / Resume / Cancel</h2>
                <p className="text-stone-600 leading-relaxed">
                  Start a background command listener to handle operator interventions issued from the Steward dashboard:
                </p>
                <DragScroll className="bg-stone-950 text-stone-200 p-4 rounded-lg font-mono text-xs">
                  <pre className="text-blue-300">
                    {`run.startCommandListener({
  onPause: async (cmd) => console.log("Run paused:", cmd.reason),
  onResume: async (cmd) => console.log("Run resumed:", cmd.reason),
  onCancel: async (cmd) => console.log("Run cancelled:", cmd.reason),
});

// Periodically check for pending control signals in execution loops
await run.checkpoint();`}
                  </pre>
                </DragScroll>
              </div>
            </div>
          </PageContainer>
        </Section>
      </main>

      <footer className="bg-stone-950 text-stone-400 text-xs border-t border-stone-800 py-6">
        <PageContainer>
          <div className="flex justify-between items-center">
            <span>© 2026 Steward. All rights reserved.</span>
            <div className="flex gap-4">
              <Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
              <Link href="/terms" className="hover:text-white transition-colors">Terms of Service</Link>
            </div>
          </div>
        </PageContainer>
      </footer>
    </div>
  );
}
