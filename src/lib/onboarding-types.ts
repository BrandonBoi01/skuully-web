export type OnboardingStatusResponse = {
  completed: boolean;
  onboarding: {
    id: string;
    userId: string;
    route: "BUILD_INSTITUTION" | "PERSONAL_ACCOUNT" | null;
    accountIntent:
      | "FOUNDER"
      | "STAFF"
      | "PARENT"
      | "STUDENT"
      | "PROFESSIONAL"
      | "EXPLORER"
      | "UNSURE"
      | null;
    institutionTypeDraft: string | null;
    institutionNameDraft: string | null;
    nationalityCodeDraft: string | null;
    residenceCountryCodeDraft: string | null;
    headlineDraft: string | null;
    ownershipDraft: string | null;
    levelTypeDraft: string | null;
    learningModesDraft: string[];
    genderAdmissionPolicyDraft: string | null;
    currentStep: string | null;
    completedAt: string | null;
    createdAt: string;
    updatedAt: string;
  } | null;
  memberships: Array<{
    id: string;
    membershipType: string;
    status: string;
    isPrimary: boolean;
    joinedAt: string | null;
    createdAt: string;
    institution: {
      id: string;
      name: string;
      slug: string;
      institutionType: string;
      institutionCategory: string;
      verificationStatus: string;
    };
  }>;
};

export type AccountIntent =
  | "FOUNDER"
  | "STAFF"
  | "PARENT"
  | "STUDENT"
  | "PROFESSIONAL"
  | "EXPLORER"
  | "UNSURE";

export type StartOnboardingInput = {
  accountIntent: AccountIntent;
};

export type SetProfileInput = {
  nationalityCode: string;
  residenceCountryCode: string;
  headline?: string;
};

export type InstitutionType =
  | "SCHOOL"
  | "COLLEGE"
  | "UNIVERSITY"
  | "POLYTECHNIC"
  | "VOCATIONAL"
  | "TRAINING_CENTER"
  | "ACADEMY"
  | "GOVERNMENT_BODY"
  | "NGO"
  | "CHILDREN_HOME"
  | "EXAM_BODY"
  | "SPORTS_BODY"
  | "DRAMA_BODY"
  | "LOAN_BODY"
  | "OTHER";

export type InstitutionCategory =
  | "SCHOOL"
  | "GOVERNMENT"
  | "NGO"
  | "PARTNER"
  | "COMPETITION_BODY"
  | "SUPPORT_BODY"
  | "COMMUNITY"
  | "OTHER";

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

export type CreateInstitutionOnboardingInput = {
  name: string;
  institutionType: InstitutionType;
  institutionCategory?: InstitutionCategory;
  legalName?: string;
  email?: string;
  primaryPhone?: string;
  websiteUrl?: string;
  countryCode?: string;
  subdivisionId?: string;
  cityId?: string;
  addressLine1?: string;
  addressLine2?: string;
  timezone?: string;
  ownership?: string;
  levelType?: string;
  genderAdmissionPolicy?: GenderAdmissionPolicy;
  learningModes?: LearningMode[];
};

export type CountryItem = {
  id: string;
  code: string;
  name: string;
  flagEmoji?: string | null;
  phoneCode?: string | null;
  nativeCurriculumName?: string | null;
  region?: string | null;
  subregion?: string | null;
  isActive?: boolean;
};

export type GeoSubdivisionItem = {
  id: string;
  countryId: string;
  code: string;
  name: string;
  type?: string | null;
};

export type GeoCityItem = {
  id: string;
  countryId: string;
  subdivisionId?: string | null;
  name: string;
};

export type GeoTimezoneItem = {
  id: string;
  countryId: string;
  name: string;
  offset?: string | null;
};

export type GeoListResponse<T> = {
  items: T[];
  total: number;
};