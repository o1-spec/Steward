import React from "react";
import Link from "next/link";
import { StewardLogo } from "./StewardLogo";

interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle: React.ReactNode;
}

export const AuthLayout: React.FC<AuthLayoutProps> = ({
  children,
  title,
  subtitle,
}) => {
  return (
    <div className="min-h-screen bg-stone-warm text-stone-900 flex flex-col justify-between font-sans selection:bg-blue-100 selection:text-blue-900">
      {/* Top Brand Header */}
      <header className="px-6 py-5 border-b border-stone-200/80 bg-white/60 backdrop-blur-xs">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            <StewardLogo size="md" variant="dark" />
            <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-stone-200 text-stone-600 font-medium">
              V1
            </span>
          </Link>

          <Link
            href="/"
            className="text-xs font-medium text-stone-600 hover:text-stone-900 transition-colors flex items-center gap-1"
          >
            ← Back to product overview
          </Link>
        </div>
      </header>

      {/* Main Two-Column Layout */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 md:p-10">
        <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 rounded-2xl bg-white border border-stone-300/80 shadow-xl overflow-hidden">
          {/* Left Column: Auth Form Container */}
          <div className="lg:col-span-6 p-6 sm:p-10 flex flex-col justify-center border-b lg:border-b-0 lg:border-r border-stone-200">
            <div className="max-w-md mx-auto w-full space-y-6">
              <div className="space-y-2">
                <h1 className="text-2xl sm:text-3xl font-serif text-stone-900">
                  {title}
                </h1>
                <div className="text-sm text-stone-600">{subtitle}</div>
              </div>

              {children}
            </div>
          </div>

          {/* Right Column: Workflow Overview Preview (Desktop Only) */}
          <div className="hidden lg:flex lg:col-span-6 bg-stone-900 text-stone-100 p-8 sm:p-10 flex-col justify-between relative overflow-hidden">
            <div className="space-y-6 relative z-10">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-stone-800 border border-stone-700 text-xs font-mono text-stone-300">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <span>Supervision Workspace</span>
              </div>

              <blockquote className="space-y-3">
                <p className="font-serif text-2xl text-stone-100 leading-snug">
                  &ldquo;Put a human checkpoint between intention and action.&rdquo;
                </p>
                <footer className="text-xs font-mono text-stone-400">
                  Steward Agent Telemetry & Control Architecture
                </footer>
              </blockquote>

              <div className="space-y-3 pt-4 border-t border-stone-800">
                <div className="p-3 rounded-lg bg-stone-950 border border-stone-800 font-mono text-xs space-y-1">
                  <div className="flex justify-between text-stone-400">
                    <span>1. Telemetry</span>
                    <span className="text-blue-400">stream.connected</span>
                  </div>
                  <div className="text-stone-300">Live model & tool event timelines</div>
                </div>

                <div className="p-3 rounded-lg bg-stone-950 border border-amber-500/40 font-mono text-xs space-y-1">
                  <div className="flex justify-between text-stone-400">
                    <span>2. Human Gate</span>
                    <span className="text-amber-400">approval.requested</span>
                  </div>
                  <div className="text-stone-300">Hold high-risk execution until operator approves</div>
                </div>

                <div className="p-3 rounded-lg bg-stone-950 border border-stone-800 font-mono text-xs space-y-1">
                  <div className="flex justify-between text-stone-400">
                    <span>3. Audit Log</span>
                    <span className="text-emerald-400">redacted.persisted</span>
                  </div>
                  <div className="text-stone-300">SHA-256 keys & recursive payload redaction</div>
                </div>
              </div>
            </div>

            <div className="text-[11px] font-mono text-stone-500 relative z-10 pt-6">
              © 2026 Steward V1 Protocol • Multi-tenant Agent Control
            </div>
          </div>
        </div>
      </main>

      {/* Simple Footer */}
      <footer className="py-4 text-center text-xs text-stone-500">
        Steward V1 Security & Operational Workspaces
      </footer>
    </div>
  );
};
