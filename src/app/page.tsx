"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getMe } from "@/lib/auth";

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
    <div className="flex min-h-screen items-center justify-center bg-[#050816] text-white">
      <div className="rounded-3xl border border-white/10 bg-white/[0.04] px-6 py-5 text-sm text-white/65 backdrop-blur-xl">
        Opening Skuully...
      </div>
    </div>
  );
}