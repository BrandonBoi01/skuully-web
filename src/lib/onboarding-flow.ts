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

type OnboardingState = {
  route: OnboardingRoute | null;
  buildInstitutionType: BuildInstitutionType | null;
  joinRole: JoinRole | null;
};

const STORAGE_KEY = "skuullyOnboardingState";

const DEFAULT_STATE: OnboardingState = {
  route: null,
  buildInstitutionType: null,
  joinRole: null,
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
      joinRole: parsed.joinRole ?? null,
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
    joinRole: null,
  });
}

export function setJoinInstitutionRoute(role: JoinRole) {
  writeOnboardingState({
    route: "join_institution",
    joinRole: role,
    buildInstitutionType: null,
  });
}

export function setExploreSkuullyRoute() {
  writeOnboardingState({
    route: "explore_skuully",
    buildInstitutionType: null,
    joinRole: null,
  });
}