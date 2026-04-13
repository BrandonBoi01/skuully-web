import type { QueryClient } from "@tanstack/react-query";
import { getMe, type MeResponse } from "@/lib/auth";

export const AUTH_ME_QUERY_KEY = ["auth", "me"] as const;

export async function fetchAuthMe(): Promise<MeResponse | null> {
  return getMe();
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