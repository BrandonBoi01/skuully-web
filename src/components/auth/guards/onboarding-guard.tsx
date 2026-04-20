"use client";

import { useAuth } from "@/lib/auth-query";
import { useOnboarding } from "@/lib/onboarding";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export function OnboardingGuard({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isLoading } = useAuth();
  const { data: onboarding, isLoading: onboardingLoading } =
    useOnboarding();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace("/login");
      return;
    }

    if (!onboardingLoading && onboarding?.completed) {
      router.replace("/feed");
    }
  }, [user, onboarding, isLoading, onboardingLoading, router]);

  if (isLoading || onboardingLoading || !user) return null;

  return <>{children}</>;
}