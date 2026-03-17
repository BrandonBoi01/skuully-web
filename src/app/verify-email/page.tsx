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
    return "That code is invalid or has expired.";
  }

  if (text.includes("invalid verification request")) {
    return "We couldn’t verify that request.";
  }

  if (text.includes("already verified")) {
    return "This email is already verified. You can continue to sign in.";
  }

  return "We couldn’t verify your email.";
}

function formatTime(ms: number) {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
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
      setError("Enter the email you used to create your account.");
      return;
    }

    if (code.trim().length !== 6) {
      setError("Enter the 6-digit code from your email.");
      return;
    }

    setIsVerifying(true);

    try {
      await verifyEmailCode(normalizedEmail, code.trim());
      clearPendingVerificationEmail();
      clearVerificationCodeSentAt();
      setNotice("Email verified successfully.");
      router.replace("/onboarding");
    } catch (err) {
      setError(
        err instanceof Error
          ? mapVerifyError(err.message)
          : "We couldn’t verify your email."
      );
    } finally {
      setIsVerifying(false);
    }
  }

  async function handleResend() {
    setError(null);

    if (!normalizedEmail) {
      setError("Enter your email first so we know where to send the code.");
      return;
    }

    setIsResending(true);

    try {
      const result = await resendVerificationCode(normalizedEmail);
      setPendingVerificationEmail(normalizedEmail);
      markVerificationCodeSent();
      setTimeRemaining(getVerificationTimeRemainingMs());
      setNotice(result.message || "A fresh code is on its way.");
    } catch {
      setError("We couldn’t send a new code.");
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
      // ignore logout failures; continue clearing local verification state
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
      // ignore logout failures; continue clearing local verification state
    } finally {
      clearVerificationCodeSentAt();
      clearPendingVerificationEmail();
      router.replace("/login");
    }
  }

  return (
    <>
      <AuthShell
        title="Check your email"
        subtitle="Enter the 6-digit code we sent. Most codes arrive within a minute. If it takes longer than a few minutes, resend it or use another email."
        footer={
          <div className="space-y-3 text-sm text-white/50">
            <p>
              Wrong email or no code yet? You can resend, change your email, or
              go back to sign in.
            </p>

            <div className="flex flex-wrap gap-4">
              <button
                type="button"
                onClick={handleChangeEmail}
                disabled={isLeaving || isVerifying || isResending}
                className="text-white underline underline-offset-4 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isLeaving ? "Leaving..." : "Change email"}
              </button>

              <button
                type="button"
                onClick={handleBackToLogin}
                disabled={isLeaving || isVerifying || isResending}
                className="text-white underline underline-offset-4 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isLeaving ? "Leaving..." : "Back to sign in"}
              </button>
            </div>
          </div>
        }
      >
        <form className="space-y-4" onSubmit={handleVerify}>
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

          <div>
            <div className="mb-2 flex items-center justify-between">
              <label className="block text-sm text-white/70">Code</label>
              <span
                className={`text-xs ${
                  expired ? "text-rose-300" : "text-white/45"
                }`}
              >
                {expired ? "Code expired" : `Expires in ${formatTime(timeRemaining)}`}
              </span>
            </div>

            <input
              className="w-full rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3.5 text-center text-lg tracking-[0.35em] text-white outline-none transition placeholder:text-white/25 focus:border-white/20 focus:bg-white/[0.05]"
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

          <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white/60">
            Didn’t get the code? Check spam or promotions first. If it still
            doesn’t arrive within 2–3 minutes, resend it or change your email.
          </div>

          {error ? (
            <div className="rounded-2xl border border-rose-400/20 bg-rose-400/10 px-4 py-3 text-sm text-rose-100">
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
            className="inline-flex w-full items-center justify-center rounded-full bg-white px-4 py-3.5 text-sm font-medium text-black transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isVerifying ? "Verifying..." : "Continue"}
          </button>

          <button
            type="button"
            onClick={handleResend}
            disabled={!canResend}
            className="inline-flex w-full items-center justify-center rounded-full border border-white/10 bg-white/[0.03] px-4 py-3.5 text-sm text-white/75 transition hover:bg-white/[0.06] disabled:cursor-not-allowed disabled:opacity-40"
          >
            {isResending ? "Sending..." : "Resend code"}
          </button>

          <div className="text-center text-sm text-white/45">
            Prefer signing in instead?{" "}
            <Link href="/login" className="text-white underline underline-offset-4">
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