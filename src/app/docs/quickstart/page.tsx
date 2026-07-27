import React from "react";
import Link from "next/link";
import { DocumentSection, CodeBlock, InlineCode } from "@/components/docs/DocumentComponents";

export const metadata = {
  title: "Quickstart — Steward Docs",
  description: "Set up @steward/sdk, configure environment variables, and stream your first agent run in 5 minutes.",
};

export default function QuickstartPage() {
  return (
    <div className="space-y-8">
      <div className="border-b border-stone-200 pb-6 space-y-2">
        <div className="text-xs font-mono text-stone-500">GETTING STARTED</div>
        <h1 className="text-2xl sm:text-3xl font-serif font-bold text-stone-900">
          Node.js Agent Quickstart
        </h1>
        <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
          Connect a Node.js agent pipeline to Steward, stream lifecycle events, and inspect execution live in your project dashboard.
        </p>
      </div>

      <DocumentSection id="step-1" title="1. Create an Account">
        <p>
          Register an account at <Link href="/register" className="text-blue-600 underline">/register</Link> and sign in.
        </p>
      </DocumentSection>

      <DocumentSection id="step-2" title="2. Create a Project">
        <p>
          Follow the onboarding flow at <Link href="/onboarding" className="text-blue-600 underline">/onboarding</Link> to create your first Steward project workspace.
        </p>
      </DocumentSection>

      <DocumentSection id="step-3" title="3. Generate an API Key">
        <p>
          Go to <strong>Project Settings → API Keys</strong> and generate a secret project API key.
        </p>
        <p className="text-xs text-stone-500 italic">
          Copy the full key immediately. Steward stores only a SHA-256 hash of your key for security.
        </p>
      </DocumentSection>

      <DocumentSection id="step-4" title="4. Install the SDK">
        <p>Install the official TypeScript SDK package from npm in your agent codebase:</p>
        <CodeBlock code="npm install @steward/sdk" language="bash" title="Terminal" />
      </DocumentSection>

      <DocumentSection id="step-5" title="5. Configure Environment Variables">
        <p>Add environment variables to your local <InlineCode>.env</InlineCode> file:</p>
        <CodeBlock
          code={`STEWARD_API_URL=https://your-steward-instance.example
STEWARD_API_KEY=stwd_live_your_api_key`}
          language="env"
          title=".env"
        />
      </DocumentSection>

      <DocumentSection id="step-6" title="6. Start a Run in Your Agent">
        <p>Initialize the Steward client and emit lifecycle events:</p>
        <CodeBlock
          code={`import { Steward } from "@steward/sdk";

const steward = new Steward({
  apiKey: process.env.STEWARD_API_KEY!,
  agentName: "deployment-agent",
  baseUrl: process.env.STEWARD_API_URL || "http://localhost:3000",
});

const run = steward.startRun();
await run.started({ task: "Deploy production container update" });

await run.modelCall({
  model: "gemini-2.5-flash",
  provider: "google",
  prompt: "Verify cluster status",
  fn: async () => ({ text: "Cluster healthy" }),
});

await run.completed({ result: "Deployment completed cleanly" });`}
          language="ts"
          title="agent.ts"
        />
      </DocumentSection>

      <DocumentSection id="step-7" title="7. Inspect Run in Dashboard">
        <p>
          Open <Link href="/runs" className="text-blue-600 underline font-bold">/runs</Link> in the Steward dashboard to observe live event streaming over Server-Sent Events (SSE).
        </p>
      </DocumentSection>

      {/* Pagination Nav */}
      <div className="pt-6 border-t border-stone-200 flex justify-between gap-4 text-xs font-medium">
        <Link
          href="/docs"
          className="p-3 rounded-xl border border-stone-200 bg-white hover:bg-stone-50 text-stone-700 transition-colors"
        >
          ← Introduction
        </Link>
        <Link
          href="/docs/events"
          className="p-3 rounded-xl border border-stone-200 bg-white hover:bg-stone-50 text-stone-700 transition-colors text-right"
        >
          Event Protocol →
        </Link>
      </div>
    </div>
  );
}
