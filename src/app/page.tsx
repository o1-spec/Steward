"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { StewardLogo } from "@/components/StewardLogo";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Reveal } from "@/components/ui/Reveal";
import { StewardLoader } from "@/components/StewardLoader";
import { PageContainer, Section, SectionHeader } from "@/components/ui/Layout";
import { DragScroll } from "@/components/ui/DragScroll";

export default function LandingPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeStory, setActiveStory] = useState<"timeline" | "approval" | "control">("timeline");
  const [interactiveDecision, setInteractiveDecision] = useState<"pending" | "approved" | "rejected">("pending");
  const [copiedCode, setCopiedCode] = useState(false);

  // Hero Preview Animation Sequence State
  const [previewStep, setPreviewStep] = useState(() => {
    if (typeof window !== "undefined") {
      return window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 3 : 1;
    }
    return 1;
  });

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => {
        if (res.ok) setIsAuthenticated(true);
      })
      .catch(() => { });
  }, []);

  // Mobile Menu Focus & Scroll Locking
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && mobileMenuOpen) {
        setMobileMenuOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [mobileMenuOpen]);

  // Hero Preview Step Progression (Runs once)
  useEffect(() => {
    if (previewStep === 3) return;

    const t1 = setTimeout(() => setPreviewStep(2), 800);
    const t2 = setTimeout(() => setPreviewStep(3), 1800);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [previewStep]);

  const handleCopyCode = () => {
    const code = `import { Steward } from "@steward/sdk";

const steward = new Steward({
  apiKey: process.env.STEWARD_API_KEY!,
  agentName: "deployment-agent",
});

const run = steward.startRun();
await run.started({ task: "Deploy production container" });`;

    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  return (
    <div className="min-h-screen bg-stone-warm text-stone-900 flex flex-col font-sans selection:bg-blue-100 selection:text-blue-900">
      {/* Steward Initial Entry Loader */}
      <StewardLoader />

      {/* 1. Header Navigation */}
      <header className="sticky top-0 z-40 bg-stone-warm/90 backdrop-blur-md border-b border-stone-200/80 transition-colors">
        <PageContainer>
          <div className="h-14 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <StewardLogo size="md" variant="dark" />
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-7 text-xs font-medium text-stone-600">
              <Link href="/#how-it-works" className="hover:text-stone-900 transition-colors">
                How it works
              </Link>
              <Link href="/#features" className="hover:text-stone-900 transition-colors">
                Product
              </Link>
              <Link href="/#examples" className="hover:text-stone-900 transition-colors">
                Use Cases
              </Link>
              <Link href="/security" className="hover:text-stone-900 transition-colors">
                Security
              </Link>
              <Link href="/docs" className="hover:text-stone-900 transition-colors">
                Docs
              </Link>
            </nav>

            <div className="hidden md:flex items-center gap-3">
              {isAuthenticated ? (
                <Link href="/runs">
                  <Button variant="primary" size="sm">
                    Dashboard →
                  </Button>
                </Link>
              ) : (
                <>
                  <Link href="/login" className="text-xs font-medium text-stone-700 hover:text-stone-900 px-2.5 py-1.5 transition-colors">
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

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle navigation menu"
              aria-expanded={mobileMenuOpen}
              className="md:hidden p-1.5 rounded-lg text-stone-700 hover:bg-stone-200/60"
            >
              {mobileMenuOpen ? (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </PageContainer>

        {/* Accessible Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden border-b border-stone-200 bg-stone-warm px-4 py-4 space-y-3 text-sm font-medium">
            <Link
              href="/#how-it-works"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-stone-700 hover:text-stone-900"
            >
              How it works
            </Link>
            <Link
              href="/#features"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-stone-700 hover:text-stone-900"
            >
              Product
            </Link>
            <Link
              href="/#examples"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-stone-700 hover:text-stone-900"
            >
              Use Cases
            </Link>
            <Link
              href="/security"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-stone-700 hover:text-stone-900"
            >
              Security
            </Link>
            <Link
              href="/docs"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-stone-700 hover:text-stone-900"
            >
              Docs
            </Link>
            <div className="pt-2 border-t border-stone-200 flex flex-col gap-2">
              {isAuthenticated ? (
                <Link href="/runs" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="primary" size="sm" className="w-full">
                    Dashboard →
                  </Button>
                </Link>
              ) : (
                <>
                  <Link href="/login" onClick={() => setMobileMenuOpen(false)}>
                    <Button variant="outline" size="sm" className="w-full">
                      Sign in
                    </Button>
                  </Link>
                  <Link href="/register" onClick={() => setMobileMenuOpen(false)}>
                    <Button variant="primary" size="sm" className="w-full">
                      Connect an agent
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </header>

      {/* 2. Hero Section */}
      <section className="relative pt-10 pb-12 sm:pt-14 sm:pb-16 md:pt-16 md:pb-20 overflow-hidden">
        <div className="absolute inset-0 bg-grid-pattern opacity-40 pointer-events-none mask-radial-gradient" />

        <PageContainer className="relative z-10">
          <Reveal variant="fade-up" durationMs={500}>
            <div className="max-w-3xl mx-auto text-center space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-stone-100 border border-stone-200/80 text-xs font-medium text-stone-700">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse-subtle" />
                <span>Human oversight for autonomous agents</span>
              </div>

              <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl tracking-tight text-stone-900 leading-[1.15]">
                See what your agents are doing. <br />
                <span className="italic font-normal text-stone-800">Control what they’re allowed to do.</span>
              </h1>

              <p className="text-sm sm:text-base text-stone-600 max-w-xl mx-auto leading-relaxed">
                Inspect every run, hold sensitive actions for approval, and intervene when an agent needs human judgment.
              </p>

              <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
                <Link href={isAuthenticated ? "/runs" : "/register"} className="w-full sm:w-auto">
                  <Button variant="primary" size="md" className="w-full sm:w-auto">
                    Connect an agent →
                  </Button>
                </Link>
                <a href="#how-it-works" className="w-full sm:w-auto">
                  <Button variant="outline" size="md" className="w-full sm:w-auto">
                    See how it works
                  </Button>
                </a>
              </div>
            </div>
          </Reveal>

          {/* Hero Product Preview with One-Time Restrained Sequence */}
          <Reveal variant="fade-up" delayMs={150} durationMs={600}>
            <div className="mt-10 sm:mt-12 max-w-5xl mx-auto rounded-xl border border-stone-300/80 bg-white shadow-lg overflow-hidden text-left">
              <div className="bg-stone-100 border-b border-stone-200 px-4 py-2.5 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-stone-300 inline-block" />
                  <span className="w-2.5 h-2.5 rounded-full bg-stone-300 inline-block" />
                  <span className="w-2.5 h-2.5 rounded-full bg-stone-300 inline-block" />
                  <span className="ml-2 font-mono text-[11px] text-stone-500">steward // run_prod_deploy_4802</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="running">RUNNING</Badge>
                  <span className="text-[11px] text-stone-500 font-mono hidden sm:inline">Agent: deployment-worker-01</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" title="SSE Stream Connected" />
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-stone-200">
                {/* Live Event Stream Column */}
                <div className="lg:col-span-7 p-4 sm:p-5 space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold uppercase tracking-wider text-stone-500 text-[11px]">
                      Live Event Stream
                    </span>
                    <span className="font-mono text-[11px] text-stone-400">
                      {previewStep === 1 ? "1 event" : previewStep === 2 ? "2 events" : "3 events"} • 1.2s
                    </span>
                  </div>

                  <div className="space-y-2 text-xs">
                    {/* Event 1 */}
                    <div className="p-2.5 rounded-lg bg-stone-50 border border-stone-200/80 flex items-start gap-2.5 transition-all">
                      <span className="font-mono text-[11px] font-bold text-stone-400">01</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between font-mono text-[11px]">
                          <span className="font-semibold text-stone-900">run.started</span>
                          <span className="text-stone-400">12:04:01</span>
                        </div>
                        <p className="text-stone-600 text-xs mt-0.5 truncate">
                          Task: &quot;Deploy auth microservice container to production cluster&quot;
                        </p>
                      </div>
                    </div>

                    {/* Event 2 */}
                    {previewStep >= 2 && (
                      <div className="p-2.5 rounded-lg bg-stone-50 border border-stone-200/80 flex items-start gap-2.5 transition-all">
                        <span className="font-mono text-[11px] font-bold text-purple-600">02</span>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between font-mono text-[11px]">
                            <span className="font-semibold text-stone-900">model.completed</span>
                            <span className="text-stone-400">gemini-2.5-flash • $0.001</span>
                          </div>
                          <p className="text-stone-600 text-xs mt-0.5">
                            Evaluated safety check. Generated payload for tool invocation.
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Event 3: Linked Pending Approval Event */}
                    {previewStep >= 3 && (
                      <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-300/80 flex items-start gap-2.5 ring-2 ring-amber-400/50 transition-all">
                        <span className="font-mono text-[11px] font-bold text-amber-700">03</span>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-center font-mono text-[11px]">
                            <span className="font-semibold text-amber-950">approval.requested</span>
                            <Badge variant="high">HIGH RISK</Badge>
                          </div>
                          <p className="text-amber-900 text-xs mt-0.5 font-medium">
                            Tool: <code className="bg-amber-100 px-1 py-0.5 rounded text-amber-950 font-mono">aws.s3.delete_bucket</code>
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Right Column: Active Approval Panel */}
                <div className="lg:col-span-5 p-4 sm:p-5 bg-stone-50/60 flex flex-col justify-between space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between border-b border-stone-200 pb-2 text-xs">
                      <span className="font-semibold uppercase tracking-wider text-stone-500 text-[11px]">
                        Pending Human Approval
                      </span>
                      <Badge variant="waiting">PENDING</Badge>
                    </div>

                    <div className="bg-white p-3 rounded-lg border border-stone-200 space-y-2 text-xs">
                      <div className="flex justify-between">
                        <span className="text-stone-500">Tool:</span>
                        <code className="font-mono font-bold text-stone-900">aws.s3.delete_bucket</code>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-stone-500">Target:</span>
                        <span className="font-mono text-stone-800">s3://prod-backups-2026</span>
                      </div>
                      <div className="border-t border-stone-100 pt-2">
                        <span className="text-stone-500 text-[11px] block mb-1">Redacted Arguments:</span>
                        <pre className="bg-stone-950 text-stone-200 p-2 rounded font-mono text-[10px] overflow-x-auto">
                          {`{
  "bucket": "prod-backups-2026",
  "accessKey": "[REDACTED]"
}`}
                        </pre>
                      </div>
                    </div>
                  </div>

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
                      <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-2.5 rounded-lg text-xs font-medium flex items-center justify-between">
                        <span>✓ Approved by Operator (Demo)</span>
                        <button
                          onClick={() => setInteractiveDecision("pending")}
                          className="text-[11px] underline text-emerald-900 hover:text-emerald-950"
                        >
                          Reset
                        </button>
                      </div>
                    ) : (
                      <div className="bg-rose-50 border border-rose-200 text-rose-800 p-2.5 rounded-lg text-xs font-medium flex items-center justify-between">
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
              <div className="bg-stone-100/90 px-4 py-2 border-t border-stone-200 text-[11px] text-stone-500 flex items-center justify-between">
                <span>Illustrative product preview. Agent runs execute in your local or cloud environment.</span>
                <span className="font-mono text-stone-400">Steward Telemetry</span>
              </div>
            </div>
          </Reveal>
        </PageContainer>
      </section>

      {/* 3. Section 1: The problem Steward solves */}
      <Section bg="white">
        <PageContainer>
          <Reveal variant="fade-up">
            <SectionHeader
              title="Agents can act faster than humans can review."
              subtitle="Once an agent can call APIs, modify records or trigger external systems, ordinary logs are no longer enough. Teams need to see what is happening, stop sensitive actions for review and preserve a reliable record of every decision."
            />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
              <div className="p-5 rounded-xl bg-stone-warm border border-stone-200/90 space-y-2">
                <div className="w-7 h-7 rounded-md bg-stone-200/80 text-stone-800 flex items-center justify-center font-bold text-xs">
                  <svg className="w-4 h-4 text-stone-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                </div>
                <h3 className="text-sm font-semibold text-stone-900">Actions happen out of sight</h3>
                <p className="text-xs text-stone-600 leading-relaxed">
                  Model calls, tool selections and failures are scattered across unorganized application logs.
                </p>
              </div>

              <div className="p-5 rounded-xl bg-stone-warm border border-stone-200/90 space-y-2">
                <div className="w-7 h-7 rounded-md bg-amber-100/80 text-amber-900 flex items-center justify-center font-bold text-xs">
                  <svg className="w-4 h-4 text-amber-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <h3 className="text-sm font-semibold text-stone-900">Sensitive tools execute immediately</h3>
                <p className="text-xs text-stone-600 leading-relaxed">
                  Deployments, external messages and database mutations happen automatically without prior review.
                </p>
              </div>

              <div className="p-5 rounded-xl bg-stone-warm border border-stone-200/90 space-y-2">
                <div className="w-7 h-7 rounded-md bg-rose-100/80 text-rose-900 flex items-center justify-center font-bold text-xs">
                  <svg className="w-4 h-4 text-rose-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                  </svg>
                </div>
                <h3 className="text-sm font-semibold text-stone-900">Intervention comes too late</h3>
                <p className="text-xs text-stone-600 leading-relaxed">
                  By the time someone notices an unexpected tool output, the destructive operation is already complete.
                </p>
              </div>
            </div>

            <DragScroll className="bg-stone-950 text-stone-200 p-5 rounded-xl border border-stone-800 space-y-4 max-w-3xl mx-auto font-mono text-xs shadow-md">
              <div className="flex items-center justify-between border-b border-stone-800 pb-2 text-[11px] text-stone-400 min-w-125">
                <span>UNSUPERVISED VS STEWARD CONTROL LAYER</span>
                <span className="text-emerald-400">Deterministic Safety Gate</span>
              </div>

              <div className="p-3 rounded bg-stone-900 border border-stone-800 opacity-60 min-w-125">
                <div className="text-[10px] text-rose-400 uppercase tracking-wider mb-1 font-semibold">Unsupervised Execution</div>
                <div className="flex items-center gap-2 text-[11px]">
                  <span className="text-stone-300">Agent Intention</span>
                  <span className="text-stone-500">→</span>
                  <span className="text-rose-400">Direct Tool Call (No Review)</span>
                  <span className="text-stone-500">→</span>
                  <span className="text-rose-400 font-bold">Unchecked Mutation Complete</span>
                </div>
              </div>

              <div className="p-3 rounded bg-stone-900 border border-blue-500/40 ring-1 ring-blue-500/20 min-w-125">
                <div className="text-[10px] text-blue-400 uppercase tracking-wider mb-1 font-semibold">Steward Supervised Execution</div>
                <div className="flex items-center gap-2 text-[11px]">
                  <span className="text-stone-300">Agent Intention</span>
                  <span className="text-stone-500">→</span>
                  <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold">
                    Steward Approval Gate (Held)
                  </span>
                  <span className="text-stone-500">→</span>
                  <span className="text-emerald-400">Human Operator Decision</span>
                  <span className="text-stone-500">→</span>
                  <span className="text-stone-200 font-medium">Safe Tool Execution</span>
                </div>
              </div>
            </DragScroll>

            <div className="text-center pt-6">
              <p className="text-xs sm:text-sm font-medium text-stone-900 italic">
                Steward places a human control layer between an agent’s intention and its sensitive actions.
              </p>
            </div>
          </Reveal>
        </PageContainer>
      </Section>

      {/* 4. Connected Operational Loop Section */}
      <Section id="how-it-works" bg="warm">
        <PageContainer>
          <Reveal variant="fade-up">
            <SectionHeader
              title="How Steward works"
              subtitle="A connected four-step loop for supervising autonomous execution."
            />

            <div className="relative">
              <div className="hidden lg:block absolute top-6 left-12 right-12 h-0.5 bg-stone-200 z-0" />

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 relative z-10">
                <div className="space-y-3 bg-white p-5 rounded-xl border border-stone-200/80 shadow-2xs">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-stone-900 text-white flex items-center justify-center font-mono text-xs font-bold">
                      1
                    </div>
                    <h3 className="text-sm font-bold text-stone-900">Connect</h3>
                  </div>
                  <p className="text-xs text-stone-600 leading-relaxed">
                    Add the lightweight Node.js SDK package to an existing agent codebase.
                  </p>
                  <div className="bg-stone-950 p-2.5 rounded text-[11px] font-mono text-stone-300">
                    <code className="text-blue-400">new Steward({`{ apiKey }`})</code>
                  </div>
                </div>

                <div className="space-y-3 bg-white p-5 rounded-xl border border-stone-200/80 shadow-2xs">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center font-mono text-xs font-bold">
                      2
                    </div>
                    <h3 className="text-sm font-bold text-stone-900">Observe</h3>
                  </div>
                  <p className="text-xs text-stone-600 leading-relaxed">
                    Stream model calls, tool executions, latency, token costs, and failures.
                  </p>
                  <div className="bg-stone-950 p-2.5 rounded text-[11px] font-mono text-emerald-400 truncate">
                    tool.succeeded • db.query
                  </div>
                </div>

                <div className="space-y-3 bg-white p-5 rounded-xl border border-stone-200/80 shadow-2xs">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-amber-600 text-white flex items-center justify-center font-mono text-xs font-bold">
                      3
                    </div>
                    <h3 className="text-sm font-bold text-stone-900">Approve</h3>
                  </div>
                  <p className="text-xs text-stone-600 leading-relaxed">
                    Hold sensitive actions in a polling loop until a person approves or rejects.
                  </p>
                  <div className="bg-stone-950 p-2.5 rounded text-[11px] font-mono text-amber-300 truncate">
                    deploy.prod • HIGH RISK
                  </div>
                </div>

                <div className="space-y-3 bg-white p-5 rounded-xl border border-stone-200/80 shadow-2xs">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-stone-900 text-white flex items-center justify-center font-mono text-xs font-bold">
                      4
                    </div>
                    <h3 className="text-sm font-bold text-stone-900">Control</h3>
                  </div>
                  <p className="text-xs text-stone-600 leading-relaxed">
                    Cooperatively pause, resume, or cancel connected agent execution safely.
                  </p>
                  <div className="flex gap-1.5 font-mono text-[10px]">
                    <span className="px-2 py-1 bg-amber-100 text-amber-800 rounded font-semibold">Pause</span>
                    <span className="px-2 py-1 bg-emerald-100 text-emerald-800 rounded font-semibold">Resume</span>
                    <span className="px-2 py-1 bg-rose-100 text-rose-800 rounded font-semibold">Cancel</span>
                  </div>
                </div>
              </div>
            </div>
          </Reveal>
        </PageContainer>
      </Section>

      {/* 5. Product Stories Section */}
      <Section id="features" bg="white">
        <PageContainer>
          <Reveal variant="fade-up">
            <SectionHeader
              title="Everything you need to supervise a run"
              subtitle="Follow every action, review sensitive requests, and step in without losing the execution history."
            />

            <div className="bg-stone-warm rounded-xl border border-stone-300/80 p-5 md:p-8 space-y-6 shadow-xs">
              <DragScroll className="flex border-b border-stone-200 gap-4 sm:gap-8 text-xs sm:text-sm font-medium pb-1">
                <button
                  onClick={() => setActiveStory("timeline")}
                  className={`pb-2.5 border-b-2 transition-colors shrink-0 ${activeStory === "timeline"
                    ? "border-blue-600 text-blue-600 font-semibold"
                    : "border-transparent text-stone-500 hover:text-stone-900"
                    }`}
                >
                  1. Understand every run
                </button>
                <button
                  onClick={() => setActiveStory("approval")}
                  className={`pb-2.5 border-b-2 transition-colors shrink-0 ${activeStory === "approval"
                    ? "border-blue-600 text-blue-600 font-semibold"
                    : "border-transparent text-stone-500 hover:text-stone-900"
                    }`}
                >
                  2. Hold sensitive actions
                </button>
                <button
                  onClick={() => setActiveStory("control")}
                  className={`pb-2.5 border-b-2 transition-colors shrink-0 ${activeStory === "control"
                    ? "border-blue-600 text-blue-600 font-semibold"
                    : "border-transparent text-stone-500 hover:text-stone-900"
                    }`}
                >
                  3. Intervene safely
                </button>
              </DragScroll>

              {activeStory === "timeline" && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center pt-2">
                  <div className="space-y-3">
                    <h3 className="text-lg font-semibold text-stone-900">
                      Observe model calls, tool actions, duration, and cost
                    </h3>
                    <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
                      Track sequence-ordered events emitted by your agent SDK in a sub-second timeline. Monitor token counts, API cost, tool latency, and error tracebacks.
                    </p>
                    <ul className="space-y-1.5 text-xs text-stone-700">
                      <li className="flex items-center gap-2">
                        <span className="text-emerald-600 font-bold">✓</span>
                        <span>Real-time timeline streaming via Server-Sent Events (SSE)</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="text-emerald-600 font-bold">✓</span>
                        <span>Automatic recursive redaction of secrets and credentials</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="text-emerald-600 font-bold">✓</span>
                        <span>Immutable audit log per project</span>
                      </li>
                    </ul>
                  </div>
                  <DragScroll className="bg-stone-950 text-stone-200 p-4 rounded-lg font-mono text-xs space-y-2 shadow-inner">
                    <div className="text-stone-500 text-[11px] font-sans">{`// Steward Event Envelope`}</div>
                    <pre className="text-stone-300 text-[11px]">
                      {`{
  "specVersion": "1.0",
  "eventId": "evt_98f421a",
  "eventType": "tool.succeeded",
  "occurredAt": "2026-07-27T00:12:04.102Z",
  "sequence": 4,
  "payload": {
    "toolName": "db.query",
    "durationMs": 142,
    "arguments": { "authToken": "[REDACTED]" }
  }
}`}
                    </pre>
                  </DragScroll>
                </div>
              )}

              {activeStory === "approval" && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center pt-2">
                  <div className="space-y-3">
                    <h3 className="text-lg font-semibold text-stone-900">
                      Hold execution until an operator reviews the request
                    </h3>
                    <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
                      When an agent calls a guarded tool, execution pauses safely in a polling loop until an operator approves or rejects the action with a documented reason.
                    </p>
                    <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-900 font-medium">
                      Policy: Guarded callbacks never execute without an explicit HTTP approval record.
                    </div>
                  </div>
                  <div className="border border-stone-200 rounded-lg p-4 bg-white space-y-3 text-xs">
                    <div className="flex justify-between items-center">
                      <span className="font-mono font-bold text-stone-800">aws.s3.delete_bucket</span>
                      <Badge variant="high">HIGH RISK</Badge>
                    </div>
                    <div className="space-y-1 font-mono text-[11px]">
                      <div><span className="text-stone-500">Agent:</span> <span className="text-stone-900">cleanup-worker</span></div>
                      <div><span className="text-stone-500">Reason:</span> <span className="text-stone-900">Clean staging bucket</span></div>
                    </div>
                    <div className="pt-2 flex gap-2">
                      <Button variant="destructive" size="sm" className="w-full">Reject</Button>
                      <Button variant="success" size="sm" className="w-full">Approve</Button>
                    </div>
                  </div>
                </div>
              )}

              {activeStory === "control" && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center pt-2">
                  <div className="space-y-3">
                    <h3 className="text-lg font-semibold text-stone-900">
                      Cooperative pause, resume, and cancel control signals
                    </h3>
                    <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
                      Issue control commands from the dashboard. Connected agents poll for pending commands at checkpoints and yield or abort cleanly.
                    </p>
                    <ul className="space-y-1.5 text-xs text-stone-700">
                      <li className="flex items-center gap-2">
                        <span className="text-blue-600 font-bold">▶</span>
                        <span><strong>PAUSE</strong>: Holds execution at next checkpoint</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="text-emerald-600 font-bold">▶</span>
                        <span><strong>RESUME</strong>: Releases paused agent back to active execution</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="text-rose-600 font-bold">■</span>
                        <span><strong>CANCEL</strong>: Aborts run with typed StewardRunCancelledError</span>
                      </li>
                    </ul>
                  </div>
                  <DragScroll className="bg-stone-900 text-stone-100 p-4 rounded-lg font-mono text-xs space-y-2">
                    <div className="text-stone-400 text-[11px] font-sans">{`// Command Listener`}</div>
                    <pre className="text-blue-300 text-[11px]">
                      {`run.startCommandListener({
  onPause: async (cmd) => console.log("Paused:", cmd.reason),
  onResume: async (cmd) => console.log("Resumed:", cmd.reason),
  onCancel: async (cmd) => console.log("Cancelled:", cmd.reason),
});

await run.checkpoint();`}
                    </pre>
                  </DragScroll>
                </div>
              )}
            </div>
          </Reveal>
        </PageContainer>
      </Section>

      {/* 6. Section 2: Real-world supervision examples */}
      <Section id="examples" bg="warm">
        <PageContainer>
          <Reveal variant="fade-up">
            <SectionHeader
              title="One control layer for different kinds of agents"
              subtitle="Realistic supervision flows across engineering, support, and research workloads."
            />

            <div className="space-y-6">
              {/* Example 1: Deployment Agent */}
              <div className="bg-white rounded-xl border border-stone-300/80 p-5 sm:p-6 space-y-4 shadow-2xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-100 pb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded bg-stone-900 text-white flex items-center justify-center font-mono text-xs font-bold">
                      A
                    </div>
                    <h3 className="text-base font-semibold text-stone-900">Deployment Agent</h3>
                  </div>
                  <DragScroll className="flex items-center gap-1.5 font-mono text-[11px] text-stone-500">
                    <span className="shrink-0">Agent starts</span>
                    <span>→</span>
                    <span className="shrink-0">Work observed</span>
                    <span>→</span>
                    <span className="text-amber-700 font-bold bg-amber-100 px-1.5 py-0.5 rounded shrink-0">Action held</span>
                    <span>→</span>
                    <span className="text-emerald-700 font-bold shrink-0">Human decides</span>
                  </DragScroll>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
                  <div className="space-y-1">
                    <span className="font-semibold uppercase text-[10px] text-stone-500 tracking-wider block">1. Goal</span>
                    <p className="text-stone-700">Prepares and deploys container update to production Kubernetes cluster.</p>
                  </div>

                  <div className="space-y-1">
                    <span className="font-semibold uppercase text-[10px] text-stone-500 tracking-wider block">2. Steward Records</span>
                    <p className="text-stone-700 font-mono">build.status, test.summary, container.tag: &quot;v2.1.0&quot;</p>
                  </div>

                  <div className="space-y-1">
                    <span className="font-semibold uppercase text-[10px] text-stone-500 tracking-wider block">3. Held Action</span>
                    <code className="bg-amber-100 text-amber-950 font-mono px-1.5 py-0.5 rounded font-bold inline-block">
                      deploy.production
                    </code>
                  </div>

                  <div className="space-y-1">
                    <span className="font-semibold uppercase text-[10px] text-stone-500 tracking-wider block">4. Human Decision</span>
                    <p className="text-stone-700">Engineer inspects parameter diff & clicks <strong className="text-emerald-700">Approve</strong> to release container.</p>
                  </div>
                </div>
              </div>

              {/* Example 2: Customer-Support Agent */}
              <div className="bg-white rounded-xl border border-stone-300/80 p-5 sm:p-6 space-y-4 shadow-2xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-100 pb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded bg-blue-600 text-white flex items-center justify-center font-mono text-xs font-bold">
                      B
                    </div>
                    <h3 className="text-base font-semibold text-stone-900">Customer-Support Agent</h3>
                  </div>
                  <DragScroll className="flex items-center gap-1.5 font-mono text-[11px] text-stone-500">
                    <span className="shrink-0">Agent starts</span>
                    <span>→</span>
                    <span className="shrink-0">Work observed</span>
                    <span>→</span>
                    <span className="text-amber-700 font-bold bg-amber-100 px-1.5 py-0.5 rounded shrink-0">Action held</span>
                    <span>→</span>
                    <span className="text-emerald-700 font-bold shrink-0">Human decides</span>
                  </DragScroll>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
                  <div className="space-y-1">
                    <span className="font-semibold uppercase text-[10px] text-stone-500 tracking-wider block">1. Goal</span>
                    <p className="text-stone-700">Drafts customer response email and calculates refund for disputed billing item.</p>
                  </div>

                  <div className="space-y-1">
                    <span className="font-semibold uppercase text-[10px] text-stone-500 tracking-wider block">2. Steward Records</span>
                    <p className="text-stone-700 font-mono">model.reasoning, policy.lookup, refund.amount: $149.00</p>
                  </div>

                  <div className="space-y-1">
                    <span className="font-semibold uppercase text-[10px] text-stone-500 tracking-wider block">3. Held Action</span>
                    <code className="bg-amber-100 text-amber-950 font-mono px-1.5 py-0.5 rounded font-bold inline-block">
                      billing.issue_refund
                    </code>
                  </div>

                  <div className="space-y-1">
                    <span className="font-semibold uppercase text-[10px] text-stone-500 tracking-wider block">4. Human Decision</span>
                    <p className="text-stone-700">Support lead verifies account history & approves refund dispatch.</p>
                  </div>
                </div>
              </div>

              {/* Example 3: Research Agent */}
              <div className="bg-white rounded-xl border border-stone-300/80 p-5 sm:p-6 space-y-4 shadow-2xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-100 pb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded bg-emerald-700 text-white flex items-center justify-center font-mono text-xs font-bold">
                      C
                    </div>
                    <h3 className="text-base font-semibold text-stone-900">Research Agent</h3>
                  </div>
                  <DragScroll className="flex items-center gap-1.5 font-mono text-[11px] text-stone-500">
                    <span className="shrink-0">Agent starts</span>
                    <span>→</span>
                    <span className="shrink-0">Work observed</span>
                    <span>→</span>
                    <span className="text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.5 rounded shrink-0">Telemetry recorded</span>
                    <span>→</span>
                    <span className="text-stone-700 font-bold shrink-0">Run completed</span>
                  </DragScroll>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
                  <div className="space-y-1">
                    <span className="font-semibold uppercase text-[10px] text-stone-500 tracking-wider block">1. Goal</span>
                    <p className="text-stone-700">Searches literature, queries models, and synthesizes competitive benchmark report.</p>
                  </div>

                  <div className="space-y-1">
                    <span className="font-semibold uppercase text-[10px] text-stone-500 tracking-wider block">2. Steward Records</span>
                    <p className="text-stone-700 font-mono">search.queries, token.costs: $0.04, latency: 12.4s</p>
                  </div>

                  <div className="space-y-1">
                    <span className="font-semibold uppercase text-[10px] text-stone-500 tracking-wider block">3. Held Action</span>
                    <span className="text-stone-500 italic">None (Autonomous read-only operation)</span>
                  </div>

                  <div className="space-y-1">
                    <span className="font-semibold uppercase text-[10px] text-stone-500 tracking-wider block">4. Human Decision</span>
                    <p className="text-stone-700">Operator inspects timeline cost summary & views generated report payload.</p>
                  </div>
                </div>
              </div>
            </div>
          </Reveal>
        </PageContainer>
      </Section>

      {/* 7. Clear Boundaries by Design Section */}
      <Section id="security" bg="white">
        <PageContainer>
          <Reveal variant="fade-up">
            <SectionHeader
              title="Clear boundaries by design"
              subtitle="Steward provides supervision telemetry without taking over your infrastructure."
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
              <div className="p-5 rounded-xl bg-stone-warm border border-stone-200 space-y-2">
                <div className="font-semibold text-sm text-stone-900">1. Keys identify projects</div>
                <p className="text-xs text-stone-600 leading-relaxed">
                  Complete secret keys are shown once. Only SHA-256 hashes are stored.
                </p>
              </div>

              <div className="p-5 rounded-xl bg-stone-warm border border-stone-200 space-y-2">
                <div className="font-semibold text-sm text-stone-900">2. Sensitive fields redacted</div>
                <p className="text-xs text-stone-600 leading-relaxed">
                  Passwords, tokens, and secret parameters are masked with <code className="bg-stone-200 px-1 rounded text-[11px]">[REDACTED]</code>.
                </p>
              </div>

              <div className="p-5 rounded-xl bg-stone-warm border border-stone-200 space-y-2">
                <div className="font-semibold text-sm text-stone-900">3. Decisions recorded</div>
                <p className="text-xs text-stone-600 leading-relaxed">
                  Human approvals, project modifications, and key revocations are stored in an append-only log.
                </p>
              </div>

              <div className="p-5 rounded-xl bg-stone-warm border border-stone-200 space-y-2">
                <div className="font-semibold text-sm text-stone-900">4. Agents remain local</div>
                <p className="text-xs text-stone-600 leading-relaxed">
                  Steward does not host agent code or execute tools. Control signals are cooperative.
                </p>
              </div>
            </div>

            <DragScroll className="p-5 rounded-xl bg-stone-900 text-stone-200 font-mono text-xs max-w-3xl mx-auto shadow-sm text-center">
              <div className="flex items-center justify-center gap-2 sm:gap-4 text-[11px] min-w-137.5">
                <span className="px-2.5 py-1 rounded bg-stone-800 border border-stone-700 text-stone-100 shrink-0">
                  Connected Agent
                </span>
                <span className="text-stone-500">→</span>
                <span className="px-2.5 py-1 rounded bg-stone-800 border border-stone-700 text-amber-300 shrink-0">
                  Redacted Event
                </span>
                <span className="text-stone-500">→</span>
                <span className="px-2.5 py-1 rounded bg-stone-800 border border-stone-700 text-blue-300 shrink-0">
                  Steward Timeline
                </span>
                <span className="text-stone-500">→</span>
                <span className="px-2.5 py-1 rounded bg-stone-800 border border-stone-700 text-emerald-300 shrink-0">
                  Human Decision
                </span>
                <span className="text-stone-500">→</span>
                <span className="px-2.5 py-1 rounded bg-stone-800 border border-stone-700 text-stone-100 shrink-0">
                  Connected Agent
                </span>
              </div>
            </DragScroll>
          </Reveal>
        </PageContainer>
      </Section>

      {/* 8. Integration Section */}
      <Section id="integration" bg="warm">
        <PageContainer>
          <Reveal variant="fade-up">
            <SectionHeader
              title="Connect your first agent in minutes"
              subtitle="Add telemetry and approval gates using the official @steward/sdk package."
            />

            <div className="max-w-2xl mx-auto space-y-4">
              {/* Installation Command */}
              <div className="bg-stone-950 text-stone-200 p-3.5 rounded-xl border border-stone-800 font-mono text-xs flex items-center justify-between shadow-sm">
                <span><span className="text-stone-500">$</span> npm install @steward/sdk</span>
                <span className="text-[10px] text-stone-500 font-sans uppercase tracking-wider">Terminal</span>
              </div>

              {/* Short Init Example */}
              <div className="rounded-xl bg-stone-950 text-stone-200 p-5 font-mono text-xs space-y-3 shadow-md border border-stone-800">
                <div className="flex items-center justify-between border-b border-stone-800 pb-2.5 text-stone-400 text-[11px]">
                  <span>agent.ts</span>
                  <button
                    onClick={handleCopyCode}
                    className="text-xs font-sans text-blue-400 hover:text-blue-300 transition-colors flex items-center gap-1"
                  >
                    {copiedCode ? "✓ Copied!" : "Copy Code"}
                  </button>
                </div>
                <DragScroll>
                  <pre className="text-stone-300 leading-relaxed text-[11px]">
                    {`import { Steward } from "@steward/sdk";

const steward = new Steward({
  apiKey: process.env.STEWARD_API_KEY!,
  agentName: "deployment-agent",
});

const run = steward.startRun();
await run.started({ task: "Deploy production container" });`}
                  </pre>
                </DragScroll>
              </div>
            </div>

            <div className="text-center flex flex-col sm:flex-row items-center justify-center gap-3 pt-8">
              <Link href={isAuthenticated ? "/runs" : "/register"}>
                <Button variant="primary" size="md">
                  Create a project →
                </Button>
              </Link>
              <Link href="/docs">
                <Button variant="outline" size="md">
                  Read the documentation
                </Button>
              </Link>
            </div>
          </Reveal>
        </PageContainer>
      </Section>

      {/* 9. Final CTA & Footer */}
      <section className="py-16 bg-stone-900 text-white">
        <PageContainer>
          <Reveal variant="fade-up">
            <div className="max-w-3xl mx-auto text-center space-y-5">
              <h2 className="font-serif text-2xl sm:text-3xl md:text-4xl text-white">
                Put a human checkpoint before the next sensitive action.
              </h2>
              <p className="text-stone-300 text-xs sm:text-sm max-w-lg mx-auto">
                Give your autonomous agent pipelines a dedicated supervision workspace with live timeline visibility and human control gates.
              </p>
              <div className="pt-2 flex flex-col sm:flex-row justify-center gap-3">
                <Link href={isAuthenticated ? "/runs" : "/register"}>
                  <button className="w-full sm:w-auto px-5 py-2.5 rounded-lg text-sm font-semibold bg-white text-stone-950 hover:bg-stone-100 transition-colors shadow-sm">
                    Connect an agent →
                  </button>
                </Link>
                <Link href="/docs">
                  <button className="w-full sm:w-auto px-5 py-2.5 rounded-lg text-sm font-medium bg-transparent text-stone-100 border border-stone-700 hover:bg-stone-800 hover:border-stone-600 transition-colors">
                    Read the documentation
                  </button>
                </Link>
              </div>
            </div>
          </Reveal>
        </PageContainer>
      </section>

      {/* Footer */}
      <footer className="bg-stone-950 text-stone-400 text-xs border-t border-stone-800 py-8">
        <PageContainer>
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <StewardLogo size="sm" variant="light" />
              <span>© 2026 Steward. All rights reserved.</span>
            </div>

            <div className="flex flex-wrap items-center gap-6 font-medium text-stone-400">
              <a href="#features" className="hover:text-white transition-colors">
                Product
              </a>
              <a href="#examples" className="hover:text-white transition-colors">
                Use Cases
              </a>
              <Link href="/docs" className="hover:text-white transition-colors">
                Docs
              </Link>
              <Link href="/privacy" className="hover:text-white transition-colors">
                Privacy
              </Link>
              <Link href="/terms" className="hover:text-white transition-colors">
                Terms
              </Link>
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
        </PageContainer>
      </footer>
    </div>
  );
}
