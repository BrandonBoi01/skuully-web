"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { GlassCard } from "@/components/glass/glass-card";
import { useAuthSession } from "@/hooks/use-auth-session";

type AuthGuardProps = {
  children: React.ReactNode;
  requireVerifiedEmail?: boolean;
  requireInstitutionContext?: boolean;
  redirectTo?: string;
};

export function AuthGuard({
  children,
  requireVerifiedEmail = true,
  requireInstitutionContext = false,
  redirectTo = "/login",
}: AuthGuardProps) {
  const router = useRouter();
  const { data: me, isLoading, isFetched } = useAuthSession();

  useEffect(() => {
    if (!isFetched || isLoading) return;

    if (!me) {
      router.replace(redirectTo);
      return;
    }

    if (requireVerifiedEmail && !me.emailVerified) {
      router.replace("/verify-email");
      return;
    }

    if (
      requireInstitutionContext &&
      (!me.context?.schoolId || !me.context?.programId)
    ) {
      router.replace("/onboarding");
    }
  }, [
    isFetched,
    isLoading,
    me,
    requireVerifiedEmail,
    requireInstitutionContext,
    redirectTo,
    router,
  ]);

  if (isLoading || !isFetched) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <GlassCard className="px-6 py-5 text-sm text-white/70">
          Checking your account...
        </GlassCard>
      </div>
    );
  }

  if (!me) return null;
  if (requireVerifiedEmail && !me.emailVerified) return null;
  if (
    requireInstitutionContext &&
    (!me.context?.schoolId || !me.context?.programId)
  ) {
    return null;
  }

  return <>{children}</>;
}