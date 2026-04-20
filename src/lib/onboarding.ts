"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
  type QueryClient,
} from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import type {
  CountryItem,
  CreateInstitutionOnboardingInput,
  GeoCityItem,
  GeoListResponse,
  GeoSubdivisionItem,
  GeoTimezoneItem,
  OnboardingStatusResponse,
  SetProfileInput,
  StartOnboardingInput,
} from "@/lib/onboarding-types";

export const ONBOARDING_QUERY_KEY = ["onboarding", "me"] as const;

/* ---------------------------------- */
/* API CALLS                          */
/* ---------------------------------- */

export async function getOnboardingStatus() {
  return apiFetch<OnboardingStatusResponse>("/onboarding/me");
}

export async function startOnboarding(input: StartOnboardingInput) {
  return apiFetch<{
    id: string;
    userId: string;
    route: string;
    accountIntent: string;
    currentStep: string;
  }>("/onboarding/start", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function savePersonalProfile(input: SetProfileInput) {
  return apiFetch<{
    message: string;
    onboarding: {
      id: string;
      userId: string;
      route: string;
      currentStep: string;
      nationalityCodeDraft: string | null;
      residenceCountryCodeDraft: string | null;
      headlineDraft: string | null;
    };
  }>("/onboarding/profile", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function createInstitutionOnboarding(
  input: CreateInstitutionOnboardingInput
) {
  return apiFetch<{
    message: string;
    institution: unknown;
    ownerMembershipId: string;
  }>("/onboarding/institution", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function requestInstitutionJoin(input: {
  institutionId: string;
  requestType: "STUDENT" | "STAFF" | "PARENT" | "GUARDIAN" | "PARTNER";
  note?: string;
  referenceNumber?: string;
  admissionNo?: string;
  staffNo?: string;
}) {
  return apiFetch<{
    message: string;
    joinRequest: {
      id: string;
      requestType: string;
      status: string;
      createdAt: string;
      institution: {
        id: string;
        name: string;
        slug: string;
      };
    };
  }>("/onboarding/join", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function getCountries(search?: string) {
  const params = new URLSearchParams();

  if (search?.trim()) {
    params.set("search", search.trim());
  }

  const query = params.toString();

  return apiFetch<GeoListResponse<CountryItem>>(
    `/geo/countries${query ? `?${query}` : ""}`
  );
}

export async function getPhoneCountries(search?: string) {
  const params = new URLSearchParams();

  if (search?.trim()) {
    params.set("search", search.trim());
  }

  const query = params.toString();

  return apiFetch<GeoListResponse<CountryItem>>(
    `/geo/phone-countries${query ? `?${query}` : ""}`
  );
}

export async function getCountrySubdivisions(
  countryCode: string,
  search?: string
) {
  const params = new URLSearchParams();

  if (search?.trim()) {
    params.set("search", search.trim());
  }

  const query = params.toString();

  return apiFetch<GeoListResponse<GeoSubdivisionItem>>(
    `/geo/countries/${encodeURIComponent(countryCode)}/subdivisions${
      query ? `?${query}` : ""
    }`
  );
}

export async function getCountryCities(
  countryCode: string,
  input?: {
    subdivisionCode?: string;
    search?: string;
  }
) {
  const params = new URLSearchParams();

  if (input?.subdivisionCode?.trim()) {
    params.set("subdivisionCode", input.subdivisionCode.trim());
  }

  if (input?.search?.trim()) {
    params.set("search", input.search.trim());
  }

  const query = params.toString();

  return apiFetch<GeoListResponse<GeoCityItem>>(
    `/geo/countries/${encodeURIComponent(countryCode)}/cities${
      query ? `?${query}` : ""
    }`
  );
}

export async function getCountryTimezones(countryCode: string) {
  return apiFetch<GeoListResponse<GeoTimezoneItem>>(
    `/geo/countries/${encodeURIComponent(countryCode)}/timezones`
  );
}

/* ---------------------------------- */
/* QUERY HELPERS                      */
/* ---------------------------------- */

export async function fetchOnboardingStatus(): Promise<OnboardingStatusResponse | null> {
  try {
    return await getOnboardingStatus();
  } catch {
    return null;
  }
}

export function useOnboardingQuery() {
  return useQuery<OnboardingStatusResponse | null>({
    queryKey: ONBOARDING_QUERY_KEY,
    queryFn: fetchOnboardingStatus,
    staleTime: 2 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    retry: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
    refetchOnMount: false,
  });
}

export function useOnboarding() {
  const query = useOnboardingQuery();

  return {
    data: query.data ?? null,
    onboarding: query.data?.onboarding ?? null,
    memberships: query.data?.memberships ?? [],
    completed: query.data?.completed ?? false,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
}

/* ---------------------------------- */
/* CACHE HELPERS                      */
/* ---------------------------------- */

export function setOnboardingCache(
  queryClient: QueryClient,
  value: OnboardingStatusResponse | null
) {
  queryClient.setQueryData(ONBOARDING_QUERY_KEY, value);
}

export function clearOnboardingCache(queryClient: QueryClient) {
  queryClient.setQueryData(ONBOARDING_QUERY_KEY, null);
  queryClient.removeQueries({ queryKey: ONBOARDING_QUERY_KEY });
}

export function invalidateOnboarding(queryClient: QueryClient) {
  return queryClient.invalidateQueries({ queryKey: ONBOARDING_QUERY_KEY });
}

/* ---------------------------------- */
/* MUTATION HOOKS                     */
/* ---------------------------------- */

export function useStartOnboardingMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: startOnboarding,
    onSuccess: async () => {
      await invalidateOnboarding(queryClient);
    },
  });
}

export function useSavePersonalProfileMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: savePersonalProfile,
    onSuccess: async () => {
      await invalidateOnboarding(queryClient);
    },
  });
}

export function useCreateInstitutionOnboardingMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createInstitutionOnboarding,
    onSuccess: async () => {
      await invalidateOnboarding(queryClient);
    },
  });
}

export function useRequestInstitutionJoinMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: requestInstitutionJoin,
    onSuccess: async () => {
      await invalidateOnboarding(queryClient);
    },
  });
}

/* ---------------------------------- */
/* GEO QUERY HOOKS                    */
/* ---------------------------------- */

export function useCountriesQuery(search?: string) {
  return useQuery({
    queryKey: ["geo", "countries", search ?? ""],
    queryFn: () => getCountries(search),
    staleTime: 30 * 60 * 1000,
    retry: false,
  });
}

export function usePhoneCountriesQuery(search?: string) {
  return useQuery({
    queryKey: ["geo", "phone-countries", search ?? ""],
    queryFn: () => getPhoneCountries(search),
    staleTime: 30 * 60 * 1000,
    retry: false,
  });
}

export function useCountrySubdivisionsQuery(
  countryCode?: string,
  search?: string
) {
  return useQuery({
    queryKey: ["geo", "subdivisions", countryCode ?? "", search ?? ""],
    queryFn: () => {
      if (!countryCode) {
        throw new Error("countryCode is required");
      }

      return getCountrySubdivisions(countryCode, search);
    },
    enabled: !!countryCode,
    staleTime: 30 * 60 * 1000,
    retry: false,
  });
}

export function useCountryCitiesQuery(
  countryCode?: string,
  input?: {
    subdivisionCode?: string;
    search?: string;
  }
) {
  return useQuery({
    queryKey: [
      "geo",
      "cities",
      countryCode ?? "",
      input?.subdivisionCode ?? "",
      input?.search ?? "",
    ],
    queryFn: () => {
      if (!countryCode) {
        throw new Error("countryCode is required");
      }

      return getCountryCities(countryCode, input);
    },
    enabled: !!countryCode,
    staleTime: 30 * 60 * 1000,
    retry: false,
  });
}

export function useCountryTimezonesQuery(countryCode?: string) {
  return useQuery({
    queryKey: ["geo", "timezones", countryCode ?? ""],
    queryFn: () => {
      if (!countryCode) {
        throw new Error("countryCode is required");
      }

      return getCountryTimezones(countryCode);
    },
    enabled: !!countryCode,
    staleTime: 30 * 60 * 1000,
    retry: false,
  });
}