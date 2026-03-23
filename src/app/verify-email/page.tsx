"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AuthShell } from "@/components/auth/auth-shell";
import { FloatingNotice } from "@/components/ui/floating-notice";
import {
  clearPendingVerificationEmail,
  clearVerificationCodeSentAt,
  getPendingVerificationEmail,
  getVerificationTimeRemainingMs,
  logoutSession,
  markVerificationCodeSent,
  resendVerificationCode,
  setPendingVerificationEmail,
  verifyEmailCode,
} from "@/lib/auth";

function mapVerifyError(message: string) {
  const text = message.toLowerCase();

  if (text.includes("invalid or expired verification code")) {
    return "Invalid or expired code.";
  }

  if (text.includes("invalid verification request")) {
    return "Invalid verification request.";
  }

  if (text.includes("already verified")) {
    return "Email already verified.";
  }

  return "Unable to verify email.";
}

function formatTime(ms: number) {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(
    2,
    "0"
  )}`;
}

export default function VerifyEmailPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(0);

  useEffect(() => {
    const pendingEmail = getPendingVerificationEmail();
    if (pendingEmail) {
      setEmail(pendingEmail);
    }

    setTimeRemaining(getVerificationTimeRemainingMs());

    const interval = window.setInterval(() => {
      setTimeRemaining(getVerificationTimeRemainingMs());
    }, 1000);

    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(""), 3200);
    return () => window.clearTimeout(timer);
  }, [notice]);

  const expired = useMemo(() => timeRemaining <= 0, [timeRemaining]);
  const normalizedEmail = email.trim().toLowerCase();
  const canResend = !!normalizedEmail && !isResending && !isLeaving;

  async function handleVerify(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!normalizedEmail) {
      setError("Enter your email.");
      return;
    }

    if (code.trim().length !== 6) {
      setError("Enter the 6-digit code.");
      return;
    }

    setIsVerifying(true);

    try {
      await verifyEmailCode(normalizedEmail, code.trim());
      clearPendingVerificationEmail();
      clearVerificationCodeSentAt();
      setNotice("Email verified.");
      router.replace("/onboarding");
    } catch (err) {
      setError(
        err instanceof Error
          ? mapVerifyError(err.message)
          : "Unable to verify email."
      );
    } finally {
      setIsVerifying(false);
    }
  }

  async function handleResend() {
    setError(null);

    if (!normalizedEmail) {
      setError("Enter your email first.");
      return;
    }

    setIsResending(true);

    try {
      const result = await resendVerificationCode(normalizedEmail);
      setPendingVerificationEmail(normalizedEmail);
      markVerificationCodeSent();
      setTimeRemaining(getVerificationTimeRemainingMs());
      setNotice(result.message || "Code sent.");
    } catch {
      setError("Unable to send a new code.");
    } finally {
      setIsResending(false);
    }
  }

  async function handleChangeEmail() {
    setError(null);
    setIsLeaving(true);

    try {
      await logoutSession();
    } catch {
      // ignore
    } finally {
      clearPendingVerificationEmail();
      clearVerificationCodeSentAt();
      router.replace("/register");
    }
  }

  async function handleBackToLogin() {
    setError(null);
    setIsLeaving(true);

    try {
      await logoutSession();
    } catch {
      // ignore
    } finally {
      clearVerificationCodeSentAt();
      clearPendingVerificationEmail();
      router.replace("/login");
    }
  }

  return (
    <>
      <AuthShell
        compact
        title="Verify your email"
        subtitle="Enter the 6-digit code sent to your inbox."
        footer={
          <div className="flex flex-wrap justify-center gap-4 text-sm">
            <button
              type="button"
              onClick={handleChangeEmail}
              disabled={isLeaving || isVerifying || isResending}
              className="text-[var(--text-main)] underline underline-offset-4 disabled:opacity-50"
            >
              Change email
            </button>

            <button
              type="button"
              onClick={handleBackToLogin}
              disabled={isLeaving || isVerifying || isResending}
              className="text-[var(--text-main)] underline underline-offset-4 disabled:opacity-50"
            >
              Back to sign in
            </button>
          </div>
        }
      >
        <form className="space-y-4" onSubmit={handleVerify}>
          <div className="space-y-2">
            <label className="block text-sm font-medium text-[var(--text-main)]">
              Email
            </label>
            <input
              className="h-12 w-full rounded-[calc(var(--radius)+4px)] border border-[var(--border)] bg-[var(--input)] px-4 text-sm text-[var(--foreground)] outline-none transition placeholder:text-[var(--text-faint)] focus-visible:border-[rgba(var(--skuully-blue),0.42)] focus-visible:ring-4 focus-visible:ring-ring/50"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
              required
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-sm font-medium text-[var(--text-main)]">
                Code
              </label>
              <span
                className={`text-xs ${
                  expired
                    ? "text-[rgb(var(--skuully-magenta))]"
                    : "text-[var(--text-soft)]"
                }`}
              >
                {expired ? "Expired" : formatTime(timeRemaining)}
              </span>
            </div>

            <input
              className="h-14 w-full rounded-[calc(var(--radius)+6px)] border border-[var(--border)] bg-[var(--input)] px-4 text-center text-lg tracking-[0.35em] text-[var(--foreground)] outline-none transition placeholder:text-[var(--text-faint)] focus-visible:border-[rgba(var(--skuully-blue),0.42)] focus-visible:ring-4 focus-visible:ring-ring/50"
              value={code}
              onChange={(event) =>
                setCode(event.target.value.replace(/\D/g, "").slice(0, 6))
              }
              inputMode="numeric"
              autoComplete="one-time-code"
              placeholder="123456"
              required
            />
          </div>

          {error ? (
            <div className="rounded-2xl border border-[rgba(198,38,74,0.18)] bg-[rgba(198,38,74,0.10)] px-4 py-3 text-sm text-[var(--text-main)]">
              {error}
            </div>
          ) : null}

          <button
            type="submit"
            disabled={
              isVerifying ||
              isLeaving ||
              !normalizedEmail ||
              code.trim().length !== 6
            }
            className="skuully-cta h-12 w-full rounded-2xl px-4 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-55"
          >
            <span>{isVerifying ? "Verifying..." : "Continue"}</span>
          </button>

          <button
            type="button"
            onClick={handleResend}
            disabled={!canResend}
            className="inline-flex h-12 w-full items-center justify-center rounded-2xl border border-[var(--border)] bg-[var(--surface-1)] px-4 text-sm font-medium text-[var(--text-main)] transition hover:bg-[var(--surface-2)] disabled:cursor-not-allowed disabled:opacity-40"
          >
            {isResending ? "Sending..." : "Resend code"}
          </button>

          <div className="text-center text-sm text-[var(--text-soft)]">
            Prefer sign in?{" "}
            <Link
              href="/login"
              className="font-medium text-[var(--text-main)] underline underline-offset-4"
            >
              Open sign in
            </Link>
          </div>
        </form>
      </AuthShell>

      <FloatingNotice
        show={!!notice}
        message={notice}
        tone="success"
        position="bottom-left"
      />
    </>
  );
}