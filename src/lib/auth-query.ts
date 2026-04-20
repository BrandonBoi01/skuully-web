"use client";

import { useQuery, useQueryClient, type QueryClient } from "@tanstack/react-query";
import { getMe, type MeResponse } from "@/lib/auth";

export const AUTH_ME_QUERY_KEY = ["auth", "me"] as const;

export async function fetchAuthMe(): Promise<MeResponse | null> {
  try {
    return await getMe();
  } catch {
    return null;
  }
}

export function useAuthQuery() {
  return useQuery<MeResponse | null>({
    queryKey: AUTH_ME_QUERY_KEY,
    queryFn: fetchAuthMe,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    retry: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
    refetchOnMount: false,
  });
}

export function useAuth() {
  const query = useAuthQuery();

  return {
    user: query.data ?? null,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
}

export function setAuthMeCache(
  queryClient: QueryClient,
  value: MeResponse | null
) {
  queryClient.setQueryData(AUTH_ME_QUERY_KEY, value);
}

export function clearAuthMeCache(queryClient: QueryClient) {
  queryClient.setQueryData(AUTH_ME_QUERY_KEY, null);
  queryClient.removeQueries({ queryKey: AUTH_ME_QUERY_KEY });
}

export function invalidateAuthMe(queryClient: QueryClient) {
  return queryClient.invalidateQueries({ queryKey: AUTH_ME_QUERY_KEY });
}

export function useAuthCache() {
  const queryClient = useQueryClient();

  return {
    set(value: MeResponse | null) {
      setAuthMeCache(queryClient, value);
    },
    clear() {
      clearAuthMeCache(queryClient);
    },
    invalidate() {
      return invalidateAuthMe(queryClient);
    },
  };
}