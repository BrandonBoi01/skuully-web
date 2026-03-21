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
  isActive?: boolean;
};

export type GeoSubdivision = {
  id: string;
  countryId: string;
  code?: string | null;
  name: string;
  type?: string | null;
};

export type GeoCity = {
  id: string;
  countryId: string;
  subdivisionId?: string | null;
  name: string;
};

export type GeoTimezone = {
  id: string;
  countryId: string;
  name: string;
  utcOffset?: string | null;
};

type GeoCountriesResponse = {
  items: GeoCountry[];
  total: number;
};

type GeoSubdivisionsResponse = {
  items: GeoSubdivision[];
  total: number;
};

type GeoCitiesResponse = {
  items: GeoCity[];
  total: number;
};

type GeoTimezonesResponse = {
  items: GeoTimezone[];
  total: number;
};

function getCsrfTokenFromCookie() {
  if (typeof document === "undefined") return null;

  const cookie = document.cookie
    .split("; ")
    .find((item) => item.startsWith("skuully_csrf_token="));

  if (!cookie) return null;

  return decodeURIComponent(cookie.split("=")[1]);
}

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const method = (init?.method || "GET").toUpperCase();
  const csrfToken = getCsrfTokenFromCookie();

  const headers: HeadersInit = {
    ...(init?.headers ?? {}),
    ...(method !== "GET" &&
    method !== "HEAD" &&
    method !== "OPTIONS" &&
    csrfToken
      ? { "X-CSRF-Token": csrfToken }
      : {}),
  };

  const res = await fetch(url, {
    ...init,
    headers,
    credentials: "include",
  });

  const text = await res.text();

  if (!res.ok) {
    let message = "Request failed";

    try {
      const parsed = text ? JSON.parse(text) : null;
      message =
        Array.isArray(parsed?.message)
          ? parsed.message[0]
          : parsed?.message || text || message;
    } catch {
      message = text || message;
    }

    throw new Error(message);
  }

  return text ? (JSON.parse(text) as T) : ({} as T);
}

export async function getGeoCountries(search?: string) {
  const params = new URLSearchParams();

  if (search?.trim()) {
    params.set("search", search.trim());
  }

  const query = params.toString();
  return fetchJson<GeoCountriesResponse>(
    `${API_URL}/geo/countries${query ? `?${query}` : ""}`
  );
}

export async function getPhoneCountries(search?: string) {
  const params = new URLSearchParams();

  if (search?.trim()) {
    params.set("search", search.trim());
  }

  const query = params.toString();
  return fetchJson<GeoCountriesResponse>(
    `${API_URL}/geo/phone-countries${query ? `?${query}` : ""}`
  );
}

export async function getGeoCountryByCode(code: string) {
  return fetchJson<GeoCountry>(`${API_URL}/geo/countries/${code}`);
}

export async function getGeoSubdivisions(countryCode: string, search?: string) {
  const params = new URLSearchParams();

  if (search?.trim()) {
    params.set("search", search.trim());
  }

  const query = params.toString();
  return fetchJson<GeoSubdivisionsResponse>(
    `${API_URL}/geo/countries/${countryCode}/subdivisions${
      query ? `?${query}` : ""
    }`
  );
}

export async function getGeoCities(
  countryCode: string,
  subdivisionCode?: string,
  search?: string
) {
  const params = new URLSearchParams();

  if (subdivisionCode?.trim()) {
    params.set("subdivisionCode", subdivisionCode.trim());
  }

  if (search?.trim()) {
    params.set("search", search.trim());
  }

  const query = params.toString();
  return fetchJson<GeoCitiesResponse>(
    `${API_URL}/geo/countries/${countryCode}/cities${query ? `?${query}` : ""}`
  );
}

export async function getGeoTimezones(countryCode: string) {
  return fetchJson<GeoTimezonesResponse>(
    `${API_URL}/geo/countries/${countryCode}/timezones`
  );
}