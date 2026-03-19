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
};

export type GeoSubdivision = {
  id: string;
  code?: string | null;
  name: string;
  type?: string | null;
};

export type GeoCity = {
  id: string;
  name: string;
  subdivisionId?: string | null;
};

type CountriesResponse = {
  items: GeoCountry[];
};

type SubdivisionsResponse = {
  items: GeoSubdivision[];
};

type CitiesResponse = {
  items: GeoCity[];
};

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url, {
    credentials: "include",
    cache: "no-store",
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text || "Request failed");
  }

  return (await res.json()) as T;
}

export async function getGeoCountries(search?: string) {
  const params = new URLSearchParams();

  if (search?.trim()) {
    params.set("search", search.trim());
  }

  const query = params.toString();
  return fetchJson<CountriesResponse>(
    `${API_URL}/geo/countries${query ? `?${query}` : ""}`
  );
}

export async function getGeoCountrySubdivisions(countryCode: string) {
  return fetchJson<SubdivisionsResponse>(
    `${API_URL}/geo/countries/${encodeURIComponent(countryCode)}/subdivisions`
  );
}

export async function getGeoCountryCities(countryCode: string, subdivisionId?: string) {
  const params = new URLSearchParams();

  if (subdivisionId) {
    params.set("subdivisionId", subdivisionId);
  }

  const query = params.toString();

  return fetchJson<CitiesResponse>(
    `${API_URL}/geo/countries/${encodeURIComponent(countryCode)}/cities${
      query ? `?${query}` : ""
    }`
  );
}