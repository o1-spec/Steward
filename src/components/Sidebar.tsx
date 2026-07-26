"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { ConnectionStatus, ConnectionState } from "./ConnectionStatus";

interface ProjectItem {
  id: string;
  name: string;
  slug: string;
  role: string;
}

interface UserItem {
  id: string;
  name: string | null;
  email: string;
}

interface SidebarProps {
  connectionState?: ConnectionState;
  projectName?: string;
  activeRunCount?: number;
  pendingApprovalsCount?: number;
  onProjectChange?: (projectId: string) => void;
}

function setClientCookie(name: string, value: string) {
  if (typeof document !== "undefined") {
    document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=2592000; SameSite=Lax`;
  }
}

export const Sidebar: React.FC<SidebarProps> = ({
  connectionState = "connected",
  activeRunCount = 0,
  pendingApprovalsCount = 0,
  onProjectChange,
}) => {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<UserItem | null>(null);
  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => {
        if (res.status === 401) {
          router.push("/login");
          return null;
        }
        return res.json();
      })
      .then((data) => {
        if (data && data.user) {
          setUser(data.user);
          setProjects(data.projects || []);

          if (data.projects && data.projects.length > 0) {
            const initialId = data.projects[0].id;
            setActiveProjectId(initialId);
            setClientCookie("stwd_active_project", initialId);
          }
        }
      })
      .catch(() => {});
  }, [router]);

  const handleSelectProject = (project: ProjectItem) => {
    setActiveProjectId(project.id);
    setClientCookie("stwd_active_project", project.id);
    setIsDropdownOpen(false);
    if (onProjectChange) {
      onProjectChange(project.id);
    } else {
      router.refresh();
    }
  };

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  };

  const activeProject = projects.find((p) => p.id === activeProjectId) || projects[0];

  return (
    <aside className="w-64 border-r border-slate-800 bg-slate-950/95 flex flex-col justify-between shrink-0 h-screen sticky top-0 z-30">
      <div>
        {/* Brand Header */}
        <div className="p-5 border-b border-slate-800/80 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-linear-to-tr from-indigo-600 via-violet-600 to-purple-500 flex items-center justify-center shadow-lg shadow-indigo-500/20 ring-1 ring-white/20">
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

        {/* Project Selector Dropdown */}
        <div className="px-4 py-4 border-b border-slate-800/60 relative">
          <div className="text-[11px] font-medium uppercase tracking-wider text-slate-400 mb-1.5 px-2">
            Active Project
          </div>
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="w-full flex items-center justify-between px-3 py-2 rounded-lg bg-slate-900/80 border border-slate-800 hover:border-slate-700 text-sm text-slate-200 transition-all text-left"
          >
            <div className="flex items-center gap-2 truncate">
              <span className="w-2 h-2 rounded-full bg-purple-400" />
              <span className="font-medium truncate">{activeProject ? activeProject.name : "Select Project..."}</span>
            </div>
            <svg className={`w-4 h-4 text-slate-400 transition-transform ${isDropdownOpen ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {isDropdownOpen && (
            <div className="absolute left-4 right-4 top-full mt-1 z-50 bg-slate-900 rounded-xl border border-slate-800 shadow-2xl py-1 divide-y divide-slate-800/60 max-h-48 overflow-y-auto">
              {projects.map((p) => (
                <button
                  key={p.id}
                  onClick={() => handleSelectProject(p)}
                  className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-purple-600/10 transition-colors ${p.id === activeProjectId ? "text-purple-300 font-semibold bg-purple-500/10" : "text-slate-300"
                    }`}
                >
                  <span className="truncate">{p.name}</span>
                  <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 shrink-0">
                    {p.role}
                  </span>
                </button>
              ))}

              <Link
                href="/onboarding"
                onClick={() => setIsDropdownOpen(false)}
                className="block w-full text-left px-3 py-2 text-xs text-purple-400 hover:text-purple-300 hover:bg-slate-800/50 font-medium"
              >
                + Create New Project
              </Link>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="p-3 space-y-1">
          <Link
            href="/runs"
            className={`flex items-center justify-between px-3 py-2.5 rounded-lg font-medium text-sm transition-colors ${pathname === "/runs" ? "bg-purple-600/15 text-purple-300 border border-purple-500/20" : "text-slate-300 hover:bg-slate-900"
              }`}
          >
            <div className="flex items-center gap-2.5">
              <svg className="w-4 h-4 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <span>Agent Runs</span>
            </div>
            {activeRunCount > 0 && (
              <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/20 text-indigo-300">
                {activeRunCount}
              </span>
            )}
          </Link>

          <Link
            href="/approvals"
            className={`flex items-center justify-between px-3 py-2.5 rounded-lg font-medium text-sm transition-colors ${pathname === "/approvals" ? "bg-purple-600/15 text-purple-300 border border-purple-500/20" : "text-slate-300 hover:bg-slate-900"
              }`}
          >
            <div className="flex items-center gap-2.5">
              <svg className="w-4 h-4 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              <span>Approvals Inbox</span>
            </div>
            {pendingApprovalsCount > 0 && (
              <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-300">
                {pendingApprovalsCount}
              </span>
            )}
          </Link>

          {activeProject && (
            <Link
              href={`/projects/${activeProject.id}/settings/api-keys`}
              className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg font-medium text-sm transition-colors ${pathname?.includes("/settings/api-keys") ? "bg-purple-600/15 text-purple-300 border border-purple-500/20" : "text-slate-300 hover:bg-slate-900"
                }`}
            >
              <svg className="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 0121 9z" />
              </svg>
              <span>API Keys Settings</span>
            </Link>
          )}
        </nav>
      </div>

      {/* Footer User Profile & Connection Status */}
      <div className="border-t border-slate-800/80 bg-slate-950/40 divide-y divide-slate-800/60">
        {user && (
          <div className="p-4 flex items-center justify-between gap-2">
            <div className="truncate">
              <div className="text-xs font-semibold text-white truncate">{user.name || user.email}</div>
              <div className="text-[10px] text-slate-400 truncate">{user.email}</div>
            </div>
            <button
              onClick={handleLogout}
              title="Sign out"
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
        )}

        <div className="p-4 flex items-center justify-between">
          <span className="text-xs text-slate-400 font-medium">Stream Status</span>
          <ConnectionStatus status={connectionState} />
        </div>
      </div>
    </aside>
  );
};
