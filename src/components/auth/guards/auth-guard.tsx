"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";

import { AUTH_ME_QUERY_KEY, fetchAuthMe } from "@/lib/auth-query";

type AuthGuardProps = {
  children: React.ReactNode;
  requireVerifiedEmail?: boolean;
  requireInstitutionContext?: boolean;
};

export type RouteGuardMode =
  | "guest-only"
  | "verify-email-only"
  | "protected";

type RouteGuardProps = {
  children: React.ReactNode;
  mode?: RouteGuardMode;
  loadingTitle?: string;
  loadingSubtitle?: string;
};

function GuardLoading({
  title = "Checking your account...",
  subtitle,
}: {
  title?: string;
  subtitle?: string;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--surface-0)] px-6 text-[var(--text-main)]">
      <div className="w-full max-w-md rounded-2xl border border-[var(--border)] bg-[var(--surface-1)] p-6 shadow-[var(--elev-shadow-sm)]">
        <div className="text-sm font-medium text-[var(--text-main)]">{title}</div>
        {subtitle ? (
          <div className="mt-2 text-sm text-[var(--text-soft)]">{subtitle}</div>
        ) : null}
      </div>
    </div>
  );
}

export function AuthGuard({
  children,
  requireVerifiedEmail = false,
  requireInstitutionContext = false,
}: AuthGuardProps) {
  const router = useRouter();

  const { data, isLoading, isFetched } = useQuery({
    queryKey: AUTH_ME_QUERY_KEY,
    queryFn: fetchAuthMe,
    staleTime: 5 * 60 * 1000,
  });

  useEffect(() => {
    if (!isFetched || isLoading) return;

    if (!data) {
      router.replace("/login");
      return;
    }

    if (requireVerifiedEmail && !data.emailVerified) {
      router.replace("/verify-email");
      return;
    }

    if (requireInstitutionContext && !data.context?.institutionId) {
      router.replace("/onboarding");
    }
  }, [
    data,
    isFetched,
    isLoading,
    requireInstitutionContext,
    requireVerifiedEmail,
    router,
  ]);

  if (isLoading || !isFetched) {
    return <GuardLoading title="Checking your account..." />;
  }

  if (!data) {
    return null;
  }

  if (requireVerifiedEmail && !data.emailVerified) {
    return null;
  }

  if (requireInstitutionContext && !data.context?.institutionId) {
    return null;
  }

  return <>{children}</>;
}

export function RouteGuard({
  children,
  mode = "guest-only",
  loadingTitle,
  loadingSubtitle,
}: RouteGuardProps) {
  const router = useRouter();
  const pathname = usePathname();

  const { data: me, isLoading, isFetched } = useQuery({
    queryKey: AUTH_ME_QUERY_KEY,
    queryFn: fetchAuthMe,
    staleTime: 5 * 60 * 1000,
  });

  useEffect(() => {
    if (!isFetched || isLoading) return;

    if (mode === "guest-only") {
      if (!me) return;

      if (!me.emailVerified && pathname !== "/verify-email") {
        router.replace("/verify-email");
        return;
      }

      if (me.context?.institutionId) {
        router.replace("/dashboard/control-center");
        return;
      }

      router.replace("/onboarding");
      return;
    }

    if (mode === "verify-email-only") {
      if (!me) {
        router.replace("/login");
        return;
      }

      if (me.emailVerified) {
        if (me.context?.institutionId) {
          router.replace("/dashboard/control-center");
          return;
        }

        router.replace("/onboarding");
        return;
      }

      return;
    }

    if (mode === "protected") {
      if (!me) {
        router.replace("/login");
        return;
      }
    }
  }, [isFetched, isLoading, me, mode, pathname, router]);

  if (isLoading || !isFetched) {
    return <GuardLoading title={loadingTitle} subtitle={loadingSubtitle} />;
  }

  if (mode === "guest-only") {
    if (me) return null;
    return <>{children}</>;
  }

  if (mode === "verify-email-only") {
    if (!me) return null;
    if (me.emailVerified) return null;
    return <>{children}</>;
  }

  if (mode === "protected") {
    if (!me) return null;
    return <>{children}</>;
  }

  return <>{children}</>;
}