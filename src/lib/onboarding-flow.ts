export type OnboardingRoute = "build_institution" | "personal_account";

export type BuildInstitutionType =
  | "school"
  | "college"
  | "university"
  | "polytechnic"
  | "vocational"
  | "academy"
  | "training_center";

export type AccountIntent =
  | "founder"
  | "staff"
  | "parent"
  | "student"
  | "professional"
  | "explorer"
  | "unsure";

type OnboardingState = {
  route: OnboardingRoute | null;
  buildInstitutionType: BuildInstitutionType | null;
  accountIntent: AccountIntent | null;
};

const STORAGE_KEY = "skuullyOnboardingState";

const DEFAULT_STATE: OnboardingState = {
  route: null,
  buildInstitutionType: null,
  accountIntent: null,
};

function isBrowser() {
  return typeof window !== "undefined";
}

export function readOnboardingState(): OnboardingState {
  if (!isBrowser()) return DEFAULT_STATE;

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_STATE;

    const parsed = JSON.parse(raw) as Partial<OnboardingState>;

    return {
      route: parsed.route ?? null,
      buildInstitutionType: parsed.buildInstitutionType ?? null,
      accountIntent: parsed.accountIntent ?? null,
    };
  } catch {
    return DEFAULT_STATE;
  }
}

export function writeOnboardingState(input: Partial<OnboardingState>) {
  if (!isBrowser()) return;

  const current = readOnboardingState();
  const next: OnboardingState = {
    ...current,
    ...input,
  };

  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
}

export function clearOnboardingState() {
  if (!isBrowser()) return;
  localStorage.removeItem(STORAGE_KEY);
}

export function setBuildInstitutionRoute(type: BuildInstitutionType) {
  writeOnboardingState({
    route: "build_institution",
    buildInstitutionType: type,
    accountIntent: null,
  });
}

export function setPersonalAccountRoute(intent: AccountIntent) {
  writeOnboardingState({
    route: "personal_account",
    buildInstitutionType: null,
    accountIntent: intent,
  });
}