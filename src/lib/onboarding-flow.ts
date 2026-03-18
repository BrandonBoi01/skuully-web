export type OnboardingRoute =
  | "build_institution"
  | "join_institution"
  | "explore_skuully";

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

export type ExploreStart =
  | "communities"
  | "schools"
  | "people"
  | "marketplace";

export type OnboardingState = {
  route: OnboardingRoute | null;
  buildInstitutionType?: BuildInstitutionType | null;
  joinRole?: JoinRole | null;
  exploreStart?: ExploreStart | null;
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