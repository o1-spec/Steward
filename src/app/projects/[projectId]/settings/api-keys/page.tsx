"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";

interface ApiKeyRecord {
  id: string;
  name: string;
  keyPrefix: string;
  lastUsedAt: string | null;
  revokedAt: string | null;
  createdAt: string;
}

export default function ApiKeysSettingsPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = use(params);

  const [apiKeys, setApiKeys] = useState<ApiKeyRecord[]>([]);
  const [userRole, setUserRole] = useState<string>("MEMBER");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // New Key creation state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newKeyName, setNewKeyName] = useState("");
  const [creating, setCreating] = useState(false);

  // Secret key display modal (shown ONCE)
  const [createdSecretKey, setCreatedSecretKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Revoke confirmation modal
  const [keyToRevoke, setKeyToRevoke] = useState<ApiKeyRecord | null>(null);
  const [revoking, setRevoking] = useState(false);

  const fetchKeys = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/api-keys`);
      if (!res.ok) {
        throw new Error("Failed to load project API keys");
      }
      const data = await res.json();
      setApiKeys(data.apiKeys || []);
      setUserRole(data.userRole || "MEMBER");
    } catch (err: unknown) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let ignore = false;
    async function load() {
      try {
        const res = await fetch(`/api/projects/${projectId}/api-keys`);
        if (!res.ok) throw new Error("Failed to load project API keys");
        const data = await res.json();
        if (!ignore) {
          setApiKeys(data.apiKeys || []);
          setUserRole(data.userRole || "MEMBER");
        }
      } catch (err: unknown) {
        if (!ignore) setError((err as Error).message);
      } finally {
        if (!ignore) setLoading(false);
      }
    }
    load();
    return () => {
      ignore = true;
    };
  }, [projectId]);

  const handleCreateKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKeyName.trim()) return;

    setCreating(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/api-keys`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newKeyName.trim() }),
      });

      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Failed to create API key");
        setCreating(false);
        return;
      }

      setShowCreateModal(false);
      setNewKeyName("");
      setCreatedSecretKey(data.apiKey.secretKey);
      fetchKeys();
    } catch {
      alert("Failed to create API key due to network error");
    } finally {
      setCreating(false);
    }
  };

  const handleRevokeKey = async () => {
    if (!keyToRevoke) return;

    setRevoking(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/api-keys/${keyToRevoke.id}/revoke`, {
        method: "POST",
      });

      if (!res.ok) {
        const data = await res.json();
        alert(data.error || "Failed to revoke API key");
        setRevoking(false);
        return;
      }

      setKeyToRevoke(null);
      fetchKeys();
    } catch {
      alert("Failed to revoke API key");
    } finally {
      setRevoking(false);
    }
  };

  const isOwner = userRole === "OWNER";

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 sm:p-10 selection:bg-purple-500 selection:text-white">
      <div className="max-w-5xl mx-auto">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 mb-6">
          <Link href="/runs" className="hover:text-white transition-colors">
            Runs
          </Link>
          <span>/</span>
          <span className="text-purple-400">API Keys</span>
        </div>

        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight">Project API Keys</h1>
            <p className="text-sm text-slate-400 mt-1">
              Manage secret keys used by autonomous agents to authenticate with Steward telemetry APIs.
            </p>
          </div>

          {isOwner && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="py-2.5 px-5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-sm shadow-lg shadow-purple-600/25 transition-all shrink-0"
            >
              + Create New API Key
            </button>
          )}
        </div>

        {/* ONCE-SHOWN SECRET KEY MODAL/BANNER */}
        {createdSecretKey && (
          <div className="mb-8 p-6 rounded-2xl bg-slate-900 border border-emerald-500/40 shadow-xl relative overflow-hidden">
            <div className="flex items-start justify-between gap-4 mb-3">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold mb-2">
                  ✓ Secret API Key Generated
                </div>
                <h3 className="text-lg font-bold text-white">Save your secret key now</h3>
                <p className="text-xs text-slate-400">
                  This key will <strong className="text-slate-200">NEVER</strong> be displayed again. If you lose it, you will need to revoke it and create a new one.
                </p>
              </div>
              <button
                onClick={() => setCreatedSecretKey(null)}
                className="text-slate-400 hover:text-white text-xs p-1"
              >
                ✕ Close
              </button>
            </div>

            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-4">
              <code className="text-sm font-mono text-purple-300 break-all select-all">
                {createdSecretKey}
              </code>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(createdSecretKey);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                }}
                className="shrink-0 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition-colors"
              >
                {copied ? "Copied to Clipboard! ✓" : "Copy Key"}
              </button>
            </div>
          </div>
        )}

        {/* API Keys Table */}
        <div className="bg-slate-900/80 backdrop-blur-xl rounded-2xl border border-slate-800 shadow-xl overflow-hidden">
          {loading ? (
            <div className="p-12 text-center text-sm text-slate-400">Loading API keys...</div>
          ) : error ? (
            <div className="p-12 text-center text-sm text-rose-400">{error}</div>
          ) : apiKeys.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-12 h-12 bg-slate-800 text-slate-400 rounded-full flex items-center justify-center mx-auto mb-3 text-xl">
                🔑
              </div>
              <h3 className="text-base font-bold text-white mb-1">No API keys generated yet</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto mb-4">
                Create an API key to allow your Node.js agent to stream telemetry and receive human approval controls.
              </p>
              {isOwner && (
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="py-2 px-4 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs transition-colors"
                >
                  Create API Key
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="bg-slate-950/60 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                  <tr>
                    <th className="px-6 py-4 font-semibold">Name</th>
                    <th className="px-6 py-4 font-semibold">Key Prefix</th>
                    <th className="px-6 py-4 font-semibold">Created</th>
                    <th className="px-6 py-4 font-semibold">Last Used</th>
                    <th className="px-6 py-4 font-semibold">Status</th>
                    {isOwner && <th className="px-6 py-4 font-semibold text-right">Actions</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {apiKeys.map((key) => {
                    const isRevoked = !!key.revokedAt;
                    return (
                      <tr key={key.id} className="hover:bg-slate-800/30 transition-colors">
                        <td className="px-6 py-4 font-medium text-white">{key.name}</td>
                        <td className="px-6 py-4 font-mono text-purple-300">{key.keyPrefix}...</td>
                        <td className="px-6 py-4 text-slate-400">
                          {new Date(key.createdAt).toLocaleDateString(undefined, {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </td>
                        <td className="px-6 py-4 text-slate-400">
                          {key.lastUsedAt ? new Date(key.lastUsedAt).toLocaleString() : "Never"}
                        </td>
                        <td className="px-6 py-4">
                          {isRevoked ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-medium">
                              Revoked
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium">
                              Active
                            </span>
                          )}
                        </td>
                        {isOwner && (
                          <td className="px-6 py-4 text-right">
                            {!isRevoked && (
                              <button
                                onClick={() => setKeyToRevoke(key)}
                                className="px-3 py-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-300 text-xs font-semibold transition-colors"
                              >
                                Revoke Key
                              </button>
                            )}
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* CREATE API KEY MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 rounded-2xl border border-slate-800 max-w-md w-full p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-2">Create New API Key</h3>
            <p className="text-xs text-slate-400 mb-6">
              Give your API key a descriptive name to identify which agent server or service environment will use it.
            </p>

            <form onSubmit={handleCreateKey} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  Key Name
                </label>
                <input
                  type="text"
                  required
                  value={newKeyName}
                  onChange={(e) => setNewKeyName(e.target.value)}
                  placeholder="e.g. Production Worker Agent"
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating || !newKeyName.trim()}
                  className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs transition-colors disabled:opacity-50"
                >
                  {creating ? "Generating..." : "Generate Key"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CONFIRM REVOKE MODAL */}
      {keyToRevoke && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 rounded-2xl border border-slate-800 max-w-md w-full p-6 shadow-2xl">
            <div className="w-12 h-12 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-full flex items-center justify-center mb-4 text-xl">
              ⚠️
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Revoke API Key?</h3>
            <p className="text-xs text-slate-400 mb-6 leading-relaxed">
              Are you sure you want to revoke key <span className="font-semibold text-white">&quot;{keyToRevoke.name}&quot;</span> (<span className="font-mono text-purple-300">{keyToRevoke.keyPrefix}...</span>)? Any connected agent using this key will immediately be rejected with HTTP 401.
            </p>

            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setKeyToRevoke(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleRevokeKey}
                disabled={revoking}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs transition-colors disabled:opacity-50"
              >
                {revoking ? "Revoking..." : "Confirm Revocation"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
