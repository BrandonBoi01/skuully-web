import { API_URL } from "@/lib/api";

export type GeoCountry = {
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
};

export async function getCountries(query?: string): Promise<GeoCountry[]> {
  const url = new URL(`${API_URL}/geo/countries`);
  if (query?.trim()) {
    url.searchParams.set("q", query.trim());
  }

  const res = await fetch(url.toString(), {
    credentials: "include",
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error("Failed to load countries");
  }

  return res.json();
}

export async function getCountryByCode(code: string) {
  const res = await fetch(`${API_URL}/geo/countries/${code}`, {
    credentials: "include",
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error("Failed to load country");
  }

  return res.json();
}