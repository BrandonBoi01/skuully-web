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
  markVerificationCodeSent,
  registerWithEmail,
  setPendingVerificationEmail,
} from "@/lib/auth";

function mapRegisterError(message: string) {
  const text = message.toLowerCase();

  if (text.includes("email already in use")) {
    return "That email is already in use. Sign in instead, or continue with Google or Apple if you used one of them before.";
  }

  if (text.includes("full name is required")) {
    return "Enter your full name.";
  }

  if (text.includes("invalid email")) {
    return "Enter a valid email address.";
  }

  if (text.includes("uppercase")) {
    return "Your password needs an uppercase letter.";
  }

  if (text.includes("lowercase")) {
    return "Your password needs a lowercase letter.";
  }

  if (text.includes("number")) {
    return "Your password needs a number.";
  }

  if (text.includes("special character")) {
    return "Your password needs a special character.";
  }

  if (text.includes("request took too long")) {
    return "The server took too long to respond. Please try again.";
  }

  if (text.includes("failed to fetch")) {
    return "Could not reach the server. Check that your API is running.";
  }

  return "We couldn’t create your account.";
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
      setError("Create a stronger password to continue.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Your passwords don’t match.");
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
      setNotice("A verification code is on its way to your email.");
      router.replace("/verify-email");
    } catch (err) {
      setError(
        err instanceof Error
          ? mapRegisterError(err.message)
          : "We couldn’t create your account."
      );
    } finally {
      setIsBusy(false);
    }
  }

  return (
    <>
      <AuthShell
        title="Create account"
        subtitle="Start with one secure identity."
        footer={
          <p className="text-sm text-white/50">
            Already have an account?{" "}
            <Link
              href="/login"
              className="text-white underline underline-offset-4"
            >
              Sign in
            </Link>
          </p>
        }
      >
        <div className="space-y-4">
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
                Or create with email
              </span>
            </div>
          </div>

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="mb-2 block text-sm text-white/70">
                Full name
              </label>
              <input
                className="w-full rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3.5 text-white outline-none transition placeholder:text-white/25 focus:border-white/20 focus:bg-white/[0.05]"
                type="text"
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
                placeholder="Brandon Boi"
                autoComplete="name"
                required
              />
            </div>

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

            <PasswordField
              label="Password"
              value={password}
              onChange={setPassword}
              placeholder="Create a password"
              autoComplete="new-password"
              required
            />

            <PasswordField
              label="Confirm password"
              value={confirmPassword}
              onChange={setConfirmPassword}
              placeholder="Repeat your password"
              autoComplete="new-password"
              required
              invalid={passwordsMismatch}
              hint={passwordsMismatch ? "Passwords do not match yet." : ""}
            />

            <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white/45">
              <div className={passwordChecks.min ? "text-white/75" : ""}>
                • At least 8 characters
              </div>
              <div className={passwordChecks.upper ? "text-white/75" : ""}>
                • One uppercase letter
              </div>
              <div className={passwordChecks.lower ? "text-white/75" : ""}>
                • One lowercase letter
              </div>
              <div className={passwordChecks.number ? "text-white/75" : ""}>
                • One number
              </div>
              <div className={passwordChecks.special ? "text-white/75" : ""}>
                • One special character
              </div>
            </div>

            {error ? (
              <div className="rounded-2xl border border-rose-400/20 bg-rose-400/10 px-4 py-3 text-sm text-rose-100">
                {error}
              </div>
            ) : null}

            <button
              type="submit"
              disabled={isBusy}
              className="inline-flex w-full items-center justify-center rounded-full bg-white px-4 py-3.5 text-sm font-medium text-black transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isBusy ? "Creating account..." : "Create account"}
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