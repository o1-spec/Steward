"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { ConnectionStatus, ConnectionState } from "./ConnectionStatus";
import { StewardLogo } from "./StewardLogo";

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
    <aside className="w-64 border-r border-slate-800 bg-slate-950 flex flex-col justify-between shrink-0 h-screen sticky top-0 z-30 font-sans text-slate-200">
      <div>
        {/* Brand Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            <StewardLogo size="sm" variant="light" />
            <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-medium">
              V1
            </span>
          </Link>
          <span className="text-[10px] text-slate-500 uppercase font-mono">Workspace</span>
        </div>

        {/* Project Selector Dropdown */}
        <div className="px-3 py-3 border-b border-slate-800/80 relative">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1 px-1">
            Active Project
          </div>
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="w-full flex items-center justify-between px-3 py-2 rounded-md bg-slate-900 border border-slate-800 hover:border-slate-700 text-xs text-slate-200 transition-all text-left"
          >
            <div className="flex items-center gap-2 truncate">
              <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0" />
              <span className="font-mono font-medium truncate">
                {activeProject ? activeProject.name : "Select Project..."}
              </span>
            </div>
            <svg
              className={`w-3.5 h-3.5 text-slate-400 transition-transform ${isDropdownOpen ? "rotate-180" : ""}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {isDropdownOpen && (
            <div className="absolute left-3 right-3 top-full mt-1 z-50 bg-slate-900 rounded-lg border border-slate-800 shadow-xl py-1 divide-y divide-slate-800/60 max-h-52 overflow-y-auto">
              {projects.map((p) => (
                <button
                  key={p.id}
                  onClick={() => handleSelectProject(p)}
                  className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-slate-800 transition-colors ${
                    p.id === activeProjectId ? "text-blue-400 font-semibold bg-blue-500/10" : "text-slate-300"
                  }`}
                >
                  <span className="truncate font-mono">{p.name}</span>
                  <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 shrink-0">
                    {p.role}
                  </span>
                </button>
              ))}

              <Link
                href="/onboarding"
                onClick={() => setIsDropdownOpen(false)}
                className="block w-full text-left px-3 py-2 text-xs text-blue-400 hover:bg-slate-800 font-medium"
              >
                + Create New Project
              </Link>
            </div>
          )}
        </div>

        {/* Navigation Section */}
        <nav className="p-2 space-y-0.5">
          <Link
            href="/runs"
            className={`flex items-center justify-between px-3 py-2 rounded-md font-medium text-xs transition-colors ${
              pathname === "/runs"
                ? "bg-blue-600/15 text-blue-400 border border-blue-500/20"
                : "text-slate-300 hover:bg-slate-900 hover:text-white"
            }`}
          >
            <div className="flex items-center gap-2.5">
              <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <span>Agent Runs</span>
            </div>
            {activeRunCount > 0 && (
              <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold bg-blue-500/20 text-blue-300">
                {activeRunCount}
              </span>
            )}
          </Link>

          <Link
            href="/approvals"
            className={`flex items-center justify-between px-3 py-2 rounded-md font-medium text-xs transition-colors ${
              pathname === "/approvals"
                ? "bg-amber-500/15 text-amber-300 border border-amber-500/20"
                : "text-slate-300 hover:bg-slate-900 hover:text-white"
            }`}
          >
            <div className="flex items-center gap-2.5">
              <svg className="w-4 h-4 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              <span>Approvals Inbox</span>
            </div>
            {pendingApprovalsCount > 0 && (
              <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold bg-amber-500/20 text-amber-300">
                {pendingApprovalsCount}
              </span>
            )}
          </Link>

          {activeProject && (
            <Link
              href={`/projects/${activeProject.id}/settings/api-keys`}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-md font-medium text-xs transition-colors ${
                pathname?.includes("/settings/api-keys")
                  ? "bg-blue-600/15 text-blue-400 border border-blue-500/20"
                  : "text-slate-300 hover:bg-slate-900 hover:text-white"
              }`}
            >
              <svg className="w-4 h-4 text-stone-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 0121 9z" />
              </svg>
              <span>API Keys & Settings</span>
            </Link>
          )}
        </nav>
      </div>

      {/* Footer User Profile & Connection Status */}
      <div className="border-t border-slate-800 bg-slate-950/60 divide-y divide-slate-800/80">
        {user && (
          <div className="p-3 flex items-center justify-between gap-2">
            <div className="truncate">
              <div className="text-xs font-medium text-slate-200 truncate">{user.name || user.email}</div>
              <div className="text-[10px] text-slate-500 truncate font-mono">{user.email}</div>
            </div>
            <button
              onClick={handleLogout}
              title="Sign out"
              aria-label="Sign out of Steward"
              className="p-1 rounded text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
        )}

        <div className="px-3 py-2.5 flex items-center justify-between">
          <span className="text-[11px] text-slate-400 font-mono">SSE Stream</span>
          <ConnectionStatus status={connectionState} />
        </div>
      </div>
    </aside>
  );
};
