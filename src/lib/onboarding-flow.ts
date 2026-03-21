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

export type OnboardingState = {
  route?: OnboardingRoute | null;
  buildInstitutionType?: BuildInstitutionType | null;
  joinRole?: JoinRole | null;
};

const STORAGE_KEY = "skuully_onboarding_state";

export function readOnboardingState(): OnboardingState {
  if (typeof window === "undefined") return {};

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as OnboardingState) : {};
  } catch {
    return {};
  }
}

export function writeOnboardingState(input: Partial<OnboardingState>) {
  if (typeof window === "undefined") return;

  const current = readOnboardingState();
  const next = { ...current, ...input };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
}

export function clearOnboardingState() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEY);
}