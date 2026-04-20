"use client";

import type { ReactNode } from "react";
import Link from "next/link";

type OnboardingLayoutProps = {
  title: string;
  subtitle?: string;
  step?: number;
  totalSteps?: number;
  children: ReactNode;
  footer?: ReactNode;
  backHref?: string;
};

export function OnboardingLayout({
  title,
  subtitle,
  step,
  totalSteps,
  children,
  footer,
  backHref,
}: OnboardingLayoutProps) {
  const progress =
    step && totalSteps ? Math.max(0, Math.min(100, (step / totalSteps) * 100)) : 0;

  return (
    <div className="min-h-screen bg-[var(--surface-0)] text-[var(--foreground)]">
      <div className="mx-auto flex min-h-screen w-full max-w-5xl flex-col px-4 py-6 sm:px-6 lg:px-8">
        <header className="mb-8 flex items-center justify-between border-b border-[var(--border)] pb-4">
          <div className="min-w-0">
            <div className="text-sm font-semibold tracking-[0.08em] text-[var(--text-soft)] uppercase">
              Skuully
            </div>
          </div>

          {backHref ? (
            <Link
              href={backHref}
              className="text-sm text-[var(--text-soft)] transition hover:text-[var(--text-main)]"
            >
              Back
            </Link>
          ) : null}
        </header>

        <div className="mx-auto w-full max-w-3xl">
          {step && totalSteps ? (
            <div className="mb-6">
              <div className="mb-2 flex items-center justify-between text-sm text-[var(--text-soft)]">
                <span>
                  Step {step} of {totalSteps}
                </span>
                <span>{Math.round(progress)}%</span>
              </div>

              <div className="h-2 rounded-full bg-[var(--surface-2)]">
                <div
                  className="h-2 rounded-full bg-[var(--primary)] transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          ) : null}

          <div className="mb-6">
            <h1 className="text-3xl font-semibold tracking-tight text-[var(--text-strong)] sm:text-4xl">
              {title}
            </h1>

            {subtitle ? (
              <p className="mt-3 max-w-2xl text-base leading-7 text-[var(--text-soft)]">
                {subtitle}
              </p>
            ) : null}
          </div>

          <div className="rounded-3xl border border-[var(--border)] bg-[var(--surface-1)] shadow-[var(--elev-shadow-sm)]">
            <div className="p-5 sm:p-8">{children}</div>

            {footer ? (
              <div className="border-t border-[var(--border)] px-5 py-4 sm:px-8">
                {footer}
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}