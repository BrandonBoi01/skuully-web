"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { ProgressDots } from "./progress-dots";

type OnboardingShellProps = {
  step: number;
  totalSteps: number;
  title: string;
  subtitle?: string;
  onBack?: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
};

export function OnboardingShell({
  step,
  totalSteps,
  title,
  subtitle,
  onBack,
  children,
  footer,
}: OnboardingShellProps) {
  return (
    <div className="min-h-screen bg-black text-white">
      <div className="relative isolate min-h-screen overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(80,90,255,0.14),transparent_28%),linear-gradient(180deg,#050505_0%,#080808_45%,#050505_100%)]" />
        <div className="pointer-events-none absolute inset-0 opacity-[0.08] [background-image:linear-gradient(rgba(255,255,255,0.06)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.06)_1px,transparent_1px)] [background-size:48px_48px]" />

        <div className="relative mx-auto flex min-h-screen max-w-3xl flex-col px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {onBack ? (
                <button
                  type="button"
                  onClick={onBack}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/[0.03] text-white/70 transition hover:bg-white/[0.06] hover:text-white"
                >
                  <ArrowLeft className="h-4 w-4" />
                </button>
              ) : (
                <Link
                  href="/"
                  className="inline-flex h-10 items-center rounded-full border border-white/10 bg-white/[0.03] px-4 text-sm text-white/70 transition hover:bg-white/[0.06] hover:text-white"
                >
                  Skuully
                </Link>
              )}

              <span className="text-sm text-white/35">
                Step {step + 1} of {totalSteps}
              </span>
            </div>

            <ProgressDots total={totalSteps} current={step} />
          </div>

          <div className="flex flex-1 items-center">
            <div className="w-full rounded-[32px] border border-white/10 bg-white/[0.03] p-6 shadow-[0_10px_50px_rgba(0,0,0,0.35)] backdrop-blur-xl sm:p-8">
              <div className="mx-auto max-w-2xl">
                <div className="mb-8">
                  <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-5xl">
                    {title}
                  </h1>
                  {subtitle ? (
                    <p className="mt-3 max-w-xl text-sm leading-7 text-white/48 sm:text-base">
                      {subtitle}
                    </p>
                  ) : null}
                </div>

                <div>{children}</div>

                {footer ? <div className="mt-8">{footer}</div> : null}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}