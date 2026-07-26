"use client";

import React from "react";
import { ConnectionStatus, ConnectionState } from "./ConnectionStatus";

interface SidebarProps {
  connectionState: ConnectionState;
  projectName?: string;
  activeRunCount?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  connectionState,
  projectName = "Steward Demo",
  activeRunCount = 0,
}) => {
  return (
    <aside className="w-64 border-r border-slate-800 bg-slate-950/95 flex flex-col justify-between shrink-0 h-screen sticky top-0">
      <div>
        {/* Brand Header */}
        <div className="p-5 border-b border-slate-800/80 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-violet-600 to-purple-500 flex items-center justify-center shadow-lg shadow-indigo-500/20 ring-1 ring-white/20">
            <svg
              className="w-5 h-5 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
              />
            </svg>
          </div>
          <div>
            <h1 className="font-bold text-lg tracking-tight text-white flex items-center gap-1.5">
              Steward
              <span className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded font-mono bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                V1
              </span>
            </h1>
            <p className="text-xs text-slate-400">Supervision Workspace</p>
          </div>
        </div>

        {/* Project Selector */}
        <div className="px-4 py-4 border-b border-slate-800/60">
          <div className="text-[11px] font-medium uppercase tracking-wider text-slate-400 mb-1.5 px-2">
            Project
          </div>
          <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-slate-900/60 border border-slate-800 text-sm text-slate-200">
            <div className="flex items-center gap-2 truncate">
              <span className="w-2 h-2 rounded-full bg-indigo-400" />
              <span className="font-medium truncate">{projectName}</span>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="p-3 space-y-1">
          <a
            href="/runs"
            className="flex items-center justify-between px-3 py-2.5 rounded-lg bg-indigo-600/10 text-indigo-400 border border-indigo-500/20 font-medium text-sm transition-colors"
          >
            <div className="flex items-center gap-2.5">
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
              <span>Agent Runs</span>
            </div>
            {activeRunCount > 0 && (
              <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/20 text-indigo-300">
                {activeRunCount}
              </span>
            )}
          </a>
        </nav>
      </div>

      {/* Footer Connection Status */}
      <div className="p-4 border-t border-slate-800/80 bg-slate-950/40">
        <div className="flex items-center justify-between">
          <span className="text-xs text-slate-400 font-medium">Stream Status</span>
          <ConnectionStatus status={connectionState} />
        </div>
      </div>
    </aside>
  );
};
