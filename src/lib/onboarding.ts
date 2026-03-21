import { API_URL } from "@/lib/api";

async function parseResponse<T>(res: Response): Promise<T> {
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

async function api<T>(url: string, init?: RequestInit) {
  const res = await fetch(`${API_URL}${url}`, {
    ...init,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });

  return parseResponse<T>(res);
}

/* ---------------- BUILD INSTITUTION ---------------- */

export async function getMyOnboarding() {
  return api<{
    route: string | null;
    currentStep: string | null;
    completedAt: string | null;
    draft: any;
  }>("/onboarding/me");
}

export async function saveBuildIdentity(input: {
  institutionType: string;
  institutionName: string;
  country: string;
  countryCode: string;
}) {
  return api<{ message: string; currentStep: string }>(
    "/onboarding/build/identity",
    {
      method: "POST",
      body: JSON.stringify(input),
    }
  );
}

export type AcademicOption = {
  label: string;
  code?: string;
  category?: string;
  recommended?: boolean;
};

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

export async function getAcademicOptions(
  institutionType: string,
  countryCode: string
) {
  const params = new URLSearchParams({ institutionType, countryCode });

  return api<{
    label: string;
    description: string;
    options: AcademicOption[];
  }>(`/onboarding/build/academic-options?${params.toString()}`);
}

export async function saveBuildAcademic(input: {
  label?: string;
  selectedItems: string[];
  setUpLater: boolean;
}) {
  return api<{ message: string; currentStep: string }>(
    "/onboarding/build/academic",
    {
      method: "POST",
      body: JSON.stringify(input),
    }
  );
}

export async function getDetailOptions(institutionType: string) {
  const params = new URLSearchParams({ institutionType });

  return api<{
    learningModes: string[];
    ownerships: string[];
    levelTypes: string[];
    genderAdmissionPolicies: Array<{
      label: string;
      value: GenderAdmissionPolicy;
    }>;
  }>(`/onboarding/build/detail-options?${params.toString()}`);
}

export async function saveBuildDetails(input: {
  learningModes: string[];
  genderAdmissionPolicy?: string;
  ownership?: string;
  levelType?: string;
}) {
  return api<{ message: string; currentStep: string }>(
    "/onboarding/build/details",
    {
      method: "POST",
      body: JSON.stringify(input),
    }
  );
}

export async function getBuildReview() {
  return api<{
    institutionType?: string | null;
    institutionName?: string | null;
    country?: string | null;
    countryCode?: string | null;
    academicLabel?: string | null;
    academicItems?: string[];
    academicSetLater?: boolean;
    learningModes?: string[];
    ownership?: string | null;
    levelType?: string | null;
    genderAdmissionPolicy?: string | null;
    phone?: string | null;
    phoneSetLater?: boolean;
  }>("/onboarding/build/review");
}

export async function completeBuildInstitution() {
  return api<{
    message: string;
    token?: string;
    school?: unknown;
    membership?: unknown;
    active?: unknown;
  }>("/onboarding/build/complete", {
    method: "POST",
  });
}

/* ---------------- JOIN INSTITUTION ---------------- */

export async function searchJoinInstitutions(input: {
  query: string;
  mode: "name" | "skuully_id";
  role: string;
}) {
  const params = new URLSearchParams({
    query: input.query,
    mode: input.mode,
    role: input.role,
  });

  return api<{
    items: Array<{
      id: string;
      name: string;
      country: string;
      countryCode?: string | null;
      institutionType?: string | null;
      skuullyId?: string | null;
    }>;
  }>(`/onboarding/join/search?${params.toString()}`);
}

export async function submitJoinInviteCode(input: {
  code: string;
  role: string;
}) {
  return api<{
    message: string;
    institution?: {
      id: string;
      name: string;
      country?: string | null;
    };
  }>("/onboarding/join/invite", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function selectJoinInstitution(input: {
  schoolId: string;
  role: string;
}) {
  return api<{ message: string }>("/onboarding/join/select", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function completeJoinInstitution() {
  return api<{ message: string; active?: unknown }>("/onboarding/join/complete", {
    method: "POST",
  });
}

/* ---------------- EXPLORE SKUULLY ---------------- */

export async function saveExploreIdentity(input: {
  skuullyId: string;
}) {
  return api<{ message: string }>("/onboarding/explore/identity", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function saveExploreProfile(input: {
  fullName: string;
  headline?: string;
}) {
  return api<{ message: string }>("/onboarding/explore/profile", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function completeExploreSkuully() {
  return api<{ message: string }>("/onboarding/explore/complete", {
    method: "POST",
  });
}

/* ---------------- SHARED PHONE STEP ---------------- */

export async function sendPhoneCode(input: {
  countryCode: string;
  dialCode: string;
  nationalNumber: string;
  e164: string;
}) {
  return api<{ message: string; expiresInSeconds?: number }>(
    "/onboarding/phone/send-code",
    {
      method: "POST",
      body: JSON.stringify(input),
    }
  );
}

export async function verifyPhoneCode(input: {
  e164: string;
  code: string;
}) {
  return api<{ message: string; verified: boolean; phone?: string }>(
    "/onboarding/phone/verify",
    {
      method: "POST",
      body: JSON.stringify(input),
    }
  );
}

export async function skipPhoneStep() {
  return api<{ message: string }>("/onboarding/phone/skip", {
    method: "POST",
  });
}