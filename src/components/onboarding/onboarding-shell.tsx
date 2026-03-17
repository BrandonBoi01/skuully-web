import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { ProgressDots } from "./progress-dots";
import { SkuullyLogo } from "@/components/brand/skuully-logo";

type OnboardingShellProps = {
  step: number;
  totalSteps: number;
  title: string;
  subtitle?: string;
  children: ReactNode;
  backHref?: string;
  footer?: ReactNode;
  align?: "center" | "top";
};

export function OnboardingShell({
  step,
  totalSteps,
  title,
  subtitle,
  children,
  backHref,
  footer,
  align = "center",
}: OnboardingShellProps) {
  return (
    <div className="skuully-cinematic-bg min-h-screen text-white">
      <div className="relative isolate min-h-screen overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_100%,rgba(58,109,255,0.08),transparent_24%)]" />

        <div className="relative mx-auto flex min-h-screen w-full max-w-6xl flex-col px-4 py-8 sm:px-6 lg:px-8">
          <header className="flex items-center justify-between gap-4">
            <SkuullyLogo />

            <div className="flex items-center gap-4">
              <div className="hidden text-sm text-white/45 sm:block">
                Step {step} of {totalSteps}
              </div>
              <ProgressDots total={totalSteps} current={step} />
            </div>
          </header>

          <main
            className={[
              "flex flex-1 py-8",
              align === "center" ? "items-center" : "items-start pt-14",
            ].join(" ")}
          >
            <div className="skuully-glass-card w-full rounded-[32px] p-6 sm:p-8 md:p-10">
              <div className="mb-8 flex items-start justify-between gap-4">
                <div>
                  {backHref ? (
                    <Link
                      href={backHref}
                      className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs text-white/60 transition hover:bg-white/[0.06] hover:text-white"
                    >
                      <ArrowLeft className="h-3.5 w-3.5" />
                      Back
                    </Link>
                  ) : null}

                  <h1 className="max-w-3xl text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                    {title}
                  </h1>

                  {subtitle ? (
                    <p className="mt-3 max-w-2xl text-sm leading-7 text-white/55 sm:text-base">
                      {subtitle}
                    </p>
                  ) : null}
                </div>
              </div>

              <div>{children}</div>

              {footer ? <div className="mt-8">{footer}</div> : null}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}