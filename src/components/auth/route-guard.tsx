"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

import { getMe, type MeResponse } from "@/lib/auth";

type GuardMode =
  | "guest-only"
  | "verified-only"
  | "onboarding-only"
  | "dashboard-only"
  | "verify-email-only";

type RouteGuardProps = {
  mode: GuardMode;
  children: React.ReactNode;
  loadingTitle?: string;
  loadingSubtitle?: string;
};

function FullPageLoader({
  title = "Checking your session...",
  subtitle = "Please wait a moment.",
}: {
  title?: string;
  subtitle?: string;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--surface-0)] px-4">
      <div className="glass rounded-[28px] border border-[var(--border)] px-6 py-5 text-center shadow-[var(--elev-shadow-sm)]">
        <div className="text-sm font-medium text-[var(--text-main)]">{title}</div>
        <div className="mt-1 text-sm text-[var(--text-soft)]">{subtitle}</div>
      </div>
    </div>
  );
}

function hasWorkspaceContext(me: MeResponse | null) {
  return Boolean(me?.context?.schoolId && me?.context?.programId);
}

function isAuthenticated(me: MeResponse | null) {
  return Boolean(me?.id);
}

function isVerified(me: MeResponse | null) {
  return Boolean(me?.emailVerified);
}

export function RouteGuard({
  mode,
  children,
  loadingTitle,
  loadingSubtitle,
}: RouteGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const hasNavigatedRef = useRef(false);

  const [ready, setReady] = useState(false);
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      try {
        const me = await getMe();

        if (cancelled || hasNavigatedRef.current) return;

        const authed = isAuthenticated(me);
        const verified = isVerified(me);
        const workspaceReady = hasWorkspaceContext(me);

        if (mode === "guest-only") {
          if (!authed) {
            setAllowed(true);
            setReady(true);
            return;
          }

          if (!verified) {
            hasNavigatedRef.current = true;
            router.replace("/verify-email");
            return;
          }

          if (workspaceReady) {
            hasNavigatedRef.current = true;
            router.replace("/dashboard/control-center");
            return;
          }

          hasNavigatedRef.current = true;
          router.replace("/onboarding");
          return;
        }

        if (mode === "verified-only") {
          if (!authed) {
            hasNavigatedRef.current = true;
            router.replace("/login");
            return;
          }

          if (!verified) {
            hasNavigatedRef.current = true;
            router.replace("/verify-email");
            return;
          }

          setAllowed(true);
          setReady(true);
          return;
        }

        if (mode === "verify-email-only") {
          if (!authed) {
            hasNavigatedRef.current = true;
            router.replace("/login");
            return;
          }

          if (verified) {
            if (workspaceReady) {
              hasNavigatedRef.current = true;
              router.replace("/dashboard/control-center");
              return;
            }

            hasNavigatedRef.current = true;
            router.replace("/onboarding");
            return;
          }

          setAllowed(true);
          setReady(true);
          return;
        }

        if (mode === "onboarding-only") {
          if (!authed) {
            hasNavigatedRef.current = true;
            router.replace("/login");
            return;
          }

          if (!verified) {
            hasNavigatedRef.current = true;
            router.replace("/verify-email");
            return;
          }

          if (workspaceReady) {
            hasNavigatedRef.current = true;
            router.replace("/dashboard/control-center");
            return;
          }

          setAllowed(true);
          setReady(true);
          return;
        }

        if (mode === "dashboard-only") {
          if (!authed) {
            hasNavigatedRef.current = true;
            router.replace("/login");
            return;
          }

          if (!verified) {
            hasNavigatedRef.current = true;
            router.replace("/verify-email");
            return;
          }

          if (!workspaceReady) {
            hasNavigatedRef.current = true;
            router.replace("/onboarding");
            return;
          }

          setAllowed(true);
          setReady(true);
          return;
        }

        setAllowed(false);
        setReady(true);
      } catch {
        if (cancelled || hasNavigatedRef.current) return;

        if (pathname !== "/login") {
          hasNavigatedRef.current = true;
          router.replace("/login");
          return;
        }

        setAllowed(true);
        setReady(true);
      }
    }

    void run();

    return () => {
      cancelled = true;
    };
  }, [mode, pathname, router]);

  if (!ready || !allowed) {
    return (
      <FullPageLoader
        title={loadingTitle}
        subtitle={loadingSubtitle}
      />
    );
  }

  return <>{children}</>;
}