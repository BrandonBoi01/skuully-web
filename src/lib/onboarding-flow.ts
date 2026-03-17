export type OnboardingRoute =
  | "build_institution"
  | "join_institution"
  | "start_as_me";

export type BuildInstitutionType =
  | "school"
  | "college"
  | "university"
  | "polytechnic"
  | "vocational"
  | "academy"
  | "training_center";

export type JoinRole =
  | "invite"
  | "teacher"
  | "student"
  | "parent"
  | "staff";

export type PersonalStart =
  | "profile"
  | "learning"
  | "community"
  | "marketplace";

export type OnboardingState = {
  route: OnboardingRoute | null;
  buildInstitutionType?: BuildInstitutionType | null;
  joinRole?: JoinRole | null;
  personalStart?: PersonalStart | null;
};

export const ONBOARDING_STORAGE_KEY = "skuully_onboarding_state";

export function readOnboardingState(): OnboardingState {
  if (typeof window === "undefined") {
    return { route: null };
  }

  try {
    const raw = localStorage.getItem(ONBOARDING_STORAGE_KEY);
    if (!raw) return { route: null };
    return JSON.parse(raw) as OnboardingState;
  } catch {
    return { route: null };
  }
}

export function writeOnboardingState(state: OnboardingState) {
  if (typeof window === "undefined") return;
  localStorage.setItem(ONBOARDING_STORAGE_KEY, JSON.stringify(state));
}

export function clearOnboardingState() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(ONBOARDING_STORAGE_KEY);
}