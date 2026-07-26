"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState<number>(2); // Step 2: Create Project (since account is created)
  const [projectName, setProjectName] = useState("");
  const [projectId, setProjectId] = useState<string | null>(null);
  const [secretKey, setSecretKey] = useState<string | null>(null);
  const [keyPrefix, setKeyPrefix] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [firstRunFound, setFirstRunFound] = useState<{ id: string; externalId: string } | null>(null);

  // Check if user already has projects on load
  useEffect(() => {
    fetch("/api/projects")
      .then((res) => res.json())
      .then((data) => {
        if (data.projects && data.projects.length > 0) {
          const p = data.projects[0];
          setProjectId(p.id);
          setProjectName(p.name);
        }
      })
      .catch(() => {});
  }, []);

  // Poll for first run when in Step 5 (Waiting for first run)
  useEffect(() => {
    if (step !== 5 || !projectId) return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/v1/runs?projectId=${projectId}`);
        if (!res.ok) return;
        const data = await res.json();
        if (data.runs && data.runs.length > 0) {
          const run = data.runs[0];
          setFirstRunFound({ id: run.id, externalId: run.externalId });
          clearInterval(interval);
        }
      } catch {
        // ignore
      }
    }, 2500);

    return () => clearInterval(interval);
  }, [step, projectId]);

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectName.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: projectName.trim() }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to create project");
        setLoading(false);
        return;
      }

      setProjectId(data.project.id);
      setStep(3); // Advance to API Key generation
    } catch {
      setError("Failed to create project due to network error");
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateKey = async () => {
    if (!projectId) return;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/projects/${projectId}/api-keys`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "Default Agent Key" }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to generate API key");
        setLoading(false);
        return;
      }

      setSecretKey(data.apiKey.secretKey);
      setKeyPrefix(data.apiKey.keyPrefix);
      setStep(4); // Advance to SDK Snippet step
    } catch {
      setError("Failed to generate API key due to network error");
    } finally {
      setLoading(false);
    }
  };

  const handleCopyKey = () => {
    if (secretKey) {
      navigator.clipboard.writeText(secretKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 selection:bg-purple-500 selection:text-white">
      <div className="max-w-2xl mx-auto w-full">
        {/* Step Progress Bar */}
        <div className="mb-10 flex items-center justify-between px-2">
          {[
            { num: 1, label: "Account" },
            { num: 2, label: "Project" },
            { num: 3, label: "API Key" },
            { num: 4, label: "SDK Setup" },
            { num: 5, label: "Live Connection" },
          ].map((s) => (
            <div key={s.num} className="flex items-center gap-2">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition-all ${
                  step > s.num
                    ? "bg-emerald-500 text-slate-950"
                    : step === s.num
                    ? "bg-purple-600 text-white shadow-lg shadow-purple-500/30 ring-4 ring-purple-500/20"
                    : "bg-slate-800 text-slate-500"
                }`}
              >
                {step > s.num ? "✓" : s.num}
              </div>
              <span className={`text-xs font-semibold hidden sm:inline ${step === s.num ? "text-purple-300" : "text-slate-500"}`}>
                {s.label}
              </span>
            </div>
          ))}
        </div>

        {/* Card Container */}
        <div className="bg-slate-900/80 backdrop-blur-xl p-8 rounded-2xl border border-slate-800 shadow-2xl shadow-purple-950/20">
          {error && (
            <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-sm flex items-center gap-3">
              <svg className="w-5 h-5 text-rose-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{error}</span>
            </div>
          )}

          {/* STEP 2: Create Project */}
          {step === 2 && (
            <div>
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-white mb-2">Create your first project</h2>
                <p className="text-sm text-slate-400">
                  Projects isolate agent telemetry, human approvals, and security settings.
                </p>
              </div>

              <form onSubmit={handleCreateProject} className="space-y-6">
                <div>
                  <label htmlFor="projectName" className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                    Project Name
                  </label>
                  <input
                    id="projectName"
                    type="text"
                    required
                    value={projectName}
                    onChange={(e) => setProjectName(e.target.value)}
                    placeholder="e.g. Production Agents"
                    className="w-full px-4 py-3 rounded-xl bg-slate-950/80 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div className="flex items-center justify-between pt-4">
                  <Link href="/runs" className="text-xs font-medium text-slate-400 hover:text-white transition-colors">
                    Skip tutorial for now
                  </Link>

                  <button
                    type="submit"
                    disabled={loading || !projectName.trim()}
                    className="py-3 px-6 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-sm shadow-lg shadow-purple-600/25 transition-all disabled:opacity-50"
                  >
                    {loading ? "Creating..." : "Continue to API Key →"}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* STEP 3: Generate API Key */}
          {step === 3 && (
            <div className="text-center py-4">
              <div className="w-12 h-12 bg-purple-500/10 border border-purple-500/20 text-purple-400 rounded-full flex items-center justify-center mx-auto mb-4 text-xl">
                🔑
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Generate Agent API Key</h2>
              <p className="text-sm text-slate-400 max-w-md mx-auto mb-8">
                Your agent connects to Steward using a project API key. Keys are cryptographically hashed and never stored in plain text.
              </p>

              <button
                onClick={handleGenerateKey}
                disabled={loading}
                className="py-3.5 px-8 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-sm shadow-lg shadow-purple-600/25 transition-all disabled:opacity-50"
              >
                {loading ? "Generating secret key..." : "Generate Secret API Key"}
              </button>
            </div>
          )}

          {/* STEP 4: SDK Setup & Secret Key Banner */}
          {step === 4 && (
            <div>
              <div className="mb-6">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-medium mb-3">
                  ⚠️ Copy this secret key now. It will never be shown again!
                </div>
                <h2 className="text-2xl font-bold text-white mb-1">Agent API Key Generated</h2>
                <p className="text-sm text-slate-400">
                  Key prefix: <span className="font-mono text-purple-300">{keyPrefix}</span>
                </p>
              </div>

              {secretKey && (
                <div className="mb-8 p-4 rounded-xl bg-slate-950 border border-purple-500/30 flex items-center justify-between gap-4">
                  <code className="text-xs sm:text-sm font-mono text-purple-300 break-all selection:bg-purple-600 selection:text-white">
                    {secretKey}
                  </code>
                  <button
                    onClick={handleCopyKey}
                    className="shrink-0 px-3 py-1.5 rounded-lg bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/30 text-purple-300 text-xs font-semibold transition-colors"
                  >
                    {copied ? "Copied! ✓" : "Copy Secret"}
                  </button>
                </div>
              )}

              <div className="mb-8">
                <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-3">
                  Quick Integration Snippet
                </h3>
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-xs font-mono text-slate-300 overflow-x-auto">
                  <div className="text-slate-500"># Install the Steward SDK</div>
                  <div className="text-emerald-400 mb-4">npm install @steward/sdk</div>

                  <div className="text-slate-500"># Connect your agent</div>
                  <div className="text-purple-300">import</div> {"{ Steward }"} <div className="text-purple-300 inline">from</div> <div className="text-emerald-300 inline">&quot;@steward/sdk&quot;</div>;
                  <br /><br />
                  <div className="text-purple-300">const</div> steward = <div className="text-purple-300 inline">new</div> Steward({"{"}
                  <br />
                  {"  "}apiKey: <div className="text-emerald-300 inline">&quot;{secretKey || "stwd_live_..."}&quot;</div>,
                  <br />
                  {"  "}baseUrl: <div className="text-emerald-300 inline">&quot;http://localhost:3000&quot;</div>,
                  <br />
                  {"  "}agentName: <div className="text-emerald-300 inline">&quot;my-first-agent&quot;</div>
                  <br />
                  {"}"});
                  <br /><br />
                  <div className="text-purple-300">const</div> run = steward.startRun();
                  <br />
                  <div className="text-purple-300">await</div> run.started();
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  onClick={() => setStep(5)}
                  className="py-3 px-6 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-sm shadow-lg shadow-purple-600/25 transition-all"
                >
                  Listen for First Agent Run →
                </button>
              </div>
            </div>
          )}

          {/* STEP 5: Waiting for First Run */}
          {step === 5 && (
            <div className="text-center py-8">
              {firstRunFound ? (
                <div>
                  <div className="w-14 h-14 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl animate-bounce">
                    🎉
                  </div>
                  <h2 className="text-2xl font-bold text-white mb-2">First Agent Run Received!</h2>
                  <p className="text-sm text-slate-400 mb-6">
                    Run ID: <span className="font-mono text-purple-300">{firstRunFound.externalId}</span>
                  </p>
                  <button
                    onClick={() => router.push(`/runs?runId=${firstRunFound.externalId}`)}
                    className="py-3.5 px-8 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm shadow-lg shadow-emerald-600/25 transition-all"
                  >
                    Open Live Run Timeline →
                  </button>
                </div>
              ) : (
                <div>
                  <div className="relative w-16 h-16 mx-auto mb-6 flex items-center justify-center">
                    <div className="absolute inset-0 rounded-full border-4 border-purple-500/20 border-t-purple-500 animate-spin"></div>
                    <span className="text-2xl">📡</span>
                  </div>
                  <h2 className="text-2xl font-bold text-white mb-2">Waiting for first run...</h2>
                  <p className="text-sm text-slate-400 max-w-md mx-auto mb-8">
                    Run your agent script with your newly generated API key. Steward will automatically capture and display the telemetry timeline as soon as it arrives.
                  </p>

                  <button
                    onClick={() => router.push("/runs")}
                    className="py-2.5 px-5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-xs transition-colors"
                  >
                    Go to Runs Dashboard
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
