"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
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
  const pathname = usePathname();
  const isLogin = pathname === "/login";
  const isRegister = pathname === "/register";

  return (
    <div className="min-h-screen bg-stone-warm text-stone-900 flex flex-col justify-between font-sans selection:bg-blue-100 selection:text-blue-900">
      {/* Top Header */}
      <header className="px-6 py-4 border-b border-stone-200/60 bg-stone-warm/90 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            <StewardLogo size="md" variant="dark" />
          </Link>

          <Link
            href="/"
            className="text-xs font-medium text-stone-600 hover:text-stone-900 transition-colors flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-stone-200/60"
          >
            ← Back to website
          </Link>
        </div>
      </header>

      {/* Main Two-Panel Layout */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 md:p-8">
        <div className="w-full max-w-4xl grid grid-cols-1 lg:grid-cols-12 rounded-2xl bg-white border border-stone-300/80 shadow-xl overflow-hidden my-auto">
          {/* Left Panel: Form Container */}
          <div className="lg:col-span-6 p-6 sm:p-10 flex flex-col justify-center border-b lg:border-b-0 lg:border-r border-stone-200">
            <div className="w-full max-w-md mx-auto space-y-6">
              {/* Auth Mode Toggle Pills */}
              {(isLogin || isRegister) && (
                <div className="flex p-1 bg-stone-100 rounded-xl border border-stone-200/80 text-xs font-medium">
                  <Link
                    href="/login"
                    className={`flex-1 py-2 text-center rounded-lg transition-all ${isLogin
                      ? "bg-white text-stone-900 font-bold shadow-xs border border-stone-200/60"
                      : "text-stone-500 hover:text-stone-800"
                      }`}
                  >
                    Sign in
                  </Link>
                  <Link
                    href="/register"
                    className={`flex-1 py-2 text-center rounded-lg transition-all ${isRegister
                      ? "bg-white text-stone-900 font-bold shadow-xs border border-stone-200/60"
                      : "text-stone-500 hover:text-stone-800"
                      }`}
                  >
                    Create account
                  </Link>
                </div>
              )}

              {/* Title & Subtitle Header */}
              <div className="space-y-1.5">
                <h1 className="text-2xl font-serif font-bold tracking-tight text-stone-900">
                  {title}
                </h1>
                <div className="text-xs text-stone-600 leading-relaxed">{subtitle}</div>
              </div>

              {children}
            </div>
          </div>

          {/* Right Panel: Product Proof Preview (Desktop Only) */}
          <div className="hidden lg:flex lg:col-span-6 bg-stone-950 text-stone-100 p-8 sm:p-10 flex-col justify-between relative overflow-hidden">
            {/* Subtle background ambient glow */}
            <div className="absolute inset-0 bg-grid-pattern opacity-20 pointer-events-none" />
            <div className="absolute -right-20 -top-20 w-64 h-64 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

            <div className="space-y-6 relative z-10">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-stone-900 border border-stone-800 text-xs font-mono text-stone-300 shadow-inner">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse-subtle" />
                <span>Human Approval Gate</span>
              </div>

              <div className="space-y-2">
                <h2 className="font-serif text-2xl text-white leading-snug">
                  Sensitive actions should wait for human judgment.
                </h2>
                <p className="text-xs text-stone-400 leading-relaxed">
                  Inspect the tool, review its parameters, and approve or reject execution without interrupting the run timeline.
                </p>
              </div>

              {/* Realistic Pending Approval Card Preview */}
              <div className="bg-stone-900/90 border border-stone-800 rounded-xl p-4 space-y-3 font-mono text-xs shadow-2xl backdrop-blur-xs">
                <div className="flex justify-between items-center pb-2.5 border-b border-stone-800">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-stone-100">aws.s3.delete_bucket</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30 uppercase font-bold">
                      HIGH RISK
                    </span>
                  </div>
                  <span className="text-[10px] font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
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
                    <pre className="mt-1.5 p-2.5 rounded bg-stone-950 text-stone-300 text-[10px] overflow-x-auto border border-stone-850">
                      {`{
  "bucket": "prod-backups-2026",
  "accessKey": "[REDACTED]"
}`}
                    </pre>
                  </div>
                </div>

                <div className="pt-2 flex gap-2">
                  <div className="w-1/2 py-2 text-center text-[11px] rounded bg-rose-950/70 border border-rose-800/80 text-rose-300 font-sans font-medium hover:bg-rose-900/80 transition-colors">
                    Reject Execution
                  </div>
                  <div className="w-1/2 py-2 text-center text-[11px] rounded bg-emerald-950/70 border border-emerald-800/80 text-emerald-300 font-sans font-medium hover:bg-emerald-900/80 transition-colors">
                    Approve Action
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Security Trust Badges */}
            <div className="relative z-10 pt-6 border-t border-stone-850 flex flex-wrap items-center gap-3 text-[11px] font-mono text-stone-400">
              <span className="flex items-center gap-1">
                <span className="text-emerald-400">✓</span> SHA-256 Key Hashing
              </span>
              <span className="flex items-center gap-1">
                <span className="text-emerald-400">✓</span> Zero Code Execution
              </span>
              <span className="flex items-center gap-1">
                <span className="text-emerald-400">✓</span> Telemetry Redaction
              </span>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-4 text-center text-xs text-stone-500 flex flex-wrap justify-center items-center gap-4">
        <span>© 2026 Steward. All rights reserved.</span>
        <div className="flex gap-4 text-stone-600">
          <Link href="/docs" className="hover:text-stone-900 transition-colors">Docs</Link>
          <Link href="/security" className="hover:text-stone-900 transition-colors">Security</Link>
          <Link href="/privacy" className="hover:text-stone-900 transition-colors">Privacy</Link>
          <Link href="/terms" className="hover:text-stone-900 transition-colors">Terms</Link>
        </div>
      </footer>
    </div>
  );
};
