import { API_URL } from "@/lib/api";

export type OnboardingRoute =
  | "BUILD_INSTITUTION"
  | "JOIN_INSTITUTION"
  | "EXPLORE_SKUULLY";

export type BuildInstitutionType =
  | "school"
  | "college"
  | "university"
  | "polytechnic"
  | "vocational"
  | "academy"
  | "training_center";

export type GenderAdmissionPolicy =
  | "BOYS_ONLY"
  | "GIRLS_ONLY"
  | "MIXED";

export type LearningMode =
  | "DAY"
  | "BOARDING"
  | "IN_PERSON"
  | "ONLINE"
  | "HYBRID";

export type OnboardingDraft = {
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
};

export type MyOnboardingResponse = {
  route: OnboardingRoute | null;
  currentStep: string | null;
  completedAt: string | null;
  draft: OnboardingDraft | null;
};

export type AcademicOption = {
  label: string;
  code?: string;
  category?: string;
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

export type ReviewResponse = {
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

export async function getMyOnboarding() {
  return fetchJson<MyOnboardingResponse>(`${API_URL}/onboarding/me`);
}

export async function setOnboardingRoute(route: OnboardingRoute) {
  return fetchJson<{ message: string; route: OnboardingRoute; currentStep: string }>(
    `${API_URL}/onboarding/route`,
    {
      method: "POST",
      body: JSON.stringify({ route }),
    }
  );
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
  setUpLater?: boolean;
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
  learningModes: LearningMode[];
  ownership?: string;
  levelType?: string;
  genderAdmissionPolicy?: GenderAdmissionPolicy;
}) {
  return fetchJson<{ message: string; currentStep: string }>(
    `${API_URL}/onboarding/build/details`,
    {
      method: "POST",
      body: JSON.stringify(input),
    }
  );
}

export async function sendPhoneCode(input: {
  countryCode: string;
  dialCode: string;
  nationalNumber: string;
  e164: string;
}) {
  return fetchJson<{ message: string; expiresInSeconds: number }>(
    `${API_URL}/onboarding/build/phone/send-code`,
    {
      method: "POST",
      body: JSON.stringify(input),
    }
  );
}

export async function verifyPhoneCode(input: { e164: string; code: string }) {
  return fetchJson<{ message: string; phoneVerified: boolean; phone: string }>(
    `${API_URL}/onboarding/build/phone/verify`,
    {
      method: "POST",
      body: JSON.stringify(input),
    }
  );
}

export async function skipPhoneStep() {
  return fetchJson<{ message: string }>(
    `${API_URL}/onboarding/build/phone/skip`,
    {
      method: "POST",
      body: JSON.stringify({}),
    }
  );
}

export async function getBuildReview() {
  return fetchJson<ReviewResponse>(`${API_URL}/onboarding/build/review`);
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
    body: JSON.stringify({}),
  });
}