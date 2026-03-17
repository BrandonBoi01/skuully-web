"use client";

import Link from "next/link";
import { FormEvent, Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { AuthShell } from "@/components/auth/auth-shell";
import {
  getPendingResetEmail,
  requestPasswordReset,
  setPendingResetEmail,
} from "@/lib/auth";

function ForgotPasswordContent() {
  const searchParams = useSearchParams();

  const [email, setEmail] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isBusy, setIsBusy] = useState(false);

  useEffect(() => {
    const fromQuery = searchParams.get("email");
    const pending = getPendingResetEmail();

    if (fromQuery?.trim()) {
      setEmail(fromQuery.trim());
      return;
    }

    if (pending?.trim()) {
      setEmail(pending.trim());
    }
  }, [searchParams]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setMessage(null);
    setIsBusy(true);

    try {
      setPendingResetEmail(email.trim());
      const result = await requestPasswordReset(email.trim());
      setMessage(result.message);
    } catch {
      setError("We couldn’t send the reset link.");
    } finally {
      setIsBusy(false);
    }
  }

  return (
    <AuthShell
      title="Reset your password"
      subtitle="Enter the email linked to your account and we’ll send you a reset link."
      footer={
        <p className="text-sm text-white/50">
          Remembered it?{" "}
          <Link href="/login" className="text-white underline underline-offset-4">
            Go back to sign in
          </Link>
        </p>
      }
    >
      <form className="space-y-4" onSubmit={handleSubmit}>
        <div>
          <label className="mb-2 block text-sm text-white/70">Email</label>
          <input
            className="w-full rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3.5 text-white outline-none transition placeholder:text-white/25 focus:border-white/20 focus:bg-white/[0.05]"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@example.com"
            autoComplete="email"
            required
          />
        </div>

        {error ? (
          <div className="rounded-2xl border border-rose-400/20 bg-rose-400/10 px-4 py-3 text-sm text-rose-100">
            {error}
          </div>
        ) : null}

        {message ? (
          <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-100">
            {message}
          </div>
        ) : null}

        <button
          type="submit"
          disabled={isBusy}
          className="inline-flex w-full items-center justify-center rounded-full bg-white px-4 py-3.5 text-sm font-medium text-black transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isBusy ? "Sending link..." : "Send reset link"}
        </button>
      </form>
    </AuthShell>
  );
}

export default function ForgotPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ForgotPasswordContent />
    </Suspense>
  );
}