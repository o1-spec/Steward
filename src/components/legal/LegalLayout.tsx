"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { StewardLogo } from "@/components/StewardLogo";
import { PageContainer } from "@/components/ui/Layout";
import { DocTocItem } from "@/components/docs/DocumentComponents";

export interface LegalLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
  effectiveDate?: string;
  lastUpdated?: string;
  toc?: DocTocItem[];
  activePath?: string;
}

export const LegalLayout: React.FC<LegalLayoutProps> = ({
  children,
  title,
  subtitle,
  effectiveDate = "2026-07-27",
  lastUpdated = "2026-07-27",
  toc = [],
  activePath = "/privacy",
}) => {
  const [activeTocId, setActiveTocId] = useState<string>("");

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
    <div className="min-h-screen bg-stone-warm text-stone-900 flex flex-col font-sans selection:bg-blue-100 selection:text-blue-900 print:bg-white print:text-black">
      {/* Top Public Header */}
      <header className="sticky top-0 z-40 bg-stone-warm/90 backdrop-blur-md border-b border-stone-200/80 print:hidden">
        <PageContainer>
          <div className="h-14 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <StewardLogo size="md" variant="dark" />
            </Link>

            <nav className="hidden md:flex items-center gap-6 text-xs font-medium text-stone-600">
              <Link href="/#how-it-works" className="hover:text-stone-900 transition-colors">
                How it works
              </Link>
              <Link href="/#features" className="hover:text-stone-900 transition-colors">
                Product
              </Link>
              <Link href="/docs" className="hover:text-stone-900 transition-colors">
                Docs
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
              <Link href="/" className="text-xs font-medium text-stone-600 hover:text-stone-900">
                ← Back to website
              </Link>
            </div>
          </div>
        </PageContainer>
      </header>

      {/* Main Single Narrow Content Column + Right TOC */}
      <main className="flex-1 py-10 sm:py-14">
        <PageContainer>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 max-w-5xl mx-auto">
            {/* Narrow Content Column */}
            <div className="col-span-1 lg:col-span-8 space-y-8 min-w-0">
              {/* Header Title & Dates */}
              <div className="border-b border-stone-200 pb-6 space-y-2">
                <div className="flex items-center justify-between text-xs font-mono text-stone-500">
                  <span>LEGAL SPECIFICATION</span>
                  <span>Effective: {effectiveDate} • Updated: {lastUpdated}</span>
                </div>
                <h1 className="text-3xl sm:text-4xl font-serif font-bold text-stone-900 leading-tight">
                  {title}
                </h1>
                {subtitle && <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">{subtitle}</p>}
              </div>

              {/* Body Content */}
              <div className="space-y-8">{children}</div>
            </div>

            {/* Right-Side On This Page TOC */}
            {toc.length > 0 && (
              <aside className="hidden lg:block lg:col-span-4 space-y-4 print:hidden">
                <div className="sticky top-24 space-y-3 text-xs">
                  <div className="font-mono font-bold uppercase tracking-wider text-[10px] text-stone-400">
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

      {/* Legal Footer */}
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
