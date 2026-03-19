import { API_URL } from "@/lib/api";

export type OnboardingDraft = {
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
};

export type GetMyOnboardingResponse = {
  route: string | null;
  currentStep: string | null;
  completedAt: string | null;
  draft: OnboardingDraft | null;
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
  genderAdmissionPolicies: Array<{
    label: string;
    value: string;
  }>;
  ownerships: string[];
  levelTypes: string[];
};

type MessageResponse = {
  message: string;
  currentStep?: string;
};

type SendPhoneCodeResponse = {
  message: string;
  expiresInSeconds: number;
};

type VerifyPhoneCodeResponse = {
  message: string;
  phoneVerified: boolean;
  phone: string;
};

type BuildReviewResponse = {
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

  const text = await res.text().catch(() => "");

  if (!res.ok) {
    try {
      const parsed = text ? JSON.parse(text) : null;
      const message =
        Array.isArray(parsed?.message)
          ? parsed.message[0]
          : parsed?.message || text || "Request failed";
      throw new Error(message);
    } catch {
      throw new Error(text || "Request failed");
    }
  }

  return text ? (JSON.parse(text) as T) : ({} as T);
}

export async function getMyOnboarding() {
  return fetchJson<GetMyOnboardingResponse>(`${API_URL}/onboarding/me`);
}

export async function setOnboardingRoute(route: string) {
  return fetchJson<MessageResponse>(`${API_URL}/onboarding/route`, {
    method: "POST",
    body: JSON.stringify({ route }),
  });
}

export async function saveBuildIdentity(input: {
  institutionType: string;
  institutionName: string;
  country: string;
  countryCode: string;
}) {
  return fetchJson<MessageResponse>(`${API_URL}/onboarding/build/identity`, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function getAcademicOptions(institutionType: string, countryCode: string) {
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
  return fetchJson<MessageResponse>(`${API_URL}/onboarding/build/academic`, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function getBuildDetailOptions(institutionType: string) {
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
  return fetchJson<MessageResponse>(`${API_URL}/onboarding/build/details`, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function sendPhoneCode(input: {
  countryCode: string;
  dialCode: string;
  nationalNumber: string;
  e164: string;
}) {
  return fetchJson<SendPhoneCodeResponse>(`${API_URL}/onboarding/build/phone/send-code`, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function verifyPhoneCode(input: { e164: string; code: string }) {
  return fetchJson<VerifyPhoneCodeResponse>(`${API_URL}/onboarding/build/phone/verify`, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function skipPhoneStep() {
  return fetchJson<MessageResponse>(`${API_URL}/onboarding/build/phone/skip`, {
    method: "POST",
  });
}

export async function getBuildReview() {
  return fetchJson<BuildReviewResponse>(`${API_URL}/onboarding/build/review`);
}

export async function completeBuildInstitution() {
  return fetchJson<any>(`${API_URL}/onboarding/build/complete`, {
    method: "POST",
  });
}