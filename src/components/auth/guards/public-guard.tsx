"use client";

import { useAuth } from "@/lib/auth-query";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export function PublicOnlyGuard({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && user) {
      router.replace("/onboarding");
    }
  }, [isLoading, user, router]);

  if (isLoading) return null;

  return <>{children}</>;
}