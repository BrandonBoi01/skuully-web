"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getMe } from "@/lib/auth";
import { SkuullyLogo } from "@/components/brand/skuully-logo";

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;

    async function bootstrap() {
      try {
        const me = await getMe();

        if (cancelled) return;

        if (!me) {
          router.replace("/login");
          return;
        }

        if (!me.emailVerified) {
          router.replace("/verify-email");
          return;
        }

        if (me.context?.schoolId && me.context?.programId) {
          router.replace("/dashboard/control-center");
          return;
        }

        router.replace("/onboarding");
      } catch {
        if (cancelled) return;
        router.replace("/login");
      }
    }

    void bootstrap();

    return () => {
      cancelled = true;
    };
  }, [router]);

  return (
    <main className="relative flex min-h-screen items-center justify-center px-6">
      <div className="glass-strong flex w-full max-w-md flex-col items-center rounded-[32px] px-8 py-10 text-center">
        <SkuullyLogo variant="auto" width={148} height={34} priority />
        <div className="mt-6 h-10 w-10 rounded-full border border-[var(--border)] border-t-[rgb(var(--skuully-blue))] animate-spin" />
        <p className="mt-5 text-sm font-medium text-[var(--text-main)]">
          Opening Skuully
        </p>
        <p className="mt-1 text-xs text-[var(--text-soft)]">
          Preparing your workspace
        </p>
      </div>
    </main>
  );
}