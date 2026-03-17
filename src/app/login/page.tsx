"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AuthShell } from "@/components/auth/auth-shell";
import { PasswordField } from "@/components/auth/password-field";
import { FloatingNotice } from "@/components/ui/floating-notice";
import {
  finalizeLoginSession,
  getPendingVerificationEmail,
  loginWithEmail,
  setPendingResetEmail,
  setPendingVerificationEmail,
} from "@/lib/auth";

function mapLoginError(message: string) {
  const text = message.toLowerCase();

  if (text.includes("invalid email or password")) {
    return "Email or password is incorrect.";
  }

  if (text.includes("password must be longer than or equal to")) {
    return "Your password is too short.";
  }

  if (text.includes("session expired")) {
    return "Your session expired. Sign in again.";
  }

  return "We couldn’t sign you in.";
}

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState(getPendingVerificationEmail() ?? "");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [showForgot, setShowForgot] = useState(false);
  const [isBusy, setIsBusy] = useState(false);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(""), 3200);
    return () => window.clearTimeout(timer);
  }, [notice]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setShowForgot(false);
    setIsBusy(true);

    try {
      const login = await loginWithEmail(email, password);
      const finalSession = await finalizeLoginSession();

      if (!login.emailVerified || login.requiresEmailVerification) {
        setPendingVerificationEmail(login.user.email);
        setNotice("Your verification code is waiting in your email.");
        router.replace("/verify-email");
        return;
      }

      if (finalSession.me.context?.schoolId && finalSession.me.context?.programId) {
        router.replace("/dashboard/control-center");
        return;
      }

      router.replace("/onboarding");
    } catch (err) {
      setError(
        err instanceof Error ? mapLoginError(err.message) : "We couldn’t sign you in."
      );
      setShowForgot(true);
    } finally {
      setIsBusy(false);
    }
  }

  function handleForgotPassword() {
    if (email.trim()) {
      setPendingResetEmail(email.trim());
    }
    router.push(
      `/forgot-password${
        email.trim() ? `?email=${encodeURIComponent(email.trim())}` : ""
      }`
    );
  }

  return (
    <>
      <AuthShell
        title="Welcome back"
        subtitle="Return to the intelligence layer of education."
        footer={
          <p className="text-sm text-white/50">
            New here?{" "}
            <Link href="/register" className="text-white underline underline-offset-4">
              Create account
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

          <div>
            <div className="mb-2 flex items-center justify-between">
              <label className="block text-sm text-white/70">Password</label>
              <button
                type="button"
                onClick={handleForgotPassword}
                className="text-sm text-white/45 transition hover:text-white/75"
              >
                Forgot password?
              </button>
            </div>

            <PasswordField
              label=""
              value={password}
              onChange={setPassword}
              placeholder="Enter your password"
              autoComplete="current-password"
              required
            />
          </div>

          {error ? (
            <div className="rounded-2xl border border-rose-400/20 bg-rose-400/10 px-4 py-3 text-sm text-rose-100">
              {error}
            </div>
          ) : null}

          {showForgot ? (
            <button
              type="button"
              onClick={handleForgotPassword}
              className="text-sm text-white underline underline-offset-4"
            >
              Reset your password
            </button>
          ) : null}

          <button
            type="submit"
            disabled={isBusy}
            className="inline-flex w-full items-center justify-center rounded-full bg-white px-4 py-3.5 text-sm font-medium text-black transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isBusy ? "Signing in..." : "Sign in"}
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