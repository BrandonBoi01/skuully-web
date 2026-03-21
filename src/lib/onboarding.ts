import { API_URL } from "@/lib/api";

export type LearningMode =
  | "DAY"
  | "BOARDING"
  | "IN_PERSON"
  | "ONLINE"
  | "HYBRID";

export type GenderAdmissionPolicy =
  | "BOYS_ONLY"
  | "GIRLS_ONLY"
  | "MIXED";

export type AcademicOption = {
  label: string;
  code?: string | null;
  category?: string | null;
  recommended?: boolean;
};

export type AcademicOptionsResponse = {
  label: string;
  description: string;
  options: AcademicOption[];
};

export type DetailOptionsResponse = {
  learningModes: string[];
  ownerships: string[];
  levelTypes: string[];
  genderAdmissionPolicies: Array<{
    label: string;
    value: GenderAdmissionPolicy;
  }>;
};

export type SaveBuildIdentityInput = {
  institutionType: string;
  institutionName: string;
  country: string;
  countryCode: string;
};

export type SaveBuildAcademicInput = {
  label?: string;
  selectedItems: string[];
  setUpLater: boolean;
};

export type SaveBuildDetailsInput = {
  learningModes: LearningMode[];
  genderAdmissionPolicy?: GenderAdmissionPolicy;
  ownership?: string;
  levelType?: string;
};

export type SendPhoneCodeInput = {
  countryCode: string;
  dialCode: string;
  nationalNumber: string;
  e164: string;
};

export type VerifyPhoneCodeInput = {
  e164: string;
  code: string;
};

export type BuildReviewResponse = {
  institutionType?: string | null;
  institutionName?: string | null;
  country?: string | null;
  countryCode?: string | null;
  academicLabel?: string | null;
  academicItems?: string[];
  academicSetLater?: boolean;
  learningModes?: LearningMode[];
  ownership?: string | null;
  levelType?: string | null;
  genderAdmissionPolicy?: GenderAdmissionPolicy | null;
  phone?: string | null;
  phoneSetLater?: boolean;
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

export async function getMyOnboarding() {
  return fetchJson<{
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
      learningModes?: LearningMode[];
      ownership?: string | null;
      levelType?: string | null;
      genderAdmissionPolicy?: GenderAdmissionPolicy | null;
      phoneCountryCode?: string | null;
      phoneDialCode?: string | null;
      phoneNational?: string | null;
      phoneE164?: string | null;
      phoneSetLater?: boolean;
    } | null;
  }>(`${API_URL}/onboarding/me`);
}

export async function setOnboardingRoute(route: string) {
  return fetchJson<{ message: string; route: string; currentStep: string }>(
    `${API_URL}/onboarding/route`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ route }),
    }
  );
}

export async function saveBuildIdentity(input: SaveBuildIdentityInput) {
  return fetchJson<{ message: string; currentStep: string }>(
    `${API_URL}/onboarding/build/identity`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
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

export async function saveBuildAcademic(input: SaveBuildAcademicInput) {
  return fetchJson<{ message: string; currentStep: string }>(
    `${API_URL}/onboarding/build/academic`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(input),
    }
  );
}

export async function getDetailOptions(institutionType: string) {
  const params = new URLSearchParams({
    institutionType,
  });

  return fetchJson<DetailOptionsResponse>(
    `${API_URL}/onboarding/build/detail-options?${params.toString()}`
  );
}

export async function saveBuildDetails(input: SaveBuildDetailsInput) {
  return fetchJson<{ message: string; currentStep: string }>(
    `${API_URL}/onboarding/build/details`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(input),
    }
  );
}

export async function sendPhoneCode(input: SendPhoneCodeInput) {
  return fetchJson<{ message: string; expiresInSeconds: number }>(
    `${API_URL}/onboarding/build/security/send-phone-code`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(input),
    }
  );
}

export async function verifyPhoneCode(input: VerifyPhoneCodeInput) {
  return fetchJson<{
    message: string;
    phoneVerified: boolean;
    phone: string;
  }>(`${API_URL}/onboarding/build/security/verify-phone-code`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
  });
}

export async function skipPhoneStep() {
  return fetchJson<{ message: string }>(
    `${API_URL}/onboarding/build/security/skip`,
    {
      method: "POST",
    }
  );
}

export async function getBuildReview() {
  return fetchJson<BuildReviewResponse>(`${API_URL}/onboarding/build/review`);
}

export async function completeBuildInstitution() {
  return fetchJson<{
    message: string;
    token?: string;
    school?: unknown;
    membership?: unknown;
    active?: unknown;
  }>(`${API_URL}/onboarding/build/complete`, {
    method: "POST",
  });
}