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
      {/* Top Header */}
      <header className="px-6 py-4 border-b border-stone-200/60 bg-stone-warm">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            <StewardLogo size="md" variant="dark" />
          </Link>

          <Link
            href="/"
            className="text-xs font-medium text-stone-600 hover:text-stone-900 transition-colors flex items-center gap-1"
          >
            ← Back to Steward
          </Link>
        </div>
      </header>

      {/* Main Two-Panel Layout */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 md:p-8">
        <div className="w-full max-w-4xl grid grid-cols-1 lg:grid-cols-12 rounded-2xl bg-white border border-stone-300/80 shadow-md overflow-hidden my-auto">
          {/* Left Panel: Form Container */}
          <div className="lg:col-span-6 p-6 sm:p-10 flex flex-col justify-center border-b lg:border-b-0 lg:border-r border-stone-200">
            <div className="w-full max-w-105 mx-auto space-y-6">
              <div className="space-y-1.5">
                <h1 className="text-2xl font-semibold tracking-tight text-stone-900">
                  {title}
                </h1>
                <div className="text-xs text-stone-600 leading-relaxed">{subtitle}</div>
              </div>

              {children}
            </div>
          </div>

          {/* Right Panel: Product Proof Preview (Desktop Only) */}
          <div className="hidden lg:flex lg:col-span-6 bg-stone-900 text-stone-100 p-8 sm:p-10 flex-col justify-between relative overflow-hidden">
            <div className="space-y-6 relative z-10">
              <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-stone-800 border border-stone-700 text-xs font-mono text-stone-300">
                <span className="w-2 h-2 rounded-full bg-amber-400" />
                <span>Human Approval Gate</span>
              </div>

              <div className="space-y-2">
                <h2 className="font-serif text-2xl text-white leading-tight">
                  Sensitive actions should wait for human judgment.
                </h2>
                <p className="text-xs text-stone-400 leading-relaxed">
                  Review the tool, inspect its arguments, and approve or reject execution without leaving the run.
                </p>
              </div>

              {/* Realistic Pending Approval Card Preview */}
              <div className="bg-stone-950 border border-stone-800 rounded-xl p-4 space-y-3 font-mono text-xs shadow-lg">
                <div className="flex justify-between items-center pb-2 border-b border-stone-800/80">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-stone-100">aws.s3.delete_bucket</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30 uppercase">
                      HIGH RISK
                    </span>
                  </div>
                  <span className="text-[11px] text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                    PENDING
                  </span>
                </div>

                <div className="space-y-1 text-[11px]">
                  <div className="text-stone-400">
                    Agent: <span className="text-stone-200">cleanup-worker-01</span>
                  </div>
                  <div className="text-stone-400">
                    Target: <span className="text-stone-200">s3://prod-backups-2026</span>
                  </div>
                  <div className="text-stone-400 pt-1">
                    Redacted Payload:
                    <pre className="mt-1 p-2 rounded bg-stone-900 text-stone-300 text-[10px] overflow-x-auto">
                      {`{
  "bucket": "prod-backups-2026",
  "accessKey": "[REDACTED]"
}`}
                    </pre>
                  </div>
                </div>

                <div className="pt-2 flex gap-2">
                  <div className="w-1/2 py-1.5 text-center text-[11px] rounded bg-rose-950/60 border border-rose-800/60 text-rose-300 font-sans font-medium">
                    Reject
                  </div>
                  <div className="w-1/2 py-1.5 text-center text-[11px] rounded bg-emerald-950/60 border border-emerald-800/60 text-emerald-300 font-sans font-medium">
                    Approve
                  </div>
                </div>
              </div>
            </div>

            <div className="text-[11px] font-mono text-stone-500 relative z-10 pt-4">
              Steward Autonomous Agent Supervision
            </div>
          </div>
        </div>
      </main>

      <footer className="py-4 text-center text-xs text-stone-600">
        © 2026 Steward. All rights reserved.
      </footer>
    </div>
  );
};
