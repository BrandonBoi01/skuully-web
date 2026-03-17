"use client";

import Link from "next/link";
import { FormEvent, Suspense, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AuthShell } from "@/components/auth/auth-shell";
import { PasswordField } from "@/components/auth/password-field";
import { FloatingNotice } from "@/components/ui/floating-notice";
import { resetPassword } from "@/lib/auth";

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState("");
  const [isBusy, setIsBusy] = useState(false);

  const passwordChecks = useMemo(
    () => ({
      min: password.length >= 8,
      upper: /[A-Z]/.test(password),
      lower: /[a-z]/.test(password),
      number: /\d/.test(password),
    }),
    [password]
  );

  const passwordIsStrong =
    passwordChecks.min &&
    passwordChecks.upper &&
    passwordChecks.lower &&
    passwordChecks.number;

  const passwordsMismatch =
    confirmPassword.length > 0 && password !== confirmPassword;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!token) {
      setError("This reset link is missing or invalid.");
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
      const result = await resetPassword(token, password);
      setNotice(result.message);
      setTimeout(() => {
        router.replace("/login");
      }, 1200);
    } catch {
      setError("This reset link is invalid or has expired.");
    } finally {
      setIsBusy(false);
    }
  }

  return (
    <>
      <AuthShell
        title="Choose a new password"
        subtitle="Secure your Skuully identity with a fresh password."
        footer={
          <p className="text-sm text-white/50">
            Back to{" "}
            <Link href="/login" className="text-white underline underline-offset-4">
              sign in
            </Link>
          </p>
        }
      >
        <form className="space-y-4" onSubmit={handleSubmit}>
          <PasswordField
            label="New password"
            value={password}
            onChange={setPassword}
            placeholder="Create a new password"
            autoComplete="new-password"
            required
          />

          <PasswordField
            label="Confirm new password"
            value={confirmPassword}
            onChange={setConfirmPassword}
            placeholder="Repeat your new password"
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
            {isBusy ? "Updating password..." : "Update password"}
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

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetPasswordContent />
    </Suspense>
  );
}