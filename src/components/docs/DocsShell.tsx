"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { StewardLogo } from "@/components/StewardLogo";

export interface DocsNavGroup {
  title: string;
  items: { label: string; href: string }[];
}

export const DOCS_NAV_GROUPS: DocsNavGroup[] = [
  {
    title: "GETTING STARTED",
    items: [
      { label: "Introduction", href: "/docs" },
      { label: "Quickstart", href: "/docs/quickstart" },
    ],
  },
  {
    title: "CORE CONCEPTS",
    items: [
      { label: "Event Protocol", href: "/docs/events" },
    ],
  },
  {
    title: "HUMAN SUPERVISION",
    items: [
      { label: "Approval Gates", href: "/docs/approvals" },
      { label: "Cooperative Controls", href: "/docs/controls" },
    ],
  },
  {
    title: "REFERENCE",
    items: [
      { label: "Node.js SDK", href: "/docs/sdk" },
      { label: "HTTP API", href: "/docs/http-api" },
      { label: "Redaction & Security", href: "/docs/security" },
    ],
  },
  {
    title: "RESOURCES",
    items: [
      { label: "Troubleshooting", href: "/docs/troubleshooting" },
      { label: "Privacy Policy", href: "/privacy" },
      { label: "Terms of Service", href: "/terms" },
      { label: "← Back to Steward", href: "/" },
    ],
  },
];

export const DocsShell: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const pathname = usePathname();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <div className="min-h-screen bg-stone-warm text-stone-900 flex flex-col font-sans selection:bg-blue-100 selection:text-blue-900">
      {/* Skip to main content link for keyboard accessibility */}
      <a
        href="#docs-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:px-4 focus:py-2 focus:bg-stone-900 focus:text-white focus:rounded-lg focus:shadow-lg focus:text-xs"
      >
        Skip to main content
      </a>

      {/* Docs Dedicated Header */}
      <header className="sticky top-0 z-40 bg-stone-warm/90 backdrop-blur-md border-b border-stone-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2 group">
              <StewardLogo size="md" variant="dark" />
            </Link>
            <span className="bg-stone-200/90 text-stone-900 font-mono text-[11px] font-bold px-2 py-0.5 rounded border border-stone-300/80">
              Docs
            </span>
          </div>

          <div className="flex items-center gap-3">
            <Link href="/login" className="hidden sm:inline text-xs font-medium text-stone-600 hover:text-stone-900 px-2 py-1 transition-colors">
              Sign in
            </Link>
            <Link href="/runs" className="text-xs font-medium text-blue-600 hover:text-blue-700">
              Dashboard →
            </Link>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileNavOpen(!mobileNavOpen)}
              aria-label="Toggle documentation navigation"
              aria-expanded={mobileNavOpen}
              className="lg:hidden p-1.5 rounded-lg text-stone-700 hover:bg-stone-200/60"
            >
              {mobileNavOpen ? (
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
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileNavOpen && (
          <div className="lg:hidden border-b border-stone-200 bg-stone-warm px-4 py-4 space-y-4 text-xs">
            {DOCS_NAV_GROUPS.map((group) => (
              <div key={group.title} className="space-y-1.5">
                <div className="font-mono text-[10px] font-bold uppercase text-stone-400 tracking-wider">
                  {group.title}
                </div>
                <div className="space-y-1 pl-2">
                  {group.items.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setMobileNavOpen(false)}
                        className={`block py-1 px-2 rounded transition-colors ${isActive
                            ? "bg-stone-200/80 text-stone-900 font-bold"
                            : "text-stone-600 hover:text-stone-900"
                          }`}
                      >
                        {item.label}
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </header>

      {/* Main Documentation Body */}
      <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-8 flex gap-8">
        {/* Left Sidebar (Desktop Only) */}
        <aside className="hidden lg:block w-64 shrink-0 space-y-6">
          <nav className="sticky top-20 space-y-5 text-xs">
            {DOCS_NAV_GROUPS.map((group) => (
              <div key={group.title} className="space-y-2">
                <div className="font-mono text-[10px] font-bold uppercase text-stone-400 tracking-wider px-2">
                  {group.title}
                </div>
                <div className="space-y-0.5 flex flex-col">
                  {group.items.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={`px-2.5 py-1.5 rounded-lg transition-colors font-medium ${isActive
                            ? "bg-stone-200/90 text-stone-950 font-bold border border-stone-300/60"
                            : "text-stone-600 hover:text-stone-900 hover:bg-stone-200/40"
                          }`}
                      >
                        {item.label}
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>
        </aside>

        {/* Content Column */}
        <main id="docs-content" className="flex-1 min-w-0 max-w-3xl">
          {children}
        </main>
      </div>

      {/* Docs Footer */}
      <footer className="border-t border-stone-200 py-6 bg-stone-warm text-xs text-stone-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <span>© 2026 Steward. All rights reserved.</span>
          <div className="flex gap-4">
            <Link href="/privacy" className="hover:text-stone-900 transition-colors">Privacy</Link>
            <Link href="/terms" className="hover:text-stone-900 transition-colors">Terms</Link>
            <Link href="/" className="hover:text-stone-900 transition-colors">Website</Link>
          </div>
        </div>
      </footer>
    </div>
  );
};
