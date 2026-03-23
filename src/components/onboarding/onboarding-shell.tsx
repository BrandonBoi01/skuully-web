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
    <div className="min-h-screen bg-[var(--surface-0)] text-[var(--foreground)]">
      <div className="relative isolate min-h-screen overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-[var(--hero-gradient)]" />
        <div className="pointer-events-none ambient-grid absolute inset-0 opacity-[0.07]" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_100%,rgba(var(--skuully-blue),0.07),transparent_24%)]" />

        <div className="relative mx-auto flex min-h-screen w-full max-w-6xl flex-col px-4 py-8 sm:px-6 lg:px-8">
          <header className="flex items-center justify-between gap-4">
            <SkuullyLogo variant="auto" />

            <div className="flex items-center gap-4">
              <div className="hidden text-sm text-[var(--text-soft)] sm:block">
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
            <div className="glass-strong w-full rounded-[32px] p-6 sm:p-8 md:p-10">
              <div className="mb-8 flex items-start justify-between gap-4">
                <div>
                  {backHref ? (
                    <Link
                      href={backHref}
                      className="mb-5 inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--surface-2)] px-3 py-1.5 text-xs font-medium text-[var(--text-soft)] transition hover:bg-[var(--surface-3)] hover:text-[var(--text-main)]"
                    >
                      <ArrowLeft className="h-3.5 w-3.5" />
                      Back
                    </Link>
                  ) : null}

                  <h1 className="max-w-3xl text-3xl font-semibold tracking-tight text-[var(--text-strong)] sm:text-4xl">
                    {title}
                  </h1>

                  {subtitle ? (
                    <p className="mt-3 max-w-2xl text-sm leading-7 text-[var(--text-soft)] sm:text-base">
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