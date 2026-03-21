"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AuthShell } from "@/components/auth/auth-shell";
import { PasswordField } from "@/components/auth/password-field";
import { FloatingNotice } from "@/components/ui/floating-notice";
import {
  continueWithApple,
  continueWithGoogle,
  finalizeLoginSession,
  getPendingVerificationEmail,
  getSuggestedLoginMethod,
  loginWithIdentifier,
  setPendingResetEmail,
  setPendingVerificationEmail,
  markVerificationCodeSent,
} from "@/lib/auth";

function mapLoginError(message: string) {
  const text = message.toLowerCase();

  if (text.includes("invalid credentials")) {
    return "Your email, phone, Skuully ID, or password is incorrect.";
  }

  if (text.includes("password must be longer than or equal to")) {
    return "Your password is too short.";
  }

  if (text.includes("request took too long")) {
    return "The server took too long to respond. Please try again.";
  }

  if (text.includes("failed to fetch")) {
    return "Could not reach the server. Check that your API is running.";
  }

  if (text.includes("session expired")) {
    return "Your session expired. Sign in again.";
  }

  if (text.includes("google")) {
    return "This account may use Google sign-in.";
  }

  if (text.includes("apple")) {
    return "This account may use Apple sign-in.";
  }

  return "We couldn’t sign you in.";
}

export default function LoginPage() {
  const router = useRouter();

  const [identifier, setIdentifier] = useState(
    getPendingVerificationEmail() ?? ""
  );
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [showForgot, setShowForgot] = useState(false);
  const [isBusy, setIsBusy] = useState(false);
  const [notice, setNotice] = useState("");

  const suggested = useMemo(() => getSuggestedLoginMethod(), []);
  const suggestedLabel = useMemo(() => {
    if (suggested.method === "GOOGLE") return "Continue with Google";
    if (suggested.method === "APPLE") return "Continue with Apple";
    if (suggested.method === "EMAIL" && suggested.email) {
      return `Continue as ${suggested.email}`;
    }
    return null;
  }, [suggested]);

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
      const normalizedIdentifier = identifier.trim().toLowerCase();

      const login = await loginWithIdentifier(normalizedIdentifier, password);

      if (!login.emailVerified || login.requiresEmailVerification) {
        if (login.user.email) {
          setPendingVerificationEmail(login.user.email);
          markVerificationCodeSent();
        }
        setNotice("Your verification code is waiting in your email.");
        router.replace("/verify-email");
        return;
      }

      const finalSession = await finalizeLoginSession();
      const me = finalSession.me;

      if (!me) {
        setError("We signed you in, but could not load your account.");
        return;
      }

      if (!me.emailVerified) {
        setPendingVerificationEmail(me.email);
        markVerificationCodeSent();
        router.replace("/verify-email");
        return;
      }

      if (me.context?.schoolId) {
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
    const normalizedIdentifier = identifier.trim().toLowerCase();

    if (normalizedIdentifier.includes("@")) {
      setPendingResetEmail(normalizedIdentifier);
    }

    router.push(
      normalizedIdentifier.includes("@")
        ? `/forgot-password?email=${encodeURIComponent(normalizedIdentifier)}`
        : "/forgot-password"
    );
  }

  function handleSuggestedContinue() {
    if (suggested.method === "GOOGLE") {
      continueWithGoogle();
      return;
    }

    if (suggested.method === "APPLE") {
      continueWithApple();
      return;
    }

    if (suggested.method === "EMAIL" && suggested.email) {
      setIdentifier(suggested.email);
      setNotice("Enter your password to continue.");
    }
  }

  return (
    <>
      <AuthShell
        title="Welcome back"
        subtitle="Sign in to continue with Skuully."
        footer={
          <p className="text-sm text-white/50">
            New here?{" "}
            <Link href="/register" className="text-white underline underline-offset-4">
              Create account
            </Link>
          </p>
        }
      >
        <div className="space-y-4">
          {suggestedLabel ? (
            <button
              type="button"
              onClick={handleSuggestedContinue}
              className="inline-flex w-full items-center justify-center rounded-full border border-white/10 bg-white/[0.04] px-4 py-3.5 text-sm font-medium text-white transition hover:bg-white/[0.07]"
            >
              {suggestedLabel}
            </button>
          ) : null}

          <div className="grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={continueWithGoogle}
              className="inline-flex w-full items-center justify-center rounded-full border border-white/10 bg-white/[0.03] px-4 py-3.5 text-sm font-medium text-white transition hover:bg-white/[0.06]"
            >
              Continue with Google
            </button>

            <button
              type="button"
              onClick={continueWithApple}
              className="inline-flex w-full items-center justify-center rounded-full border border-white/10 bg-white/[0.03] px-4 py-3.5 text-sm font-medium text-white transition hover:bg-white/[0.06]"
            >
              Continue with Apple
            </button>
          </div>

          <div className="relative py-1">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/10" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-transparent px-3 text-xs uppercase tracking-[0.18em] text-white/35">
                Or use your password
              </span>
            </div>
          </div>

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="mb-2 block text-sm text-white/70">
                Email, phone, or Skuully ID
              </label>
              <input
                className="w-full rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3.5 text-white outline-none transition placeholder:text-white/25 focus:border-white/20 focus:bg-white/[0.05]"
                type="text"
                value={identifier}
                onChange={(event) => setIdentifier(event.target.value)}
                placeholder="you@example.com / +2547... / brandon.ab12"
                autoComplete="username"
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
        </div>
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