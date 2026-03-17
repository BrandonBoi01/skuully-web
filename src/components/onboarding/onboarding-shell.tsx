import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { ProgressDots } from "./progress-dots";
import { SkuullyLogo } from "@/components/brand/skuully-logo";

type OnboardingShellProps = {
  step: number;
  totalSteps: number;
  children: ReactNode;
  onBackHref?: string;
  footer?: ReactNode;
};

export function OnboardingShell({
  step,
  totalSteps,
  children,
  onBackHref,
  footer,
}: OnboardingShellProps) {
  return (
    <div className="min-h-screen bg-[#060816] text-white">
      <div className="relative isolate min-h-screen overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(54,97,225,0.18),transparent_30%),radial-gradient(circle_at_82%_18%,rgba(165,94,149,0.10),transparent_28%),linear-gradient(180deg,#050816_0%,#070b1d_48%,#050816_100%)]" />

        <div className="relative mx-auto flex min-h-screen w-full max-w-5xl flex-col px-4 py-8 sm:px-6 lg:px-8">
          <header className="flex items-center justify-between gap-4">
            <SkuullyLogo />

            <div className="flex items-center gap-4">
              <div className="hidden text-sm text-white/45 sm:block">
                Step {step} of {totalSteps}
              </div>
              <ProgressDots total={totalSteps} current={step} />
            </div>
          </header>

          <main className="flex flex-1 items-center py-8">
            <div className="w-full rounded-[32px] border border-white/10 bg-white/[0.04] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.28)] backdrop-blur-2xl sm:p-8 md:p-10">
              {onBackHref ? (
                <div className="mb-8">
                  <Link
                    href={onBackHref}
                    className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs text-white/60 transition hover:bg-white/[0.06] hover:text-white"
                  >
                    <ArrowLeft className="h-3.5 w-3.5" />
                    Back
                  </Link>
                </div>
              ) : null}

              {children}

              {footer ? <div className="mt-8">{footer}</div> : null}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}