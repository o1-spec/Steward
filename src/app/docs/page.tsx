import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { DragScroll } from "@/components/ui/DragScroll";

export const metadata = {
  title: "Documentation Home — Steward Docs",
  description:
    "Connect a Node.js agent, stream its activity, hold sensitive tools for approval and respond to cooperative control commands.",
};

export default function DocsHomePage() {
  return (
    <div className="space-y-10">
      {/* Hero Index Header */}
      <div className="space-y-4 border-b border-stone-200/80 pb-8">
        <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-stone-100 border border-stone-200 text-xs font-mono text-stone-600">
          <span>Steward Documentation</span>
        </div>

        <h1 className="text-3xl sm:text-4xl font-serif font-bold text-stone-900 leading-tight">
          Build human oversight into your agents
        </h1>

        <p className="text-sm sm:text-base text-stone-600 leading-relaxed max-w-2xl">
          Connect a Node.js agent, stream its activity, hold sensitive tools for approval and respond to cooperative control commands.
        </p>

        <div className="pt-2 flex flex-wrap gap-3">
          <Link href="/docs/quickstart">
            <Button variant="primary" size="sm">
              Start Quickstart →
            </Button>
          </Link>
          <Link href="/docs/sdk">
            <Button variant="outline" size="sm">
              View SDK Reference
            </Button>
          </Link>
        </div>
      </div>

      {/* What Steward Is & Is Not */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-5 rounded-xl bg-white border border-stone-200/80 space-y-2">
          <div className="font-bold text-xs uppercase tracking-wider text-emerald-700 font-mono">
            ✓ What Steward Is
          </div>
          <p className="text-xs text-stone-600 leading-relaxed">
            An oversight and telemetry layer for connected agents running in your infrastructure. Emits live execution timelines, human approval gates, and cooperative control signals.
          </p>
        </div>

        <div className="p-5 rounded-xl bg-white border border-stone-200/80 space-y-2">
          <div className="font-bold text-xs uppercase tracking-wider text-rose-700 font-mono">
            ✕ What Steward Is Not
          </div>
          <p className="text-xs text-stone-600 leading-relaxed">
            Steward does not host agent code, execute customer tools on your behalf, or forcibly kill OS processes. Controls operate cooperatively through connected SDK polling loops.
          </p>
        </div>
      </div>

      {/* 5-Minute Path */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-stone-900 font-sans">
          5-Minute Path to First Run
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Link
            href="/docs/quickstart"
            className="p-4 rounded-xl bg-white border border-stone-200 hover:border-stone-300 transition-all space-y-1 group"
          >
            <div className="font-mono text-xs font-bold text-blue-600">01. Setup & Install</div>
            <div className="text-xs font-semibold text-stone-900 group-hover:text-blue-600">
              Install @steward/sdk
            </div>
            <p className="text-[11px] text-stone-500">
              Generate an API key and configure environment variables.
            </p>
          </Link>

          <Link
            href="/docs/quickstart"
            className="p-4 rounded-xl bg-white border border-stone-200 hover:border-stone-300 transition-all space-y-1 group"
          >
            <div className="font-mono text-xs font-bold text-blue-600">02. Instrument Agent</div>
            <div className="text-xs font-semibold text-stone-900 group-hover:text-blue-600">
              Start a Run
            </div>
            <p className="text-[11px] text-stone-500">
              Emit sequence-ordered lifecycle events in your workflow.
            </p>
          </Link>

          <Link
            href="/docs/approvals"
            className="p-4 rounded-xl bg-white border border-stone-200 hover:border-stone-300 transition-all space-y-1 group"
          >
            <div className="font-mono text-xs font-bold text-blue-600">03. Approve & Control</div>
            <div className="text-xs font-semibold text-stone-900 group-hover:text-blue-600">
              Human Supervision
            </div>
            <p className="text-[11px] text-stone-500">
              Hold sensitive tool calls for review & respond to commands.
            </p>
          </Link>
        </div>
      </div>

      {/* Small Architecture Flow */}
      <div className="space-y-3">
        <h2 className="text-lg font-bold text-stone-900 font-sans">
          Architecture & Control Flow
        </h2>
        <DragScroll className="p-4 rounded-xl bg-stone-950 text-stone-200 font-mono text-xs shadow-sm">
          <div className="flex items-center gap-3 text-[11px] min-w-145">
            <span className="px-2.5 py-1 rounded bg-stone-800 text-stone-200 border border-stone-700">
              Connected Agent
            </span>
            <span className="text-stone-500">→</span>
            <span className="px-2.5 py-1 rounded bg-stone-800 text-amber-300 border border-stone-700">
              Redacted Telemetry
            </span>
            <span className="text-stone-500">→</span>
            <span className="px-2.5 py-1 rounded bg-stone-800 text-blue-300 border border-stone-700">
              Steward Ingestion API
            </span>
            <span className="text-stone-500">→</span>
            <span className="px-2.5 py-1 rounded bg-stone-800 text-emerald-300 border border-stone-700">
              Human Operator
            </span>
          </div>
        </DragScroll>
      </div>

      {/* V1 Product Limitations */}
      <div className="p-5 rounded-xl bg-white border border-stone-200 space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-stone-500 font-mono">
          Steward V1 Product Scope & Limitations
        </h3>
        <ul className="list-disc pl-5 text-xs text-stone-600 space-y-1 leading-relaxed">
          <li>Node.js / TypeScript SDK only for V1.</li>
          <li>Process control is cooperative (requires checkpoint polling loops).</li>
          <li>Does not collect or store private model chain-of-thought.</li>
          <li>Guarded tool approval requests expire if not reviewed within configured timeouts.</li>
        </ul>
      </div>

      {/* Bottom Page Navigation */}
      <div className="pt-6 border-t border-stone-200 flex justify-end">
        <Link
          href="/docs/quickstart"
          className="p-3.5 rounded-xl border border-stone-200 bg-white hover:bg-stone-50 text-stone-800 text-xs font-medium transition-all"
        >
          <span className="text-[10px] text-stone-400 block uppercase font-mono">Next Guide</span>
          <span>Quickstart →</span>
        </Link>
      </div>
    </div>
  );
}
