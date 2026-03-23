"use client";

import Link from "next/link";
import { FormEvent, Suspense, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AuthShell } from "@/components/auth/auth-shell";
import { PasswordField } from "@/components/auth/password-field";
import { FloatingNotice } from "@/components/ui/floating-notice";
import { resetPassword } from "@/lib/auth";

function PasswordRule({
  ok,
  label,
}: {
  ok: boolean;
  label: string;
}) {
  return (
    <div
      className={[
        "rounded-full px-2.5 py-1 text-[11px] font-medium transition",
        ok
          ? "bg-[rgba(var(--skuully-blue),0.12)] text-[var(--text-main)]"
          : "bg-[var(--muted)] text-[var(--text-soft)]",
      ].join(" ")}
    >
      {label}
    </div>
  );
}

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
      setError("Invalid reset link.");
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
      const result = await resetPassword(token, password);
      setNotice(result.message);
      setTimeout(() => {
        router.replace("/login");
      }, 1200);
    } catch {
      setError("This reset link is invalid or expired.");
    } finally {
      setIsBusy(false);
    }
  }

  return (
    <>
      <AuthShell
        compact
        title="Create new password"
        subtitle="Use a strong password for your account."
        footer={
          <p className="text-center text-sm text-[var(--text-soft)]">
            Back to{" "}
            <Link
              href="/login"
              className="font-medium text-[var(--text-main)] transition hover:text-[var(--text-strong)]"
            >
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
            placeholder="Create password"
            autoComplete="new-password"
            required
          />

          <PasswordField
            label="Confirm password"
            value={confirmPassword}
            onChange={setConfirmPassword}
            placeholder="Repeat password"
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
          </div>

          {error ? (
            <div className="rounded-2xl border border-[rgba(198,38,74,0.18)] bg-[rgba(198,38,74,0.10)] px-4 py-3 text-sm text-[var(--text-main)]">
              {error}
            </div>
          ) : null}

          <button
            type="submit"
            disabled={isBusy}
            className="skuully-cta h-12 w-full rounded-2xl px-4 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-55"
          >
            <span>{isBusy ? "Updating..." : "Update password"}</span>
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