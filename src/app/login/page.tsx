"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AuthLayout } from "@/components/AuthLayout";
import { Button } from "@/components/ui/Button";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Invalid email or password");
        setLoading(false);
        return;
      }

      router.push("/runs");
      router.refresh();
    } catch {
      setError("An unexpected network error occurred. Please try again.");
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Sign in to Steward"
      subtitle={
        <span>
          New to Steward?{" "}
          <Link
            href="/register"
            className="font-medium text-blue-600 hover:text-blue-700 underline"
          >
            Create account
          </Link>
        </span>
      }
    >
      {error && (
        <div
          role="alert"
          className="p-3.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium flex items-center gap-2.5"
        >
          <svg className="w-4 h-4 text-rose-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{error}</span>
        </div>
      )}

      <form className="space-y-4" onSubmit={handleSubmit}>
        <div>
          <label htmlFor="email" className="block text-xs font-semibold uppercase tracking-wider text-stone-700 mb-1.5">
            Email Address
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="operator@company.com"
            className="w-full px-3.5 py-2.5 rounded-lg bg-white border border-stone-300 text-stone-900 placeholder-stone-400 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all"
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label htmlFor="password" className="block text-xs font-semibold uppercase tracking-wider text-stone-700">
              Password
            </label>
            <Link href="/forgot-password" className="text-xs text-blue-600 hover:text-blue-700 font-medium">
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-3.5 py-2.5 rounded-lg bg-white border border-stone-300 text-stone-900 placeholder-stone-400 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all pr-14"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? "Hide password text" : "Show password text"}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs font-medium text-stone-500 hover:text-stone-800 px-2 py-1 rounded bg-stone-100 border border-stone-200"
            >
              {showPassword ? "Hide" : "Show"}
            </button>
          </div>
        </div>

        <Button
          type="submit"
          variant="primary"
          size="md"
          isLoading={loading}
          className="w-full mt-2"
        >
          Sign in
        </Button>
      </form>
    </AuthLayout>
  );
}
