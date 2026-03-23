import Link from "next/link";
import { SkuullyLogo } from "@/components/brand/skuully-logo";
import { AuthBackground } from "@/components/effects/auth-background";

type AuthShellProps = {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  panelTitle?: React.ReactNode;
  panelDescription?: React.ReactNode;
  panelTags?: string[];
  compact?: boolean;
};

export function AuthShell({
  title,
  subtitle,
  children,
  footer,
  panelTitle,
  panelDescription,
  panelTags = [],
  compact = false,
}: AuthShellProps) {
  return (
    <div className="min-h-screen bg-[var(--surface-0)] text-[var(--foreground)]">
      <div className="relative isolate min-h-screen overflow-hidden">
        <AuthBackground />

        <div className="relative mx-auto flex min-h-screen max-w-7xl flex-col px-4 py-5 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="hidden dark:block">
              <SkuullyLogo
                href="/"
                variant="long-white"
                width={118}
                height={26}
                priority
              />
            </div>

            <div className="block dark:hidden">
              <SkuullyLogo
                href="/"
                variant="original-original-name"
                width={108}
                height={26}
                priority
              />
            </div>

            <Link
              href="https://skuully.org"
              className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-white/70 shadow-[0_8px_24px_rgba(0,0,0,0.18)] backdrop-blur-xl transition hover:border-white/20 hover:bg-white/8 hover:text-white"
            >
              Website
            </Link>
          </div>

          <div className="flex flex-1 items-center justify-center py-6 lg:py-8">
            {compact ? (
              <div className="flex w-full justify-center">
                <div className="glass-strong relative w-full max-w-[460px] overflow-hidden rounded-[28px] border border-white/10 p-5 shadow-[var(--elev-shadow-lg)] sm:p-7">
                  <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.34),transparent)]" />
                  <div className="pointer-events-none absolute -right-14 -top-14 h-32 w-32 rounded-full bg-[radial-gradient(circle,rgba(78,112,255,0.22),transparent_72%)] blur-2xl" />
                  <div className="pointer-events-none absolute -left-10 bottom-0 h-24 w-24 rounded-full bg-[radial-gradient(circle,rgba(198,38,74,0.16),transparent_72%)] blur-2xl" />

                  <div className="relative">
                    <div className="mb-6 text-center">
                      <h2 className="text-[1.85rem] font-semibold tracking-[-0.04em] text-[var(--text-strong)]">
                        {title}
                      </h2>

                      {subtitle ? (
                        <p className="mt-2 text-sm leading-6 text-[var(--text-soft)]">
                          {subtitle}
                        </p>
                      ) : null}
                    </div>

                    {children}
                    {footer ? <div className="mt-6">{footer}</div> : null}
                  </div>
                </div>
              </div>
            ) : (
              <div className="grid w-full max-w-7xl gap-10 lg:grid-cols-[1.08fr_0.92fr] lg:gap-14">
                <div className="hidden lg:flex lg:flex-col lg:justify-center">
                  <div className="max-w-[34rem]">
                    <h1 className="text-5xl font-semibold leading-[1.02] tracking-[-0.05em] text-[var(--text-strong)]">
                      {panelTitle ?? (
                        <>
                          The future of education,
                          <span className="brand-text"> beautifully connected.</span>
                        </>
                      )}
                    </h1>

                    {panelDescription ? (
                      <div className="mt-5 max-w-[32rem] text-base leading-8 text-[var(--text-soft)]">
                        {panelDescription}
                      </div>
                    ) : null}

                    {panelTags.length > 0 ? (
                      <div className="mt-7 flex flex-wrap gap-3">
                        {panelTags.map((tag) => (
                          <div
                            key={tag}
                            className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/85 shadow-[0_8px_24px_rgba(0,0,0,0.18)] backdrop-blur-xl"
                          >
                            {tag}
                          </div>
                        ))}
                      </div>
                    ) : null}
                  </div>
                </div>

                <div className="flex items-center justify-center lg:justify-end">
                  <div className="glass-strong relative w-full max-w-[460px] overflow-hidden rounded-[28px] border border-white/10 p-5 shadow-[var(--elev-shadow-lg)] sm:p-7">
                    <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.34),transparent)]" />
                    <div className="pointer-events-none absolute -right-16 -top-16 h-36 w-36 rounded-full bg-[radial-gradient(circle,rgba(78,112,255,0.20),transparent_70%)] blur-2xl" />
                    <div className="pointer-events-none absolute -left-12 bottom-0 h-28 w-28 rounded-full bg-[radial-gradient(circle,rgba(198,38,74,0.14),transparent_70%)] blur-2xl" />

                    <div className="relative">
                      <div className="mb-6">
                        <h2 className="text-[1.85rem] font-semibold tracking-[-0.04em] text-[var(--text-strong)]">
                          {title}
                        </h2>

                        {subtitle ? (
                          <p className="mt-2 text-sm leading-6 text-[var(--text-soft)]">
                            {subtitle}
                          </p>
                        ) : null}
                      </div>

                      {children}
                      {footer ? <div className="mt-6">{footer}</div> : null}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}