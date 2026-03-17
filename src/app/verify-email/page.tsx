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
  markVerificationCodeSent,
  resendVerificationCode,
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

  const expired = useMemo(() => timeRemaining <= 0, [timeRemaining]);

  async function handleVerify(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsVerifying(true);

    try {
      await verifyEmailCode(email, code);
      clearPendingVerificationEmail();
      clearVerificationCodeSentAt();
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
    setIsResending(true);

    try {
      const result = await resendVerificationCode(email);
      markVerificationCodeSent();
      setTimeRemaining(getVerificationTimeRemainingMs());
      setNotice(result.message || "A fresh code is on its way.");
    } catch {
      setError("We couldn’t send a new code.");
    } finally {
      setIsResending(false);
    }
  }

  return (
    <>
      <AuthShell
        title="Check your email"
        subtitle="A secure code is waiting in your inbox. Enter it to continue into the future of education."
        footer={
          <p className="text-sm text-white/50">
            Need a different email?{" "}
            <Link href="/login" className="text-white underline underline-offset-4">
              Go back
            </Link>
          </p>
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
              required
            />
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <label className="block text-sm text-white/70">Code</label>
              <span className={`text-xs ${expired ? "text-rose-300" : "text-white/45"}`}>
                {expired ? "Expired" : `Expires in ${formatTime(timeRemaining)}`}
              </span>
            </div>

            <input
              className="w-full rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3.5 text-center text-lg tracking-[0.35em] text-white outline-none transition placeholder:text-white/25 focus:border-white/20 focus:bg-white/[0.05]"
              value={code}
              onChange={(event) =>
                setCode(event.target.value.replace(/\D/g, "").slice(0, 6))
              }
              inputMode="numeric"
              placeholder="123456"
              required
            />
          </div>

          {error ? (
            <div className="rounded-2xl border border-rose-400/20 bg-rose-400/10 px-4 py-3 text-sm text-rose-100">
              {error}
            </div>
          ) : null}

          <button
            type="submit"
            disabled={isVerifying || expired}
            className="inline-flex w-full items-center justify-center rounded-full bg-white px-4 py-3.5 text-sm font-medium text-black transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isVerifying ? "Verifying..." : "Continue"}
          </button>

          <button
            type="button"
            onClick={handleResend}
            disabled={isResending || !email}
            className="inline-flex w-full items-center justify-center rounded-full border border-white/10 bg-white/[0.03] px-4 py-3.5 text-sm text-white/75 transition hover:bg-white/[0.06] disabled:cursor-not-allowed disabled:opacity-40"
          >
            {isResending ? "Sending..." : "Resend code"}
          </button>
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