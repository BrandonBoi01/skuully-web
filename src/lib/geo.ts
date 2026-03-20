import { API_URL } from "@/lib/api";

export type GeoCountry = {
  id: string;
  code: string;
  iso3?: string | null;
  name: string;
  officialName?: string | null;
  flagEmoji?: string | null;
  region?: string | null;
  subregion?: string | null;
  capital?: string | null;
  currencyCode?: string | null;
  currencyName?: string | null;
  phoneCode?: string | null;
  phoneMinLength?: number | null;
  phoneMaxLength?: number | null;
  nativeCurriculumName?: string | null;
  nativeCurriculumCode?: string | null;
  isActive: boolean;
};

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url, {
    credentials: "include",
  });

  const text = await res.text();

  if (!res.ok) {
    throw new Error(text || "Request failed");
  }

  return text ? (JSON.parse(text) as T) : ({} as T);
}

export async function getGeoCountries(q?: string) {
  const params = new URLSearchParams();
  if (q?.trim()) params.set("q", q.trim());

  return fetchJson<{ items: GeoCountry[]; total: number }>(
    `${API_URL}/geo/countries?${params.toString()}`
  );
}

export async function getPhoneCountries() {
  return fetchJson<{ items: GeoCountry[]; total: number }>(
    `${API_URL}/geo/countries/phone`
  );
}