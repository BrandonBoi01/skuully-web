"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { AuthShell } from "@/components/auth/auth-shell";
import { PasswordField } from "@/components/auth/password-field";
import { FloatingNotice } from "@/components/ui/floating-notice";
import { GoogleIcon, AppleIcon } from "@/components/auth/social-icons";

import {
  continueWithApple,
  continueWithGoogle,
  finalizeLoginSession,
  getPendingVerificationEmail,
  getSuggestedLoginMethod,
  loginWithIdentifier,
  markVerificationCodeSent,
  setPendingResetEmail,
  setPendingVerificationEmail,
} from "@/lib/auth";

function mapLoginError(message: string) {
  const text = message.toLowerCase();

  if (text.includes("invalid credentials")) return "Incorrect email, phone, Skuully ID, or password.";
  if (text.includes("failed to fetch")) return "Couldn’t reach the server. Try again.";
  if (text.includes("request took too long")) return "The request took too long. Try again.";
  if (text.includes("google")) return "This account may use Google sign-in.";
  if (text.includes("apple")) return "This account may use Apple sign-in.";

  return "Unable to sign in right now.";
}

function SocialButton({
  onClick,
  icon,
  label,
}: {
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex h-12 w-full items-center justify-center gap-2.5 rounded-2xl border border-[var(--border)] bg-[var(--surface-1)] px-4 text-sm font-medium text-[var(--text-main)] shadow-[var(--elev-shadow-xs)] transition hover:border-[rgba(54,97,225,0.28)] hover:bg-[var(--surface-2)] hover:text-[var(--text-strong)]"
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}

export default function LoginPage() {
  const router = useRouter();

  const [identifier, setIdentifier] = useState(getPendingVerificationEmail() ?? "");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [showForgot, setShowForgot] = useState(false);
  const [isBusy, setIsBusy] = useState(false);
  const [notice, setNotice] = useState("");

  const suggested = useMemo(() => getSuggestedLoginMethod(), []);
  const suggestedLabel = useMemo(() => {
    if (suggested.method === "GOOGLE") return "Continue with Google";
    if (suggested.method === "APPLE") return "Continue with Apple";
    if (suggested.method === "EMAIL" && suggested.email) return `Continue as ${suggested.email}`;
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

        setNotice("Verification code sent.");
        router.replace("/verify-email");
        return;
      }

      const finalSession = await finalizeLoginSession();
      const me = finalSession.me;

      if (!me) {
        setError("Signed in, but your workspace could not be loaded.");
        return;
      }

      if (!me.emailVerified) {
        setPendingVerificationEmail(me.email);
        markVerificationCodeSent();
        router.replace("/verify-email");
        return;
      }

      if (me.context?.schoolId && me.context?.programId) {
        router.replace("/dashboard/control-center");
        return;
      }

      router.replace("/onboarding");
    } catch (err) {
      setError(
        err instanceof Error ? mapLoginError(err.message) : "Unable to sign in right now."
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
    if (suggested.method === "GOOGLE") return continueWithGoogle();
    if (suggested.method === "APPLE") return continueWithApple();

    if (suggested.method === "EMAIL" && suggested.email) {
      setIdentifier(suggested.email);
      setNotice("Enter your password to continue.");
    }
  }

  return (
    <>
      <AuthShell
        title="Welcome back"
        subtitle="Sign in to continue."
        panelTitle={
          <>
            Return to the
            <span className="brand-text"> future of education.</span>
          </>
        }
        panelDescription={
          <>
            Skuully brings identity, school operations, learning, and academic life
            into one calm premium system.
          </>
        }
        panelTags={["Calm workflows", "Global-ready", "Built for modern schools"]}
        footer={
          <p className="text-sm text-[var(--text-soft)]">
            New to Skuully?{" "}
            <Link
              href="/register"
              className="font-medium text-[var(--text-main)] transition hover:text-[var(--text-strong)]"
            >
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
              className="inline-flex h-12 w-full items-center justify-center rounded-2xl border border-[rgba(54,97,225,0.32)] bg-[var(--brand-gradient-soft)] px-4 text-sm font-semibold text-[var(--text-strong)] shadow-[var(--elev-shadow-sm)] transition hover:brightness-105"
            >
              {suggestedLabel}
            </button>
          ) : null}

          <div className="grid gap-3 sm:grid-cols-2">
            <SocialButton
              onClick={continueWithGoogle}
              icon={<GoogleIcon className="h-5 w-5" />}
              label="Google"
            />

            <SocialButton
              onClick={continueWithApple}
              icon={<AppleIcon className="h-5 w-5" />}
              label="Apple"
            />
          </div>

          <div className="relative py-1.5">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[var(--border)]" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-[var(--surface-1)] px-3 text-[10px] font-medium uppercase tracking-[0.22em] text-[var(--text-faint)]">
                Continue with password
              </span>
            </div>
          </div>

          <form className="space-y-4" onSubmit={handleSubmit}>
            <input
              className="h-12 w-full rounded-2xl border border-[var(--border)] bg-[var(--surface-1)] px-4 text-[15px] text-[var(--foreground)] outline-none transition placeholder:text-[var(--text-faint)] focus:border-[rgba(54,97,225,0.36)] focus:bg-[var(--surface-2)] focus:ring-4 focus:ring-[var(--ring)]"
              type="text"
              value={identifier}
              onChange={(event) => setIdentifier(event.target.value)}
              placeholder="Email, phone, or Skuully ID"
              autoComplete="username"
              required
            />

            <div>
              <div className="mb-2 flex items-center justify-between">
                <span className="text-sm font-medium text-[var(--text-main)]">
                  Password
                </span>
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  className="text-sm text-[var(--text-soft)] transition hover:text-[var(--text-main)]"
                >
                  Forgot password?
                </button>
              </div>

              <PasswordField
                label=""
                value={password}
                onChange={setPassword}
                placeholder="Enter password"
                autoComplete="current-password"
                required
              />
            </div>

            {error ? (
              <div className="rounded-2xl border border-[rgba(198,38,74,0.24)] bg-[rgba(198,38,74,0.10)] px-4 py-3 text-sm text-[var(--text-main)] dark:text-rose-100">
                {error}
              </div>
            ) : null}

            {showForgot ? (
              <button
                type="button"
                onClick={handleForgotPassword}
                className="text-sm font-medium text-[var(--text-main)] transition hover:text-[var(--text-strong)]"
              >
                Reset password
              </button>
            ) : null}

            <button
              type="submit"
              disabled={isBusy}
              className="skuully-cta h-12 w-full rounded-2xl px-4 text-sm font-semibold tracking-[-0.01em] disabled:cursor-not-allowed disabled:opacity-55"
            >
              <span>{isBusy ? "Signing in..." : "Sign in"}</span>
            </button>
          </form>
        </div>
      </AuthShell>

      <FloatingNotice show={!!notice} message={notice} tone="success" position="bottom-left" />
    </>
  );
}