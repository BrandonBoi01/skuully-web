import Link from "next/link";
import { SkuullyLogo } from "@/components/brand/skuully-logo";

type AuthShellProps = {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
};

export function AuthShell({
  eyebrow,
  title,
  subtitle,
  children,
  footer,
}: AuthShellProps) {
  return (
    <div className="min-h-screen bg-black text-white">
      <div className="relative isolate min-h-screen overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(80,90,255,0.14),transparent_28%),linear-gradient(180deg,#050505_0%,#080808_45%,#050505_100%)]" />
        <div className="pointer-events-none absolute inset-0 opacity-[0.08] [background-image:linear-gradient(rgba(255,255,255,0.06)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.06)_1px,transparent_1px)] [background-size:48px_48px]" />

        <div className="relative mx-auto flex min-h-screen max-w-6xl flex-col px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <SkuullyLogo
              href="/"
              variant="long-white"
              width={150}
              height={34}
              priority
            />

            <Link
              href="https://skuully.org"
              className="text-sm text-white/45 transition hover:text-white/75"
            >
              Visit website
            </Link>
          </div>

          <div className="flex flex-1 items-center justify-center py-8">
            <div className="grid w-full max-w-6xl gap-8 lg:grid-cols-[1.1fr_0.9fr]">
              <div className="hidden lg:flex lg:flex-col lg:justify-center">
                <div className="max-w-xl">
                  {eyebrow ? (
                    <div className="inline-flex items-center rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-xs uppercase tracking-[0.18em] text-white/45">
                      {eyebrow}
                    </div>
                  ) : null}

                  <h1 className="mt-6 text-5xl font-semibold tracking-tight text-white">
                    One platform for academic life.
                  </h1>

                  <p className="mt-5 max-w-lg text-base leading-8 text-white/50">
                    Identity, institutions, learning, and community — shaped
                    into one calm system.
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-center">
                <div className="w-full max-w-md rounded-[32px] border border-white/10 bg-white/[0.04] p-6 shadow-[0_10px_50px_rgba(0,0,0,0.35)] backdrop-blur-xl sm:p-8">
                  <div className="mb-8">
                    {eyebrow ? (
                      <div className="text-xs uppercase tracking-[0.18em] text-white/40">
                        {eyebrow}
                      </div>
                    ) : null}

                    <h2 className="mt-3 text-3xl font-semibold tracking-tight text-white">
                      {title}
                    </h2>

                    {subtitle ? (
                      <p className="mt-3 text-sm leading-7 text-white/48">
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
        </div>
      </div>
    </div>
  );
}