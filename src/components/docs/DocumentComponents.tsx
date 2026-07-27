"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { StewardLogo } from "@/components/StewardLogo";
import { PageContainer } from "@/components/ui/Layout";
import { DragScroll } from "@/components/ui/DragScroll";

export interface DocTocItem {
  id: string;
  title: string;
}

export interface PublicDocumentLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
  lastUpdated?: string;
  toc?: DocTocItem[];
  prevLink?: { title: string; href: string };
  nextLink?: { title: string; href: string };
  activePath?: string;
}

export const InlineCode: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <code className="bg-stone-200/80 text-stone-900 px-1.5 py-0.5 rounded font-mono text-xs border border-stone-300/60 font-medium">
    {children}
  </code>
);

export const DocumentCallout: React.FC<{
  type?: "note" | "tip" | "important" | "warning";
  title?: string;
  children: React.ReactNode;
}> = ({ type = "note", title, children }) => {
  const styles = {
    note: "bg-blue-50/80 border-blue-200 text-blue-900",
    tip: "bg-emerald-50/80 border-emerald-200 text-emerald-900",
    important: "bg-amber-50/80 border-amber-200 text-amber-950",
    warning: "bg-rose-50/80 border-rose-200 text-rose-950",
  }[type];

  const icons = {
    note: "ℹ️",
    tip: "💡",
    important: "⚠️",
    warning: "🛑",
  }[type];

  return (
    <div className={`p-4 rounded-xl border ${styles} space-y-1 my-4 text-xs sm:text-sm`}>
      <div className="flex items-center gap-2 font-bold font-sans">
        <span>{icons}</span>
        <span>{title || type.toUpperCase()}</span>
      </div>
      <div className="leading-relaxed">{children}</div>
    </div>
  );
};

export const CodeBlock: React.FC<{
  code: string;
  language?: string;
  title?: string;
}> = ({ code, language = "ts", title }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="my-4 rounded-xl bg-stone-950 text-stone-200 border border-stone-800 overflow-hidden text-xs font-mono shadow-sm">
      <div className="bg-stone-900/90 px-4 py-2 border-b border-stone-800 flex items-center justify-between text-[11px] text-stone-400">
        <span>{title || language}</span>
        <button
          onClick={handleCopy}
          aria-label="Copy code block to clipboard"
          className="hover:text-stone-100 font-sans transition-colors flex items-center gap-1"
        >
          {copied ? "✓ Copied" : "Copy"}
        </button>
      </div>
      <DragScroll className="p-4 overflow-x-auto">
        <pre className="text-stone-300 leading-relaxed font-mono">{code}</pre>
      </DragScroll>
    </div>
  );
};

export const DocumentSection: React.FC<{
  id: string;
  title: string;
  children: React.ReactNode;
}> = ({ id, title, children }) => {
  return (
    <section id={id} className="scroll-mt-20 space-y-3 pb-8 border-b border-stone-200/80 last:border-b-0">
      <h2 className="group text-xl sm:text-2xl font-serif font-bold text-stone-900 tracking-tight pt-2 flex items-center gap-2">
        <span>{title}</span>
        <a
          href={`#${id}`}
          aria-label={`Link to section ${title}`}
          className="opacity-0 group-hover:opacity-100 text-stone-400 hover:text-stone-700 text-base font-sans transition-opacity"
        >
          #
        </a>
      </h2>
      <div className="space-y-4 text-xs sm:text-sm text-stone-700 leading-relaxed">{children}</div>
    </section>
  );
};

export const PublicDocumentLayout: React.FC<PublicDocumentLayoutProps> = ({
  children,
  title,
  subtitle,
  lastUpdated = "2026-07-27",
  toc = [],
  prevLink,
  nextLink,
  activePath = "/docs",
}) => {
  const [activeTocId, setActiveTocId] = useState<string>("");
  const [mobileTocOpen, setMobileTocOpen] = useState(false);

  useEffect(() => {
    if (toc.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveTocId(entry.target.id);
          }
        });
      },
      { rootMargin: "-80px 0px -60% 0px", threshold: 0.1 }
    );

    toc.forEach((item) => {
      const el = document.getElementById(item.id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [toc]);

  return (
    <div className="min-h-screen bg-stone-warm text-stone-900 flex flex-col font-sans selection:bg-blue-100 selection:text-blue-900">
      {/* Skip to main content link for keyboard accessibility */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:px-4 focus:py-2 focus:bg-stone-900 focus:text-white focus:rounded-lg focus:shadow-lg focus:text-xs"
      >
        Skip to main content
      </a>

      {/* Top Header Navigation */}
      <header className="sticky top-0 z-40 bg-stone-warm/90 backdrop-blur-md border-b border-stone-200/80 print:hidden">
        <PageContainer>
          <div className="h-14 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <StewardLogo size="md" variant="dark" />
            </Link>

            <nav className="hidden md:flex items-center gap-6 text-xs font-medium text-stone-600">
              <Link
                href="/docs"
                className={activePath === "/docs" ? "text-stone-900 font-bold" : "hover:text-stone-900"}
              >
                Docs
              </Link>
              <Link
                href="/security"
                className={activePath === "/security" ? "text-stone-900 font-bold" : "hover:text-stone-900"}
              >
                Security
              </Link>
              <Link
                href="/privacy"
                className={activePath === "/privacy" ? "text-stone-900 font-bold" : "hover:text-stone-900"}
              >
                Privacy
              </Link>
              <Link
                href="/terms"
                className={activePath === "/terms" ? "text-stone-900 font-bold" : "hover:text-stone-900"}
              >
                Terms
              </Link>
            </nav>

            <div className="flex items-center gap-3">
              <Link href="/runs" className="text-xs font-medium text-blue-600 hover:text-blue-700">
                Dashboard →
              </Link>
            </div>
          </div>
        </PageContainer>
      </header>

      {/* Main Grid Layout */}
      <main id="main-content" className="flex-1 py-8 sm:py-12">
        <PageContainer>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left Documentation Sidebar (Desktop) */}
            <aside className="hidden lg:block lg:col-span-3 space-y-6 print:hidden">
              <div className="sticky top-20 space-y-4 text-xs font-medium text-stone-600">
                <div className="font-semibold uppercase tracking-wider text-[11px] text-stone-400">
                  Navigation
                </div>
                <div className="space-y-1.5 flex flex-col">
                  <Link
                    href="/docs"
                    className={`px-2.5 py-1.5 rounded-lg transition-colors ${activePath === "/docs"
                      ? "bg-stone-200/80 text-stone-900 font-bold"
                      : "hover:bg-stone-100 text-stone-600"
                      }`}
                  >
                    Documentation
                  </Link>
                  <Link
                    href="/security"
                    className={`px-2.5 py-1.5 rounded-lg transition-colors ${activePath === "/security"
                      ? "bg-stone-200/80 text-stone-900 font-bold"
                      : "hover:bg-stone-100 text-stone-600"
                      }`}
                  >
                    Security Overview
                  </Link>
                  <Link
                    href="/privacy"
                    className={`px-2.5 py-1.5 rounded-lg transition-colors ${activePath === "/privacy"
                      ? "bg-stone-200/80 text-stone-900 font-bold"
                      : "hover:bg-stone-100 text-stone-600"
                      }`}
                  >
                    Privacy Policy
                  </Link>
                  <Link
                    href="/terms"
                    className={`px-2.5 py-1.5 rounded-lg transition-colors ${activePath === "/terms"
                      ? "bg-stone-200/80 text-stone-900 font-bold"
                      : "hover:bg-stone-100 text-stone-600"
                      }`}
                  >
                    Terms of Service
                  </Link>
                </div>
              </div>
            </aside>

            {/* Central Readable Content Region */}
            <div className="col-span-1 lg:col-span-6 space-y-8 min-w-0">
              {/* Header metadata */}
              <div className="border-b border-stone-200 pb-6 space-y-2">
                <div className="flex items-center justify-between text-xs text-stone-500 font-mono">
                  <span>STEWARD SPECIFICATION</span>
                  <span>Effective: {lastUpdated}</span>
                </div>
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-serif font-bold text-stone-900 leading-tight">
                  {title}
                </h1>
                {subtitle && <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">{subtitle}</p>}
              </div>

              {/* Mobile Table of Contents Toggle */}
              {toc.length > 0 && (
                <div className="lg:hidden border border-stone-200 rounded-xl bg-white p-3 print:hidden">
                  <button
                    onClick={() => setMobileTocOpen(!mobileTocOpen)}
                    className="w-full flex items-center justify-between text-xs font-semibold text-stone-800"
                  >
                    <span>On this page ({toc.length} sections)</span>
                    <span>{mobileTocOpen ? "▲" : "▼"}</span>
                  </button>
                  {mobileTocOpen && (
                    <div className="mt-3 pt-3 border-t border-stone-100 space-y-2 text-xs">
                      {toc.map((item) => (
                        <a
                          key={item.id}
                          href={`#${item.id}`}
                          onClick={() => setMobileTocOpen(false)}
                          className="block text-stone-600 hover:text-stone-900"
                        >
                          {item.title}
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Document Body */}
              <div className="space-y-8">{children}</div>

              {/* Previous / Next Navigation */}
              {(prevLink || nextLink) && (
                <div className="pt-8 border-t border-stone-200 flex justify-between gap-4 text-xs font-medium print:hidden">
                  {prevLink ? (
                    <Link
                      href={prevLink.href}
                      className="p-3 rounded-lg border border-stone-200 bg-white hover:bg-stone-50 text-stone-700 transition-colors flex-1"
                    >
                      <span className="text-[10px] text-stone-400 block uppercase font-mono">Previous</span>
                      <span>← {prevLink.title}</span>
                    </Link>
                  ) : (
                    <div />
                  )}
                  {nextLink && (
                    <Link
                      href={nextLink.href}
                      className="p-3 rounded-lg border border-stone-200 bg-white hover:bg-stone-50 text-stone-700 transition-colors text-right flex-1"
                    >
                      <span className="text-[10px] text-stone-400 block uppercase font-mono">Next</span>
                      <span>{nextLink.title} →</span>
                    </Link>
                  )}
                </div>
              )}
            </div>

            {/* Right-Side Table of Contents (Desktop Only) */}
            {toc.length > 0 && (
              <aside className="hidden lg:block lg:col-span-3 space-y-4 print:hidden">
                <div className="sticky top-20 space-y-3 text-xs">
                  <div className="font-semibold uppercase tracking-wider text-[11px] text-stone-400">
                    On this page
                  </div>
                  <nav className="space-y-1.5 flex flex-col border-l border-stone-200 pl-3">
                    {toc.map((item) => (
                      <a
                        key={item.id}
                        href={`#${item.id}`}
                        className={`transition-colors truncate ${activeTocId === item.id
                          ? "text-blue-600 font-bold -ml-3.25 border-l-2 border-blue-600 pl-2.5"
                          : "text-stone-500 hover:text-stone-900"
                          }`}
                      >
                        {item.title}
                      </a>
                    ))}
                  </nav>
                </div>
              </aside>
            )}
          </div>
        </PageContainer>
      </main>

      {/* Footer */}
      <footer className="bg-stone-950 text-stone-400 text-xs border-t border-stone-800 py-8 print:bg-white print:text-black print:border-stone-200">
        <PageContainer>
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <StewardLogo size="sm" variant="light" />
              <span>© 2026 Steward. All rights reserved.</span>
            </div>

            <div className="flex items-center gap-6 font-medium text-stone-400 print:hidden">
              <Link href="/docs" className="hover:text-white transition-colors">
                Docs
              </Link>
              <Link href="/security" className="hover:text-white transition-colors">
                Security
              </Link>
              <Link href="/privacy" className="hover:text-white transition-colors">
                Privacy
              </Link>
              <Link href="/terms" className="hover:text-white transition-colors">
                Terms
              </Link>
            </div>
          </div>
        </PageContainer>
      </footer>
    </div>
  );
};
