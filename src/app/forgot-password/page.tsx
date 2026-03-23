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
      compact
      title="Reset password"
      subtitle="Enter your email and we’ll send you a reset link."
      footer={
        <p className="text-center text-sm text-[var(--text-soft)]">
          Remembered it?{" "}
          <Link
            href="/login"
            className="font-medium text-[var(--text-main)] transition hover:text-[var(--text-strong)]"
          >
            Back to sign in
          </Link>
        </p>
      }
    >
      <form className="space-y-4" onSubmit={handleSubmit}>
        <input
          className="h-12 w-full rounded-2xl border border-[var(--border)] bg-[var(--surface-1)] px-4 text-sm text-[var(--foreground)] outline-none transition placeholder:text-[var(--text-faint)] focus:border-[rgba(54,97,225,0.36)] focus:bg-[var(--surface-2)] focus:ring-4 focus:ring-[var(--ring)]"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="Email address"
          autoComplete="email"
          required
        />

        {error ? (
          <div className="rounded-2xl border border-[rgba(198,38,74,0.18)] bg-[rgba(198,38,74,0.10)] px-4 py-3 text-sm text-[var(--text-main)]">
            {error}
          </div>
        ) : null}

        {message ? (
          <div className="rounded-2xl border border-[rgba(54,97,225,0.18)] bg-[rgba(54,97,225,0.10)] px-4 py-3 text-sm text-[var(--text-main)]">
            {message}
          </div>
        ) : null}

        <button
          type="submit"
          disabled={isBusy}
          className="skuully-cta h-12 w-full rounded-2xl px-4 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-55"
        >
          <span>{isBusy ? "Sending link..." : "Send reset link"}</span>
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