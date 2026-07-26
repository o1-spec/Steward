"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { StewardLogo } from "@/components/StewardLogo";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";

export default function LandingPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeTab, setActiveTab] = useState<"timeline" | "approval" | "sdk">("timeline");
  const [interactiveDecision, setInteractiveDecision] = useState<"pending" | "approved" | "rejected">("pending");

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => {
        if (res.ok) setIsAuthenticated(true);
      })
      .catch(() => { });
  }, []);

  return (
    <div className="min-h-screen bg-stone-warm text-stone-900 flex flex-col font-sans selection:bg-blue-100 selection:text-blue-900">
      {/* 1. Header / Navigation */}
      <header className="sticky top-0 z-40 bg-[#FAF8F5]/90 backdrop-blur-md border-b border-stone-200/80 transition-colors">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            <StewardLogo size="md" variant="dark" />
            <span className="text-xs uppercase font-mono px-1.5 py-0.5 rounded bg-stone-200/60 text-stone-600 font-medium">
              V1
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-stone-600">
            <a href="#workflow" className="hover:text-stone-900 transition-colors">
              How it works
            </a>
            <a href="#product-preview" className="hover:text-stone-900 transition-colors">
              Product
            </a>
            <a href="#security" className="hover:text-stone-900 transition-colors">
              Security
            </a>
            <a href="#integration" className="hover:text-stone-900 transition-colors">
              SDK Integration
            </a>
          </nav>

          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <Link href="/runs">
                <Button variant="primary" size="sm">
                  Dashboard →
                </Button>
              </Link>
            ) : (
              <>
                <Link href="/login" className="text-sm font-medium text-stone-700 hover:text-stone-900 px-3 py-1.5 transition-colors">
                  Sign in
                </Link>
                <Link href="/register">
                  <Button variant="primary" size="sm">
                    Connect an agent
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* 2. Hero Section */}
      <section className="relative pt-16 pb-20 md:pt-24 md:pb-28 overflow-hidden bg-grid-pattern">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-stone-100 border border-stone-200/80 text-xs font-medium text-stone-700">
              <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse-subtle" />
              <span>Human supervision workspace for autonomous AI agents</span>
            </div>

            <h1 className="font-serif text-4xl sm:text-5xl md:text-6xl tracking-tight text-stone-900 leading-[1.15]">
              See what your agents are doing. <br />
              <span className="italic font-normal text-stone-800">Control what they’re allowed to do.</span>
            </h1>

            <p className="text-base sm:text-lg md:text-xl text-stone-600 max-w-2xl mx-auto leading-relaxed">
              Steward gives engineering teams a live record of agent activity, human approval gates for sensitive actions, and cooperative controls for pausing or cancelling execution.
            </p>

            <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link href={isAuthenticated ? "/runs" : "/register"} className="w-full sm:w-auto">
                <Button variant="primary" size="lg" className="w-full">
                  Connect an agent →
                </Button>
              </Link>
              <a href="#workflow" className="w-full sm:w-auto">
                <Button variant="outline" size="lg" className="w-full">
                  See how it works
                </Button>
              </a>
            </div>
          </div>

          {/* Hero Visual: Realistic Interactive Product Preview */}
          <div className="mt-12 md:mt-16 max-w-5xl mx-auto rounded-xl border border-stone-300/80 bg-white shadow-xl overflow-hidden text-left">
            {/* Window Chrome Header */}
            <div className="bg-stone-100 border-b border-stone-200 px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-stone-300 inline-block" />
                <span className="w-3 h-3 rounded-full bg-stone-300 inline-block" />
                <span className="w-3 h-3 rounded-full bg-stone-300 inline-block" />
                <span className="ml-2 font-mono text-xs text-stone-600 font-medium">steward // run_prod_deploy_4802</span>
              </div>
              <div className="flex items-center gap-3">
                <Badge variant="running">RUNNING</Badge>
                <span className="text-xs text-stone-500 font-mono">Agent: deployment-worker-01</span>
              </div>
            </div>

            {/* Product Interface Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-stone-200">
              {/* Left Column: Timeline Overview */}
              <div className="lg:col-span-7 p-5 sm:p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-stone-600">
                    Live Execution Telemetry
                  </h3>
                  <span className="text-xs font-mono text-stone-600">4 events • 1.2s total</span>
                </div>

                <div className="space-y-3">
                  {/* Event 1 */}
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-stone-50 border border-stone-200/80">
                    <div className="w-6 h-6 rounded bg-blue-100 text-blue-700 flex items-center justify-center font-mono text-xs font-bold shrink-0">
                      01
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-mono font-semibold text-stone-900">run.started</span>
                        <span className="text-[10px] text-stone-600 font-mono">12:04:01</span>
                      </div>
                      <p className="text-xs text-stone-600 truncate mt-0.5">
                        Task: &quot;Deploy auth microservice container to production cluster&quot;
                      </p>
                    </div>
                  </div>

                  {/* Event 2 */}
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-stone-50 border border-stone-200/80">
                    <div className="w-6 h-6 rounded bg-purple-100 text-purple-700 flex items-center justify-center font-mono text-xs font-bold shrink-0">
                      02
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-mono font-semibold text-stone-900">model.completed</span>
                        <span className="text-[10px] text-stone-600 font-mono">gemini-2.5-flash • $0.001</span>
                      </div>
                      <p className="text-xs text-stone-600 mt-0.5">
                        Decision: Evaluated deployment safety check. Generated payload for tool invocation.
                      </p>
                    </div>
                  </div>

                  {/* Event 3: Pending Approval */}
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-amber-50/80 border border-amber-200">
                    <div className="w-6 h-6 rounded bg-amber-200 text-amber-900 flex items-center justify-center font-mono text-xs font-bold shrink-0">
                      !
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-mono font-semibold text-amber-950">approval.requested</span>
                        <Badge variant="high">HIGH RISK</Badge>
                      </div>
                      <p className="text-xs text-amber-900 font-medium mt-0.5">
                        Tool: <code className="bg-amber-100 px-1 py-0.5 rounded text-amber-950">deploy.prod</code>
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: Approval Gate Action Widget */}
              <div className="lg:col-span-5 p-5 sm:p-6 bg-stone-50/50 flex flex-col justify-between space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between border-b border-stone-200 pb-2">
                    <span className="text-xs font-semibold uppercase tracking-wider text-stone-600">
                      Human Approval Gate
                    </span>
                    <Badge variant="waiting">PENDING</Badge>
                  </div>

                  <div className="bg-white p-3.5 rounded-lg border border-stone-200 space-y-2 font-mono text-xs">
                    <div className="flex justify-between text-stone-600">
                      <span>Tool:</span>
                      <span className="font-semibold text-stone-900">deploy.prod</span>
                    </div>
                    <div className="flex justify-between text-stone-600">
                      <span>Target:</span>
                      <span className="text-stone-900">auth-service-v2.1.0</span>
                    </div>
                    <div className="border-t border-stone-100 pt-2 text-stone-600">
                      <div className="mb-1 text-[11px] text-stone-600">Redacted Arguments:</div>
                      <pre className="bg-stone-950 text-stone-200 p-2 rounded text-[11px] overflow-x-auto">
                        {`{
  "service": "auth-api",
  "apiKey": "[REDACTED]"
}`}
                      </pre>
                    </div>
                  </div>
                </div>

                {/* Interactive Demo Buttons */}
                <div className="pt-2 border-t border-stone-200">
                  {interactiveDecision === "pending" ? (
                    <div className="flex gap-2">
                      <Button
                        variant="destructive"
                        size="sm"
                        className="flex-1"
                        onClick={() => setInteractiveDecision("rejected")}
                      >
                        Reject Execution
                      </Button>
                      <Button
                        variant="success"
                        size="sm"
                        className="flex-1"
                        onClick={() => setInteractiveDecision("approved")}
                      >
                        Approve Action
                      </Button>
                    </div>
                  ) : interactiveDecision === "approved" ? (
                    <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-3 rounded-lg text-xs font-medium flex items-center justify-between">
                      <span>✓ Approved by Operator (Demo)</span>
                      <button
                        onClick={() => setInteractiveDecision("pending")}
                        className="text-[11px] underline text-emerald-900 hover:text-emerald-950"
                      >
                        Reset
                      </button>
                    </div>
                  ) : (
                    <div className="bg-rose-50 border border-rose-200 text-rose-800 p-3 rounded-lg text-xs font-medium flex items-center justify-between">
                      <span>✕ Rejected by Operator (Demo)</span>
                      <button
                        onClick={() => setInteractiveDecision("pending")}
                        className="text-[11px] underline text-rose-900 hover:text-rose-950"
                      >
                        Reset
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="bg-stone-100/80 px-4 py-2 border-t border-stone-200 text-[11px] text-stone-600 flex items-center justify-between">
              <span>Illustrative product preview. Real agent execution runs locally or in your cloud environment.</span>
              <span className="font-mono">Steward V1 Runtime</span>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Product Workflow Section (Requirement 5) */}
      <section id="workflow" className="py-20 md:py-24 bg-white border-y border-stone-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <h2 className="font-serif text-3xl sm:text-4xl text-stone-900">
              How Steward works
            </h2>
            <p className="text-stone-600 text-base">
              Four deliberate steps to transform autonomous agent execution from an unmonitored black box into a supervised workflow.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Step 1: Connect */}
            <div className="p-6 rounded-xl bg-[#FAF8F5] border border-stone-200/80 space-y-3">
              <div className="w-8 h-8 rounded-lg bg-stone-900 text-white flex items-center justify-center font-mono text-sm font-bold">
                1
              </div>
              <h3 className="text-lg font-semibold text-stone-900">1. Connect</h3>
              <p className="text-sm text-stone-600 leading-relaxed">
                Add the lightweight <code className="text-xs bg-stone-200/80 px-1 py-0.5 rounded text-stone-800">@steward/sdk</code> package to any existing Node.js or TypeScript agent.
              </p>
            </div>

            {/* Step 2: Observe */}
            <div className="p-6 rounded-xl bg-[#FAF8F5] border border-stone-200/80 space-y-3">
              <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-mono text-sm font-bold">
                2
              </div>
              <h3 className="text-lg font-semibold text-stone-900">2. Observe</h3>
              <p className="text-sm text-stone-600 leading-relaxed">
                Stream model calls, tool executions, failures, duration, and token cost in a real-time chronological timeline.
              </p>
            </div>

            {/* Step 3: Approve */}
            <div className="p-6 rounded-xl bg-[#FAF8F5] border border-stone-200/80 space-y-3">
              <div className="w-8 h-8 rounded-lg bg-amber-600 text-white flex items-center justify-center font-mono text-sm font-bold">
                3
              </div>
              <h3 className="text-lg font-semibold text-stone-900">3. Approve</h3>
              <p className="text-sm text-stone-600 leading-relaxed">
                Set human approval gates on high-risk tools. Execution pauses safely until a human operator approves or rejects.
              </p>
            </div>

            {/* Step 4: Control */}
            <div className="p-6 rounded-xl bg-[#FAF8F5] border border-stone-200/80 space-y-3">
              <div className="w-8 h-8 rounded-lg bg-stone-900 text-white flex items-center justify-center font-mono text-sm font-bold">
                4
              </div>
              <h3 className="text-lg font-semibold text-stone-900">4. Control</h3>
              <p className="text-sm text-stone-600 leading-relaxed">
                Cooperatively pause, resume, or cancel connected agent runs directly from the Steward dashboard shell.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Product Feature Deep-Dive (Requirement 6) */}
      <section id="product-preview" className="py-20 md:py-24 bg-[#FAF8F5]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <h2 className="font-serif text-3xl sm:text-4xl text-stone-900">
              Built for engineering precision
            </h2>
            <p className="text-stone-600 text-base">
              Every detail is designed for operational visibility, auditability, and deterministic human control.
            </p>
          </div>

          <div className="bg-white rounded-xl border border-stone-300/80 p-6 md:p-8 space-y-6 shadow-sm">
            {/* Tab Navigation */}
            <div className="flex border-b border-stone-200 gap-6 text-sm font-medium">
              <button
                onClick={() => setActiveTab("timeline")}
                className={`pb-3 border-b-2 transition-colors ${activeTab === "timeline"
                  ? "border-blue-600 text-blue-600 font-semibold"
                  : "border-transparent text-stone-500 hover:text-stone-900"
                  }`}
              >
                Live Execution Timeline
              </button>
              <button
                onClick={() => setActiveTab("approval")}
                className={`pb-3 border-b-2 transition-colors ${activeTab === "approval"
                  ? "border-blue-600 text-blue-600 font-semibold"
                  : "border-transparent text-stone-500 hover:text-stone-900"
                  }`}
              >
                Human Approval Gates
              </button>
              <button
                onClick={() => setActiveTab("sdk")}
                className={`pb-3 border-b-2 transition-colors ${activeTab === "sdk"
                  ? "border-blue-600 text-blue-600 font-semibold"
                  : "border-transparent text-stone-500 hover:text-stone-900"
                  }`}
              >
                Cooperative Controls & SDK
              </button>
            </div>

            {/* Tab Content 1: Timeline */}
            {activeTab === "timeline" && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                <div className="space-y-4">
                  <h3 className="text-xl font-semibold text-stone-900">
                    Complete chronological history of model and tool actions
                  </h3>
                  <p className="text-sm text-stone-600 leading-relaxed">
                    Track sequence-ordered events emitted by your agent SDK. Observe input token counts, output costs, tool execution latencies, and output payloads without exposing raw secrets.
                  </p>
                  <ul className="space-y-2 text-sm text-stone-700">
                    <li className="flex items-center gap-2">
                      <span className="text-emerald-600 font-bold">✓</span>
                      <span>Automatic recursive redaction of API keys & credentials</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-emerald-600 font-bold">✓</span>
                      <span>Server-Sent Events (SSE) for sub-second timeline streaming</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-emerald-600 font-bold">✓</span>
                      <span>Immutable audit log storage per project</span>
                    </li>
                  </ul>
                </div>
                <div className="bg-stone-950 text-stone-200 p-4 sm:p-6 rounded-lg font-mono text-xs space-y-3 overflow-x-auto shadow-inner">
                  <div className="text-stone-500">// Steward Event Envelope Format</div>
                  <pre className="text-stone-300">
                    {`{
  "specVersion": "1.0",
  "eventId": "evt_98f421a",
  "eventType": "tool.succeeded",
  "occurredAt": "2026-07-27T00:12:04.102Z",
  "agentKey": "research-agent-01",
  "sequence": 4,
  "payload": {
    "toolName": "db.query",
    "durationMs": 142,
    "arguments": {
      "table": "users",
      "authToken": "[REDACTED]"
    }
  }
}`}
                  </pre>
                </div>
              </div>
            )}

            {/* Tab Content 2: Approval Gates */}
            {activeTab === "approval" && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                <div className="space-y-4">
                  <h3 className="text-xl font-semibold text-stone-900">
                    Hold sensitive operations before execution occurs
                  </h3>
                  <p className="text-sm text-stone-600 leading-relaxed">
                    When an agent calls a guarded tool (e.g. database mutations, production deployments, payment transfers), execution pauses in a polling loop until a human operator responds.
                  </p>
                  <div className="p-4 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-900 space-y-1">
                    <span className="font-semibold">Deterministic Policy:</span>
                    <p>Guarded tool callbacks never run unless explicit HTTP approval is recorded with user identity and timestamp.</p>
                  </div>
                </div>
                <div className="border border-stone-200 rounded-lg p-5 bg-stone-50 space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold uppercase tracking-wider text-stone-700">Approval Request #402</span>
                    <Badge variant="high">HIGH RISK</Badge>
                  </div>
                  <div className="space-y-2 text-xs font-mono">
                    <div className="flex justify-between"><span className="text-stone-500">Agent:</span> <span className="text-stone-900">deployment-agent</span></div>
                    <div className="flex justify-between"><span className="text-stone-500">Tool:</span> <span className="text-stone-900 font-bold">aws.s3.delete_bucket</span></div>
                    <div className="flex justify-between"><span className="text-stone-500">Reason:</span> <span className="text-stone-900">Clean old test environment</span></div>
                  </div>
                  <div className="pt-2 flex gap-2">
                    <Button variant="destructive" size="sm" className="w-full">Reject Request</Button>
                    <Button variant="success" size="sm" className="w-full">Approve Request</Button>
                  </div>
                </div>
              </div>
            )}

            {/* Tab Content 3: SDK & Control */}
            {activeTab === "sdk" && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                <div className="space-y-4">
                  <h3 className="text-xl font-semibold text-stone-900">
                    Cooperative pause, resume, and cancel control signals
                  </h3>
                  <p className="text-sm text-stone-600 leading-relaxed">
                    Operators can issue control commands directly from the dashboard. Connected agents poll for pending commands at execution checkpoints and gracefully yield or abort.
                  </p>
                  <ul className="space-y-2 text-sm text-stone-700">
                    <li className="flex items-center gap-2">
                      <span className="text-blue-600 font-bold">▶</span>
                      <span><strong>PAUSE</strong>: Temporarily holds agent at next checkpoint</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-emerald-600 font-bold">▶</span>
                      <span><strong>RESUME</strong>: Releases paused agent back to active execution</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-rose-600 font-bold">■</span>
                      <span><strong>CANCEL</strong>: Safely aborts run with typed StewardRunCancelledError</span>
                    </li>
                  </ul>
                </div>
                <div className="bg-stone-900 text-stone-100 p-5 rounded-lg font-mono text-xs space-y-2">
                  <div className="text-stone-400">// Agent Cooperative Control Listener</div>
                  <pre className="text-blue-300">
                    {`run.startCommandListener({
  onPause: async (cmd) => console.log("Paused:", cmd.reason),
  onResume: async (cmd) => console.log("Resumed:", cmd.reason),
  onCancel: async (cmd) => console.log("Cancelled:", cmd.reason),
});

// Checkpoint holds execution if PAUSED
await run.checkpoint();`}
                  </pre>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* 5. Trust & Security Section (Requirement 7) */}
      <section id="security" className="py-20 md:py-24 bg-white border-t border-stone-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <h2 className="font-serif text-3xl sm:text-4xl text-stone-900">
              Security & Data Boundaries
            </h2>
            <p className="text-stone-600 text-base">
              Accurate, transparent boundaries for engineering leadership.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-6 rounded-xl bg-[#FAF8F5] border border-stone-200 space-y-3">
              <div className="w-8 h-8 rounded bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-sm">
                🔑
              </div>
              <h3 className="text-base font-semibold text-stone-900">SHA-256 API Key Hashing</h3>
              <p className="text-sm text-stone-600 leading-relaxed">
                Complete secret keys are displayed <strong>EXACTLY ONCE</strong> upon generation. Only SHA-256 hashes are stored in the database.
              </p>
            </div>

            <div className="p-6 rounded-xl bg-[#FAF8F5] border border-stone-200 space-y-3">
              <div className="w-8 h-8 rounded bg-amber-100 text-amber-700 flex items-center justify-center font-bold text-sm">
                🛡️
              </div>
              <h3 className="text-base font-semibold text-stone-900">Recursive Payload Redaction</h3>
              <p className="text-sm text-stone-600 leading-relaxed">
                Sensitive keys (passwords, tokens, cookies, secret keys) are recursively scanned and masked with <code className="bg-stone-200 px-1 py-0.5 rounded text-xs">[REDACTED]</code> prior to persistence.
              </p>
            </div>

            <div className="p-6 rounded-xl bg-[#FAF8F5] border border-stone-200 space-y-3">
              <div className="w-8 h-8 rounded bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-sm">
                📋
              </div>
              <h3 className="text-base font-semibold text-stone-900">Audited Human Operations</h3>
              <p className="text-sm text-stone-600 leading-relaxed">
                Every approval decision, project creation, API key revocation, and run control action is stored in an append-only audit log.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 6. SDK Integration Section (Requirement 8) */}
      <section id="integration" className="py-20 md:py-24 bg-[#FAF8F5]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 space-y-10">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <h2 className="font-serif text-3xl sm:text-4xl text-stone-900">
              Simple 5-minute integration
            </h2>
            <p className="text-stone-600 text-base">
              Add Steward telemetry and approval gates to any existing Node.js or TypeScript agent with minimal boilerplate.
            </p>
          </div>

          <div className="max-w-3xl mx-auto rounded-xl bg-stone-950 text-stone-200 p-6 md:p-8 font-mono text-xs sm:text-sm space-y-4 shadow-xl overflow-x-auto border border-stone-800">
            <div className="flex items-center justify-between border-b border-stone-800 pb-3 text-stone-400">
              <span>agent.ts</span>
              <span>npm install @steward/sdk</span>
            </div>
            <pre className="text-stone-300 leading-relaxed">
              {`import { Steward } from "@steward/sdk";

// Initialize Steward SDK with Project API Key
const steward = new Steward({
  apiKey: process.env.STEWARD_API_KEY!,
  baseUrl: "https://your-steward-instance.com",
  agentName: "deployment-agent",
});

const run = steward.startRun();
await run.started({ task: "Deploy production release" });

const agent = run.agent({ name: "guarded-worker" });

// Guarded tool call held for human approval
const result = await agent.guardedToolCall(
  {
    toolName: "deploy.prod",
    arguments: { service: "auth-api", tag: "v2.1.0" },
    reason: "Deploy container tag to production cluster",
    riskLevel: "high",
  },
  async () => {
    // Only executes AFTER human approval!
    return await executeDeploy();
  }
);

await run.completed({ status: "success" });`}
            </pre>
          </div>

          <div className="text-center">
            <Link href={isAuthenticated ? "/runs" : "/register"}>
              <Button variant="primary" size="md">
                Get started with @steward/sdk →
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* 7. Final CTA & Footer (Requirement 9) */}
      <section className="py-20 bg-stone-900 text-white">
        <div className="max-w-4xl mx-auto px-4 text-center space-y-6">
          <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl text-white">
            Put a human checkpoint between intention and action.
          </h2>
          <p className="text-stone-300 text-base max-w-xl mx-auto">
            Give your autonomous agent pipelines a dedicated supervision workspace with live timeline visibility and human control gates.
          </p>
          <div className="pt-2 flex flex-col sm:flex-row justify-center gap-4">
            <Link href={isAuthenticated ? "/runs" : "/register"}>
              <Button variant="primary" size="lg" className="w-full sm:w-auto bg-white text-stone-900 hover:bg-stone-100">
                Create a project →
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-stone-950 text-stone-400 text-xs border-t border-stone-800 py-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <StewardLogo size="sm" variant="light" />
            <span>© 2026 Steward V1. All rights reserved.</span>
          </div>

          <div className="flex items-center gap-6">
            <a href="#workflow" className="hover:text-white transition-colors">
              Product
            </a>
            <a href="#security" className="hover:text-white transition-colors">
              Security
            </a>
            <a href="#integration" className="hover:text-white transition-colors">
              Documentation
            </a>
            <a
              href="https://github.com/o1-spec/Steward"
              target="_blank"
              rel="noreferrer"
              className="hover:text-white transition-colors"
            >
              GitHub
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
