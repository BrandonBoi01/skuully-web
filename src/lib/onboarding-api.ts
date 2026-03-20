import { API_URL } from "@/lib/api";

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
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

export type OnboardingMeResponse = {
  route: string | null;
  currentStep: string | null;
  completedAt: string | null;
  draft: {
    institutionType?: string | null;
    institutionName?: string | null;
    country?: string | null;
    countryCode?: string | null;
    academicLabel?: string | null;
    academicItems?: string[];
    academicSetLater?: boolean;
    learningModes?: string[];
    genderAdmissionPolicy?: string | null;
    ownership?: string | null;
    levelType?: string | null;
    phoneCountryCode?: string | null;
    phoneDialCode?: string | null;
    phoneNational?: string | null;
    phoneE164?: string | null;
    phoneSetLater?: boolean;
  } | null;
};

export type AcademicOptionsResponse = {
  label: string;
  description: string;
  options: Array<{
    label: string;
    code?: string;
    category?: string;
    recommended?: boolean;
  }>;
};

export type DetailOptionsResponse = {
  learningModes: string[];
  ownerships: string[];
  levelTypes: string[];
  genderAdmissionPolicies: Array<{
    label: string;
    value: string;
  }>;
};

export async function getMyOnboarding() {
  return fetchJson<OnboardingMeResponse>(`${API_URL}/onboarding/me`);
}

export async function saveBuildIdentity(input: {
  institutionType: string;
  institutionName: string;
  country: string;
  countryCode: string;
}) {
  return fetchJson<{ message: string; currentStep: string }>(
    `${API_URL}/onboarding/build/identity`,
    {
      method: "POST",
      body: JSON.stringify(input),
    }
  );
}

export async function getAcademicOptions(
  institutionType: string,
  countryCode: string
) {
  const params = new URLSearchParams({
    institutionType,
    countryCode,
  });

  return fetchJson<AcademicOptionsResponse>(
    `${API_URL}/onboarding/build/academic-options?${params.toString()}`
  );
}

export async function saveBuildAcademic(input: {
  label?: string;
  selectedItems?: string[];
  setUpLater: boolean;
}) {
  return fetchJson<{ message: string; currentStep: string }>(
    `${API_URL}/onboarding/build/academic`,
    {
      method: "POST",
      body: JSON.stringify(input),
    }
  );
}

export async function getDetailOptions(institutionType: string) {
  const params = new URLSearchParams({ institutionType });

  return fetchJson<DetailOptionsResponse>(
    `${API_URL}/onboarding/build/detail-options?${params.toString()}`
  );
}

export async function saveBuildDetails(input: {
  learningModes: string[];
  genderAdmissionPolicy?: string;
  ownership?: string;
  levelType?: string;
}) {
  return fetchJson<{ message: string; currentStep: string }>(
    `${API_URL}/onboarding/build/details`,
    {
      method: "POST",
      body: JSON.stringify(input),
    }
  );
}