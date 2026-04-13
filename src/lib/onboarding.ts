import { apiFetch } from "@/lib/api";
import type {
  AccountIntent,
  BuildInstitutionType,
  OnboardingRoute,
} from "@/lib/onboarding-flow";

function mapRouteToApi(route: OnboardingRoute) {
  return route === "build_institution"
    ? "BUILD_INSTITUTION"
    : "PERSONAL_ACCOUNT";
}

function mapInstitutionTypeToApi(type: BuildInstitutionType) {
  switch (type) {
    case "school":
      return "SCHOOL";
    case "college":
      return "COLLEGE";
    case "university":
      return "UNIVERSITY";
    case "polytechnic":
      return "POLYTECHNIC";
    case "vocational":
      return "VOCATIONAL";
    case "academy":
      return "ACADEMY";
    case "training_center":
    default:
      return "TRAINING_CENTER";
  }
}

function mapAccountIntentToApi(intent: AccountIntent) {
  return intent.toUpperCase();
}

export type AcademicOption = {
  label: string;
  code?: string;
  category?: string;
  recommended?: boolean;
};

export type GenderAdmissionPolicy = "BOYS_ONLY" | "GIRLS_ONLY" | "MIXED";

export type LearningMode =
  | "DAY"
  | "BOARDING"
  | "IN_PERSON"
  | "ONLINE"
  | "HYBRID";

export type GetMyOnboardingResponse = {
  route: string | null;
  accountIntent?: string | null;
  currentStep: string | null;
  completedAt: string | null;
  draft: {
    institutionType?: string | null;
    institutionName?: string | null;
    country?: string | null;
    countryCode?: string | null;
    skuullyId?: string | null;
    personalHeadline?: string | null;
    dateOfBirth?: string | null;
    academicLabel?: string | null;
    academicItems?: string[];
    academicSetLater?: boolean;
    learningModes?: string[];
    ownership?: string | null;
    levelType?: string | null;
    genderAdmissionPolicy?: string | null;
    phoneCountryCode?: string | null;
    phoneDialCode?: string | null;
    phoneNational?: string | null;
    phoneE164?: string | null;
    phoneSetLater?: boolean;
  } | null;
};

export type SetOnboardingRouteResponse = {
  message: string;
  route: string;
  currentStep: string;
};

export type GenericStepResponse = {
  message: string;
  currentStep?: string;
};

export type BuildAcademicOptionsResponse = {
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

export type BuildReviewResponse = {
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
};

export type CompleteBuildInstitutionResponse = {
  message: string;
  token?: string;
  school?: unknown;
  membership?: unknown;
  active?: unknown;
};

export type CompletePersonalAccountResponse = {
  message: string;
  active?: unknown;
};

export type SendPhoneCodeResponse = {
  message: string;
  expiresInSeconds?: number;
};

export type VerifyPhoneCodeResponse = {
  message: string;
  verified: boolean;
  phone?: string;
  phoneVerified?: boolean;
};

export async function setOnboardingRoute(route: OnboardingRoute) {
  return apiFetch<SetOnboardingRouteResponse>("/onboarding/route", {
    method: "POST",
    body: JSON.stringify({
      route: mapRouteToApi(route),
    }),
  });
}

export async function getMyOnboarding() {
  return apiFetch<GetMyOnboardingResponse>("/onboarding/me");
}

/* ---------------- BUILD INSTITUTION ---------------- */

export async function saveBuildIdentity(input: {
  institutionType: string;
  institutionName: string;
  country: string;
  countryCode: string;
}) {
  return apiFetch<GenericStepResponse>("/onboarding/build/identity", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function getAcademicOptions(
  institutionType: string,
  countryCode: string
) {
  const params = new URLSearchParams({ institutionType, countryCode });

  return apiFetch<BuildAcademicOptionsResponse>(
    `/onboarding/build/academic-options?${params.toString()}`
  );
}

export async function saveBuildAcademic(input: {
  label?: string;
  selectedItems: string[];
  selectedCodes?: string[];
  setUpLater: boolean;
}) {
  return apiFetch<GenericStepResponse>("/onboarding/build/academic", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function getDetailOptions(institutionType: string) {
  const params = new URLSearchParams({ institutionType });

  return apiFetch<DetailOptionsResponse>(
    `/onboarding/build/detail-options?${params.toString()}`
  );
}

export async function saveBuildDetails(input: {
  learningModes: string[];
  genderAdmissionPolicy?: string;
  ownership?: string;
  levelType?: string;
}) {
  return apiFetch<GenericStepResponse>("/onboarding/build/details", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function getBuildReview() {
  return apiFetch<BuildReviewResponse>("/onboarding/build/review");
}

export async function completeBuildInstitution() {
  return apiFetch<CompleteBuildInstitutionResponse>(
    "/onboarding/build/complete",
    {
      method: "POST",
    }
  );
}

/* ---------------- PERSONAL ACCOUNT ---------------- */

export async function savePersonalIdentity(input: {
  skuullyId: string;
  fullName: string;
  accountIntent: AccountIntent;
  headline?: string;
  dateOfBirth?: string;
}) {
  return apiFetch<GenericStepResponse>("/onboarding/personal/identity", {
    method: "POST",
    body: JSON.stringify({
      skuullyId: input.skuullyId,
      fullName: input.fullName,
      accountIntent: mapAccountIntentToApi(input.accountIntent),
      headline: input.headline,
      dateOfBirth: input.dateOfBirth,
    }),
  });
}

export async function completePersonalAccount() {
  return apiFetch<CompletePersonalAccountResponse>(
    "/onboarding/personal/complete",
    {
      method: "POST",
    }
  );
}

/* ---------------- SHARED SECURITY STEP ---------------- */

export async function sendPhoneCode(input: {
  countryCode: string;
  dialCode: string;
  nationalNumber: string;
  e164: string;
}) {
  return apiFetch<SendPhoneCodeResponse>("/onboarding/security/send-phone-code", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function verifyPhoneCode(input: {
  e164: string;
  code: string;
}) {
  return apiFetch<VerifyPhoneCodeResponse>(
    "/onboarding/security/verify-phone-code",
    {
      method: "POST",
      body: JSON.stringify(input),
    }
  );
}

export async function skipPhoneStep() {
  return apiFetch<{ message: string }>("/onboarding/security/skip", {
    method: "POST",
  });
}

/* ---------------- HELPERS ---------------- */

export {
  mapRouteToApi,
  mapInstitutionTypeToApi,
  mapAccountIntentToApi,
};