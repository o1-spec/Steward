"use client";

import { useState } from "react";
import Link from "next/link";
import { AuthLayout } from "@/components/AuthLayout";
import { Button } from "@/components/ui/Button";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      setSubmitted(true);
    } catch {
      setSubmitted(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Reset password"
      subtitle={
        <span>
          Remember your password?{" "}
          <Link
            href="/login"
            className="font-medium text-blue-600 hover:text-blue-700 underline"
          >
            Sign in
          </Link>
        </span>
      }
    >
      {submitted ? (
        <div className="text-center py-4 space-y-4">
          <div className="w-12 h-12 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-full flex items-center justify-center mx-auto text-xl font-bold">
            ✓
          </div>
          <h3 className="text-lg font-semibold text-stone-900">Check your inbox</h3>
          <p className="text-xs text-stone-600 leading-relaxed">
            If an account exists for <span className="text-stone-900 font-medium">{email}</span>, password reset instructions have been dispatched.
          </p>
          <Link href="/login" className="block pt-2">
            <Button variant="outline" size="md" className="w-full">
              Return to Sign in
            </Button>
          </Link>
        </div>
      ) : (
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="email" className="block text-xs font-semibold uppercase tracking-wider text-stone-700 mb-1.5">
              Account Email Address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="operator@company.com"
              className="w-full px-3.5 py-2.5 rounded-lg bg-white border border-stone-300 text-stone-900 placeholder-stone-400 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all"
            />
          </div>

          <Button
            type="submit"
            variant="primary"
            size="md"
            isLoading={loading}
            className="w-full mt-2"
          >
            Send password reset instructions
          </Button>

          <div className="text-center pt-2">
            <Link href="/login" className="text-xs text-stone-600 hover:text-stone-900 font-medium">
              ← Return to sign in
            </Link>
          </div>
        </form>
      )}
    </AuthLayout>
  );
}
