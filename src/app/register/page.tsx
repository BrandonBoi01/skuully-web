"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Apple } from "lucide-react";

import { AuthShell } from "@/components/auth/auth-shell";
import { PasswordField } from "@/components/auth/password-field";
import { FloatingNotice } from "@/components/ui/floating-notice";

import {
  continueWithApple,
  continueWithGoogle,
  markVerificationCodeSent,
  registerWithEmail,
  setPendingVerificationEmail,
} from "@/lib/auth";

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0" aria-hidden="true">
      <path fill="#EA4335" d="M12 10.2v3.9h5.5c-.2 1.3-1.5 3.9-5.5 3.9-3.3 0-6-2.8-6-6.2s2.7-6.2 6-6.2c1.9 0 3.1.8 3.8 1.5l2.6-2.5C16.8 3 14.6 2 12 2 6.9 2 2.8 6.4 2.8 11.8S6.9 21.5 12 21.5c6.9 0 9.2-5 9.2-7.5 0-.5 0-.9-.1-1.3H12Z" />
      <path fill="#34A853" d="M3.8 7.1l3.2 2.4C7.8 7.7 9.7 6.3 12 6.3c1.9 0 3.1.8 3.8 1.5l2.6-2.5C16.8 3 14.6 2 12 2 8 2 4.6 4.2 3 7.4l.8-.3Z" />
      <path fill="#FBBC05" d="M12 21.5c2.5 0 4.7-.9 6.2-2.4l-3-2.4c-.8.6-1.9 1.1-3.3 1.1-3.9 0-5.2-2.6-5.5-3.8l-3.1 2.4C4.5 19.4 8 21.5 12 21.5Z" />
      <path fill="#4285F4" d="M21.2 12.7H12v3.9h5.5c-.3 1.1-1.1 2-2.2 2.7l3 2.4c1.8-1.7 2.9-4.2 2.9-7.4 0-.5 0-1-.1-1.6Z" />
    </svg>
  );
}

function mapRegisterError(message: string) {
  const text = message.toLowerCase();

  if (text.includes("email already in use")) return "That email is already in use.";
  if (text.includes("full name is required")) return "Enter your full name.";
  if (text.includes("invalid email")) return "Enter a valid email address.";
  if (text.includes("uppercase")) return "Password needs an uppercase letter.";
  if (text.includes("lowercase")) return "Password needs a lowercase letter.";
  if (text.includes("number")) return "Password needs a number.";
  if (text.includes("special character")) return "Password needs a special character.";
  if (text.includes("request took too long")) return "The server took too long. Try again.";
  if (text.includes("failed to fetch")) return "Could not reach the server.";

  return "Unable to create your account.";
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

function PasswordRule({ ok, label }: { ok: boolean; label: string }) {
  return (
    <div
      className={[
        "rounded-full px-2.5 py-1 text-[11px] font-medium transition",
        ok
          ? "bg-[rgba(var(--skuully-blue),0.14)] text-[var(--text-main)]"
          : "bg-[var(--muted)] text-[var(--text-soft)]",
      ].join(" ")}
    >
      {label}
    </div>
  );
}

export default function RegisterPage() {
  const router = useRouter();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isBusy, setIsBusy] = useState(false);
  const [notice, setNotice] = useState("");

  const passwordChecks = useMemo(
    () => ({
      min: password.length >= 8,
      upper: /[A-Z]/.test(password),
      lower: /[a-z]/.test(password),
      number: /\d/.test(password),
      special: /[^A-Za-z0-9]/.test(password),
    }),
    [password]
  );

  const passwordIsStrong =
    passwordChecks.min &&
    passwordChecks.upper &&
    passwordChecks.lower &&
    passwordChecks.number &&
    passwordChecks.special;

  const passwordsMismatch =
    confirmPassword.length > 0 && password !== confirmPassword;

  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(""), 3200);
    return () => window.clearTimeout(timer);
  }, [notice]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (fullName.trim().length < 2) {
      setError("Enter your full name.");
      return;
    }

    if (!passwordIsStrong) {
      setError("Create a stronger password.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setIsBusy(true);

    try {
      const result = await registerWithEmail({
        fullName: fullName.trim(),
        email: email.trim().toLowerCase(),
        password,
      });

      setPendingVerificationEmail(result.user.email);
      markVerificationCodeSent();
      setNotice("Verification code sent.");
      router.replace("/verify-email");
    } catch (err) {
      setError(
        err instanceof Error
          ? mapRegisterError(err.message)
          : "Unable to create your account."
      );
    } finally {
      setIsBusy(false);
    }
  }

  return (
    <>
      <AuthShell
        title="Create your account"
        subtitle="One secure identity for everything Skuully."
        panelTitle={
          <>
            Start your journey in the
            <span className="brand-text"> future of education.</span>
          </>
        }
        panelDescription={
          <>
            Create your Skuully identity once and move into onboarding, learning,
            operations, and school life with a single foundation.
          </>
        }
        panelTags={["Secure identity", "Premium onboarding", "Built for modern schools"]}
        footer={
          <p className="text-sm text-[var(--text-soft)]">
            Already have an account?{" "}
            <Link
              href="/login"
              className="font-medium text-[var(--text-main)] transition hover:text-[var(--text-strong)]"
            >
              Sign in
            </Link>
          </p>
        }
      >
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <SocialButton onClick={continueWithGoogle} icon={<GoogleIcon />} label="Google" />
            <SocialButton
              onClick={continueWithApple}
              icon={<Apple className="h-4 w-4 shrink-0" />}
              label="Apple"
            />
          </div>

          <div className="relative py-1.5">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[var(--border)]" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-[var(--surface-1)] px-3 text-[10px] font-medium uppercase tracking-[0.22em] text-[var(--text-faint)]">
                Continue with email
              </span>
            </div>
          </div>

          <form className="space-y-4" onSubmit={handleSubmit}>
            <input
              className="h-12 w-full rounded-2xl border border-[var(--border)] bg-[var(--surface-1)] px-4 text-sm text-[var(--foreground)] outline-none transition placeholder:text-[var(--text-faint)] focus:border-[rgba(54,97,225,0.36)] focus:bg-[var(--surface-2)] focus:ring-4 focus:ring-[var(--ring)]"
              type="text"
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
              placeholder="Full name"
              autoComplete="name"
              required
            />

            <input
              className="h-12 w-full rounded-2xl border border-[var(--border)] bg-[var(--surface-1)] px-4 text-sm text-[var(--foreground)] outline-none transition placeholder:text-[var(--text-faint)] focus:border-[rgba(54,97,225,0.36)] focus:bg-[var(--surface-2)] focus:ring-4 focus:ring-[var(--ring)]"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="Email address"
              autoComplete="email"
              required
            />

            <PasswordField
              label=""
              value={password}
              onChange={setPassword}
              placeholder="Create password"
              autoComplete="new-password"
              required
            />

            <PasswordField
              label=""
              value={confirmPassword}
              onChange={setConfirmPassword}
              placeholder="Confirm password"
              autoComplete="new-password"
              required
              invalid={passwordsMismatch}
              hint={passwordsMismatch ? "Passwords do not match." : ""}
            />

            <div className="flex flex-wrap gap-2 rounded-2xl border border-[var(--border)] bg-[var(--surface-1)] p-3">
              <PasswordRule ok={passwordChecks.min} label="8+ chars" />
              <PasswordRule ok={passwordChecks.upper} label="Uppercase" />
              <PasswordRule ok={passwordChecks.lower} label="Lowercase" />
              <PasswordRule ok={passwordChecks.number} label="Number" />
              <PasswordRule ok={passwordChecks.special} label="Special" />
            </div>

            {error ? (
              <div className="rounded-2xl border border-[rgba(198,38,74,0.2)] bg-[rgba(198,38,74,0.10)] px-4 py-3 text-sm text-[var(--text-main)] dark:text-rose-100">
                {error}
              </div>
            ) : null}

            <button
              type="submit"
              disabled={isBusy}
              className="skuully-cta h-12 w-full rounded-2xl px-4 text-sm font-semibold tracking-[-0.01em] disabled:cursor-not-allowed disabled:opacity-55"
            >
              <span>{isBusy ? "Creating account..." : "Create account"}</span>
            </button>
          </form>
        </div>
      </AuthShell>

      <FloatingNotice show={!!notice} message={notice} tone="success" position="bottom-left" />
    </>
  );
}