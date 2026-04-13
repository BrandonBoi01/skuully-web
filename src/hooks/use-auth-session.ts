"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchAuthMe, AUTH_ME_QUERY_KEY } from "@/lib/auth-query";
import type { MeResponse } from "@/lib/auth";

export function useAuthSession() {
  return useQuery<MeResponse | null>({
    queryKey: AUTH_ME_QUERY_KEY,
    queryFn: fetchAuthMe,
    staleTime: 60 * 1000,
    gcTime: 10 * 60 * 1000,
    retry: false,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });
}