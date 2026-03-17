"use client";

import { ReactNode } from "react";

type OnboardingShellProps = {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  footer?: ReactNode;
  children: ReactNode;
};

export function OnboardingShell({
  eyebrow,
  title,
  subtitle,
  footer,
  children,
}: OnboardingShellProps) {
  return (
    <div className="min-h-screen bg-[#060816] text-white">
      <div className="relative isolate min-h-screen overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(54,97,225,0.18),transparent_30%),radial-gradient(circle_at_82%_18%,rgba(165,94,149,0.10),transparent_28%),linear-gradient(180deg,#050816_0%,#070b1d_48%,#050816_100%)]" />

        <div className="relative mx-auto flex min-h-screen w-full max-w-5xl items-center px-4 py-10 sm:px-6 lg:px-8">
          <div className="w-full rounded-[32px] border border-white/10 bg-white/[0.05] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.28)] backdrop-blur-2xl sm:p-8 md:p-10">
            <div className="mx-auto max-w-3xl">
              {eyebrow ? (
                <div className="inline-flex items-center rounded-full border border-[rgba(54,97,225,0.22)] bg-[rgba(54,97,225,0.08)] px-3 py-1 text-xs text-[rgba(180,198,255,0.92)]">
                  {eyebrow}
                </div>
              ) : null}

              <h1 className="mt-5 text-3xl font-semibold tracking-tight text-white sm:text-4xl md:text-5xl">
                {title}
              </h1>

              {subtitle ? (
                <p className="mt-4 max-w-2xl text-sm leading-7 text-white/58 sm:text-base">
                  {subtitle}
                </p>
              ) : null}

              <div className="mt-8">{children}</div>

              {footer ? <div className="mt-8">{footer}</div> : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}