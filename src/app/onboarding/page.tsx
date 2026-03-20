"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Building2,
  Check,
  ChevronDown,
  Globe2,
  LockKeyhole,
  Search,
  Sparkles,
} from "lucide-react";

import { getMe } from "@/lib/auth";
import {
  clearOnboardingState,
  readOnboardingState,
  type BuildInstitutionType,
} from "@/lib/onboarding-flow";
import { COUNTRIES, type CountryOption } from "@/lib/countries";
import {
  completeBuildInstitution,
  getAcademicOptions,
  getBuildReview,
  getDetailOptions,
  saveBuildAcademic,
  saveBuildDetails,
  saveBuildIdentity,
  sendPhoneCode,
  skipPhoneStep,
  verifyPhoneCode,
} from "@/lib/onboarding-api";
import { OnboardingShell } from "@/components/onboarding/onboarding-shell";

type MeResponse = {
  id: string;
  fullName: string;
  email: string;
  skuullyId?: string | null;
  emailVerified?: boolean;
  context?: {
    schoolId?: string | null;
    programId?: string | null;
    role?: string | null;
    membershipId?: string | null;
  };
};

type BuildStep = "identity" | "academic" | "details" | "security" | "review";

type InstitutionDetails = {
  learningModes: string[];
  ownership: string;
  levelType: string;
  genderAdmissionPolicy: string;
};

type PhoneCountry = {
  code: string;
  name: string;
  flag: string;
  dialCode: string;
  min: number;
  max: number;
};

type AcademicOption = {
  label: string;
  code?: string;
  category?: string;
  recommended?: boolean;
};

const PHONE_COUNTRIES: PhoneCountry[] = [
  { code: "KE", name: "Kenya", flag: "🇰🇪", dialCode: "+254", min: 9, max: 9 },
  { code: "UG", name: "Uganda", flag: "🇺🇬", dialCode: "+256", min: 9, max: 9 },
  { code: "TZ", name: "Tanzania", flag: "🇹🇿", dialCode: "+255", min: 9, max: 9 },
  { code: "RW", name: "Rwanda", flag: "🇷🇼", dialCode: "+250", min: 9, max: 9 },
  { code: "BI", name: "Burundi", flag: "🇧🇮", dialCode: "+257", min: 8, max: 8 },
  { code: "ET", name: "Ethiopia", flag: "🇪🇹", dialCode: "+251", min: 9, max: 9 },
  { code: "ZA", name: "South Africa", flag: "🇿🇦", dialCode: "+27", min: 9, max: 9 },
  { code: "NG", name: "Nigeria", flag: "🇳🇬", dialCode: "+234", min: 10, max: 10 },
  { code: "GH", name: "Ghana", flag: "🇬🇭", dialCode: "+233", min: 9, max: 9 },
  { code: "CM", name: "Cameroon", flag: "🇨🇲", dialCode: "+237", min: 9, max: 9 },
  { code: "US", name: "United States", flag: "🇺🇸", dialCode: "+1", min: 10, max: 10 },
  { code: "CA", name: "Canada", flag: "🇨🇦", dialCode: "+1", min: 10, max: 10 },
  { code: "GB", name: "United Kingdom", flag: "🇬🇧", dialCode: "+44", min: 10, max: 10 },
  { code: "IN", name: "India", flag: "🇮🇳", dialCode: "+91", min: 10, max: 10 },
  { code: "AE", name: "United Arab Emirates", flag: "🇦🇪", dialCode: "+971", min: 9, max: 9 },
  { code: "SA", name: "Saudi Arabia", flag: "🇸🇦", dialCode: "+966", min: 9, max: 9 },
  { code: "EG", name: "Egypt", flag: "🇪🇬", dialCode: "+20", min: 10, max: 10 },
  { code: "FR", name: "France", flag: "🇫🇷", dialCode: "+33", min: 9, max: 9 },
  { code: "DE", name: "Germany", flag: "🇩🇪", dialCode: "+49", min: 10, max: 11 },
  { code: "BR", name: "Brazil", flag: "🇧🇷", dialCode: "+55", min: 10, max: 11 },
  { code: "AU", name: "Australia", flag: "🇦🇺", dialCode: "+61", min: 9, max: 9 },
  { code: "NZ", name: "New Zealand", flag: "🇳🇿", dialCode: "+64", min: 8, max: 10 },
];

function prettyInstitutionLabel(type: BuildInstitutionType | null) {
  const labels: Record<BuildInstitutionType, string> = {
    school: "School",
    college: "College",
    university: "University",
    polytechnic: "Polytechnic",
    vocational: "Vocational / TVET",
    academy: "Academy",
    training_center: "Training Center",
  };

  return type ? labels[type] : "Institution";
}

function mapInstitutionTypeForApi(type: BuildInstitutionType | null) {
  const map: Record<BuildInstitutionType, string> = {
    school: "SCHOOL",
    college: "COLLEGE",
    university: "UNIVERSITY",
    polytechnic: "POLYTECHNIC",
    vocational: "VOCATIONAL",
    academy: "ACADEMY",
    training_center: "TRAINING_CENTER",
  };

  return type ? map[type] : "SCHOOL";
}

function suggestedPlaceholder(type: BuildInstitutionType | null) {
  const label = prettyInstitutionLabel(type);
  if (label === "Vocational / TVET") return "Greenfield Training Institute";
  return `Greenfield ${label}`;
}

function MiniInfo({ label, value }: { label: string; value: string }) {
  return (
    <div className="skuully-glass-card rounded-[24px] p-5">
      <div className="text-xs uppercase tracking-[0.16em] text-white/35">
        {label}
      </div>
      <div className="mt-2 text-base font-medium text-white">{value}</div>
    </div>
  );
}

function normalizeDigits(value: string) {
  return value.replace(/\D/g, "");
}

function normalizeNationalPhone(country: PhoneCountry, value: string) {
  let digits = normalizeDigits(value);
  if (!digits) return digits;

  const dialDigits = country.dialCode.replace("+", "");

  if (digits.startsWith(dialDigits)) {
    digits = digits.slice(dialDigits.length);
  }

  if (digits.startsWith("0")) {
    digits = digits.slice(1);
  }

  return digits;
}

function validatePhone(country: PhoneCountry, value: string) {
  const cleaned = normalizeNationalPhone(country, value);

  if (!cleaned.length) return "Enter your phone number.";
  if (cleaned.length < country.min) return "Phone number is too short for this country.";
  if (cleaned.length > country.max) return "Phone number is too long for this country.";

  return null;
}

export default function CreateSchoolPage() {
  const router = useRouter();
  const pickerRef = useRef<HTMLDivElement | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [isBusy, setIsBusy] = useState(false);
  const [me, setMe] = useState<MeResponse | null>(null);
  const [institutionType, setInstitutionType] = useState<BuildInstitutionType | null>(null);
  const [step, setStep] = useState<BuildStep>("identity");

  const [schoolName, setSchoolName] = useState("");
  const [countrySearch, setCountrySearch] = useState("");
  const [selectedCountry, setSelectedCountry] = useState<CountryOption | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);

  const [academicSearch, setAcademicSearch] = useState("");
  const [academicLabel, setAcademicLabel] = useState("Academic setup");
  const [academicDescription, setAcademicDescription] = useState("");
  const [academicOptions, setAcademicOptions] = useState<AcademicOption[]>([]);
  const [selectedAcademicItems, setSelectedAcademicItems] = useState<AcademicOption[]>([]);
  const [setAcademicLater, setSetAcademicLater] = useState(false);

  const [details, setDetails] = useState<InstitutionDetails>({
    learningModes: [],
    ownership: "",
    levelType: "",
    genderAdmissionPolicy: "",
  });

  const [detailOptions, setDetailOptions] = useState<{
    learningModes: string[];
    ownerships: string[];
    levelTypes: string[];
    genderAdmissionPolicies: Array<{ label: string; value: string }>;
  }>({
    learningModes: [],
    ownerships: [],
    levelTypes: [],
    genderAdmissionPolicies: [],
  });

  const [addPhoneLater, setAddPhoneLater] = useState(true);
  const [phoneCountryCode, setPhoneCountryCode] = useState("KE");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [verificationCode, setVerificationCode] = useState("");
  const [codeSent, setCodeSent] = useState(false);
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [isSendingCode, setIsSendingCode] = useState(false);
  const [isVerifyingCode, setIsVerifyingCode] = useState(false);

  const [review, setReview] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const currentPhoneCountry =
    PHONE_COUNTRIES.find((item) => item.code === phoneCountryCode) ??
    PHONE_COUNTRIES[0];

  useEffect(() => {
    async function load() {
      try {
        const meResponse = await getMe();

        if (!meResponse) {
          router.replace("/login");
          return;
        }

        if (!meResponse.emailVerified) {
          router.replace("/verify-email");
          return;
        }

        if (meResponse.context?.schoolId) {
          router.replace("/dashboard/control-center");
          return;
        }

        const saved = readOnboardingState();
        const buildType = saved.buildInstitutionType ?? null;

        if (!saved.route || saved.route !== "build_institution" || !buildType) {
          router.replace("/onboarding");
          return;
        }

        setInstitutionType(buildType);
        setMe(meResponse);

        const kenya = COUNTRIES.find((item) => item.code === "KE") ?? null;
        if (kenya) {
          setSelectedCountry(kenya);
          setCountrySearch(kenya.name);
          setPhoneCountryCode(kenya.code);
        }

        setIsLoading(false);
      } catch {
        router.replace("/login");
      }
    }

    void load();
  }, [router]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (!pickerRef.current) return;
      if (!pickerRef.current.contains(event.target as Node)) {
        setPickerOpen(false);
      }
    }

    window.addEventListener("mousedown", handleClickOutside);
    return () => window.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    async function loadAcademic() {
      if (!institutionType || !selectedCountry || step !== "academic") return;

      try {
        const res = await getAcademicOptions({
          institutionType: mapInstitutionTypeForApi(institutionType),
          countryCode: selectedCountry.code,
        });

        setAcademicLabel(res.label);
        setAcademicDescription(res.description);
        setAcademicOptions(res.options);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Could not load academic options."
        );
      }
    }

    void loadAcademic();
  }, [institutionType, selectedCountry, step]);

  useEffect(() => {
    async function loadDetails() {
      if (!institutionType || step !== "details") return;

      try {
        const res = await getDetailOptions({
          institutionType: mapInstitutionTypeForApi(institutionType),
        });

        setDetailOptions(res);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Could not load detail options."
        );
      }
    }

    void loadDetails();
  }, [institutionType, step]);

  useEffect(() => {
    async function loadReview() {
      if (step !== "review") return;

      try {
        const res = await getBuildReview();
        setReview(res);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Could not load review."
        );
      }
    }

    void loadReview();
  }, [step]);

  const filteredCountries = useMemo(() => {
    const query = countrySearch.trim().toLowerCase();

    if (!query) return COUNTRIES;

    return COUNTRIES.filter(
      (item) =>
        item.name.toLowerCase().includes(query) ||
        item.code.toLowerCase().includes(query) ||
        (item.nativeCurriculum ?? "").toLowerCase().includes(query)
    );
  }, [countrySearch]);

  const filteredAcademicOptions = useMemo(() => {
    const query = academicSearch.trim().toLowerCase();

    if (!query) return academicOptions;

    return academicOptions.filter((item) =>
      item.label.toLowerCase().includes(query)
    );
  }, [academicSearch, academicOptions]);

  const totalSteps = 5;
  const currentStep =
    step === "identity"
      ? 1
      : step === "academic"
      ? 2
      : step === "details"
      ? 3
      : step === "security"
      ? 4
      : 5;

  const identityReady = schoolName.trim().length >= 2 && !!selectedCountry;
  const academicReady = setAcademicLater || selectedAcademicItems.length > 0;
  const detailsReady =
    details.learningModes.length > 0 &&
    !!details.ownership &&
    !!details.levelType;
  const securityReady = addPhoneLater || phoneVerified;

  const normalizedNationalPhone = normalizeNationalPhone(
    currentPhoneCountry,
    phoneNumber
  );
  const normalizedPhone = `${currentPhoneCountry.dialCode}${normalizedNationalPhone}`;

  function isSelectedAcademicOption(option: AcademicOption) {
    return selectedAcademicItems.some(
      (item) =>
        item.label.toLowerCase() === option.label.toLowerCase() &&
        (item.code ?? "") === (option.code ?? "")
    );
  }

  function toggleAcademicItem(option: AcademicOption) {
    setSetAcademicLater(false);

    setSelectedAcademicItems((prev) => {
      const exists = prev.some(
        (item) =>
          item.label.toLowerCase() === option.label.toLowerCase() &&
          (item.code ?? "") === (option.code ?? "")
      );

      if (exists) {
        return prev.filter(
          (item) =>
            !(
              item.label.toLowerCase() === option.label.toLowerCase() &&
              (item.code ?? "") === (option.code ?? "")
            )
        );
      }

      return [...prev, option];
    });
  }

  function toggleLearningMode(value: string) {
    setDetails((prev) => {
      const exists = prev.learningModes.includes(value);

      return {
        ...prev,
        learningModes: exists
          ? prev.learningModes.filter((item) => item !== value)
          : [...prev.learningModes, value],
      };
    });
  }

  function handlePhoneChange(value: string) {
    const cleaned = normalizeNationalPhone(currentPhoneCountry, value);
    setPhoneNumber(cleaned);
    setPhoneError(validatePhone(currentPhoneCountry, cleaned));
    setCodeSent(false);
    setPhoneVerified(false);
    setVerificationCode("");
  }

  async function handleSendCode() {
    setError(null);

    const validationError = validatePhone(currentPhoneCountry, phoneNumber);
    setPhoneError(validationError);

    if (validationError) {
      setError(validationError);
      return;
    }

    setIsSendingCode(true);

    try {
      await sendPhoneCode({
        countryCode: currentPhoneCountry.code,
        dialCode: currentPhoneCountry.dialCode,
        nationalNumber: normalizedNationalPhone,
        e164: normalizedPhone,
      });

      setCodeSent(true);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to send verification code"
      );
    } finally {
      setIsSendingCode(false);
    }
  }

  async function handleVerifyCode() {
    if (!verificationCode.trim()) {
      setError("Enter the verification code");
      return;
    }

    setIsVerifyingCode(true);

    try {
      const res = await verifyPhoneCode({
        e164: normalizedPhone,
        code: verificationCode.trim(),
      });

      if (res.verified) {
        setPhoneVerified(true);
      } else {
        setError("Invalid verification code");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Verification failed");
    } finally {
      setIsVerifyingCode(false);
    }
  }

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!securityReady) {
      setError("Complete phone verification or choose add later.");
      return;
    }

    setIsBusy(true);

    try {
      await completeBuildInstitution();
      clearOnboardingState();
      router.push("/dashboard/control-center");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "We couldn’t create your workspace yet."
      );
    } finally {
      setIsBusy(false);
    }
  }

  async function goNext() {
    setError(null);

    try {
      if (
        step === "identity" &&
        identityReady &&
        institutionType &&
        selectedCountry
      ) {
        await saveBuildIdentity({
          institutionType: mapInstitutionTypeForApi(institutionType),
          institutionName: schoolName.trim(),
          country: selectedCountry.name,
          countryCode: selectedCountry.code,
        });

        setStep("academic");
        return;
      }

      if (step === "academic" && academicReady) {
        await saveBuildAcademic({
          label: academicLabel,
          selectedItems: selectedAcademicItems.map((item) => item.label),
          setUpLater: setAcademicLater,
        });

        setStep("details");
        return;
      }

      if (step === "details" && detailsReady) {
        await saveBuildDetails({
          learningModes: details.learningModes.map((mode) =>
            mode.toUpperCase().replace(/[\s-]+/g, "_")
          ),
          ownership: details.ownership,
          levelType: details.levelType,
          genderAdmissionPolicy: details.genderAdmissionPolicy || undefined,
        });

        setStep("security");
        return;
      }

      if (step === "security") {
        if (addPhoneLater) {
          await skipPhoneStep();
          setStep("review");
          return;
        }

        if (!phoneVerified) {
          setError("Please verify your phone number before continuing.");
          return;
        }

        setStep("review");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not continue.");
    }
  }

  function goBack() {
    setError(null);

    if (step === "identity") {
      router.push("/onboarding");
      return;
    }

    if (step === "academic") {
      setStep("identity");
      return;
    }

    if (step === "details") {
      setStep("academic");
      return;
    }

    if (step === "security") {
      setStep("details");
      return;
    }

    setStep("security");
  }

  if (isLoading) {
    return (
      <div className="skuully-cinematic-bg flex min-h-screen items-center justify-center text-white">
        <div className="skuully-glass-card rounded-[28px] px-6 py-5 text-sm text-white/65">
          Preparing your workspace setup...
        </div>
      </div>
    );
  }

  return (
    <OnboardingShell
      step={currentStep}
      totalSteps={totalSteps}
      title={`Build your ${prettyInstitutionLabel(
        institutionType
      ).toLowerCase()} workspace`}
      subtitle="We’ll shape a smart starting point around your choices."
      backHref="/onboarding"
      align="top"
      footer={
        <div className="flex flex-wrap items-center justify-between gap-4">
          <button
            type="button"
            onClick={goBack}
            className="text-sm text-white/55 transition hover:text-white"
          >
            Back
          </button>

          {step !== "review" ? (
            <button
              type="button"
              onClick={goNext}
              disabled={
                (step === "identity" && !identityReady) ||
                (step === "academic" && !academicReady) ||
                (step === "details" && !detailsReady) ||
                (step === "security" && !securityReady)
              }
              className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-medium text-black transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Continue
              <ArrowRight className="h-4 w-4" />
            </button>
          ) : (
            <button
              type="submit"
              form="create-school-form"
              disabled={isBusy}
              className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-medium text-black transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isBusy ? "Creating workspace..." : "Create workspace"}
              <ArrowRight className="h-4 w-4" />
            </button>
          )}
        </div>
      }
    >
      <form
        id="create-school-form"
        className="space-y-6"
        onSubmit={handleCreate}
      >
        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-6">
            {step === "identity" ? (
              <>
                <div className="skuully-glass-card rounded-[24px] p-5">
                  <label className="mb-3 block text-sm text-white/70">
                    {prettyInstitutionLabel(institutionType)} name
                  </label>

                  <input
                    className="skuully-focus-ring w-full rounded-[20px] border border-white/10 bg-white/[0.03] px-4 py-4 text-white outline-none placeholder:text-white/25"
                    value={schoolName}
                    onChange={(event) => setSchoolName(event.target.value)}
                    placeholder={suggestedPlaceholder(institutionType)}
                    required
                  />
                </div>

                <div
                  ref={pickerRef}
                  className="skuully-glass-card rounded-[24px] p-5"
                >
                  <label className="mb-3 block text-sm text-white/70">
                    Country
                  </label>

                  <div className="relative">
                    <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/35" />

                    <input
                      className="skuully-focus-ring w-full rounded-[20px] border border-white/10 bg-white/[0.03] py-4 pl-11 pr-12 text-white outline-none placeholder:text-white/25"
                      value={countrySearch}
                      onChange={(event) => {
                        setCountrySearch(event.target.value);
                        setPickerOpen(true);
                      }}
                      onFocus={() => setPickerOpen(true)}
                      placeholder="Search any country"
                    />

                    <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/35" />

                    {pickerOpen ? (
                      <div className="absolute z-30 mt-2 max-h-72 w-full overflow-y-auto rounded-[20px] border border-white/10 bg-[#0a1022] p-2 shadow-[0_20px_60px_rgba(0,0,0,0.45)]">
                        {filteredCountries.length > 0 ? (
                          filteredCountries.map((country) => {
                            const selected =
                              selectedCountry?.code === country.code;

                            return (
                              <button
                                key={country.code}
                                type="button"
                                onClick={() => {
                                  setSelectedCountry(country);
                                  setCountrySearch(country.name);
                                  setPickerOpen(false);

                                  const matchedPhoneCountry =
                                    PHONE_COUNTRIES.find(
                                      (item) => item.code === country.code
                                    );

                                  if (matchedPhoneCountry) {
                                    setPhoneCountryCode(matchedPhoneCountry.code);
                                    setPhoneNumber("");
                                    setPhoneError(null);
                                    setCodeSent(false);
                                    setPhoneVerified(false);
                                    setVerificationCode("");
                                  }
                                }}
                                className={`flex w-full items-start justify-between rounded-2xl px-4 py-3 text-left transition ${
                                  selected
                                    ? "bg-[rgba(58,109,255,0.14)]"
                                    : "hover:bg-white/[0.05]"
                                }`}
                              >
                                <div>
                                  <div className="text-sm font-medium text-white">
                                    {country.name}
                                  </div>
                                  <div className="mt-1 text-xs text-white/45">
                                    {country.nativeCurriculum ??
                                      "No default academic suggestion"}
                                  </div>
                                </div>

                                {selected ? (
                                  <Check className="mt-0.5 h-4 w-4 text-[#9bb4ff]" />
                                ) : null}
                              </button>
                            );
                          })
                        ) : (
                          <div className="rounded-2xl px-4 py-4 text-sm text-white/50">
                            No countries matched your search.
                          </div>
                        )}
                      </div>
                    ) : null}
                  </div>
                </div>
              </>
            ) : null}

            {step === "academic" ? (
              <div className="skuully-glass-card rounded-[24px] p-5">
                <div className="flex items-start gap-3">
                  <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04]">
                    <Sparkles className="h-4 w-4 text-[#b7c8ff]" />
                  </div>

                  <div className="min-w-0">
                    <h3 className="text-lg font-medium text-white">
                      {academicLabel}
                    </h3>
                    <p className="mt-1 text-sm leading-7 text-white/55">
                      {academicDescription}
                    </p>
                  </div>
                </div>

                <div className="mt-4">
                  <label className="mb-3 block text-sm text-white/70">
                    Search options
                  </label>

                  <div className="relative">
                    <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/35" />
                    <input
                      className="skuully-focus-ring w-full rounded-[20px] border border-white/10 bg-white/[0.03] py-4 pl-11 pr-4 text-white outline-none placeholder:text-white/25"
                      value={academicSearch}
                      onChange={(event) => setAcademicSearch(event.target.value)}
                      placeholder={`Search ${academicLabel.toLowerCase()}`}
                    />
                  </div>

                  <div className="mt-3 max-h-72 space-y-2 overflow-y-auto">
                    {filteredAcademicOptions.map((item) => {
                      const selected = isSelectedAcademicOption(item);

                      return (
                        <button
                          key={`${item.label}-${item.code ?? "no-code"}`}
                          type="button"
                          onClick={() => toggleAcademicItem(item)}
                          className={`flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-left transition ${
                            selected
                              ? "border-[rgba(58,109,255,0.28)] bg-[rgba(58,109,255,0.10)]"
                              : "border-white/10 bg-white/[0.03] hover:bg-white/[0.05]"
                          }`}
                        >
                          <span className="text-sm text-white">{item.label}</span>
                          {selected ? (
                            <Check className="h-4 w-4 text-[#9bb4ff]" />
                          ) : null}
                        </button>
                      );
                    })}
                  </div>

                  {selectedAcademicItems.length > 0 ? (
                    <div className="mt-4 flex flex-wrap gap-2">
                      {selectedAcademicItems.map((item) => (
                        <button
                          key={`${item.label}-${item.code ?? "no-code"}-chip`}
                          type="button"
                          onClick={() => toggleAcademicItem(item)}
                          className="rounded-full border border-[rgba(58,109,255,0.28)] bg-[rgba(58,109,255,0.10)] px-3 py-1.5 text-xs text-white/85"
                        >
                          {item.label} ×
                        </button>
                      ))}
                    </div>
                  ) : null}

                  <button
                    type="button"
                    onClick={() => {
                      setSetAcademicLater(true);
                      setSelectedAcademicItems([]);
                    }}
                    className={`mt-4 w-full rounded-[20px] border px-4 py-4 text-left transition ${
                      setAcademicLater
                        ? "border-[rgba(58,109,255,0.28)] bg-[rgba(58,109,255,0.10)]"
                        : "border-white/10 bg-white/[0.03] hover:bg-white/[0.05]"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <div className="text-sm font-medium text-white">
                          Set up later
                        </div>
                        <div className="mt-1 text-sm text-white/52">
                          Continue now and configure this in more detail later
                        </div>
                      </div>

                      {setAcademicLater ? (
                        <Check className="h-4 w-4 text-[#9bb4ff]" />
                      ) : null}
                    </div>
                  </button>
                </div>
              </div>
            ) : null}

            {step === "details" ? (
              <div className="skuully-glass-card rounded-[24px] p-5">
                <h3 className="text-lg font-medium text-white">
                  Relevant details for your{" "}
                  {prettyInstitutionLabel(institutionType).toLowerCase()}
                </h3>
                <p className="mt-1 text-sm leading-7 text-white/55">
                  Skuully adjusts these fields based on what you are building.
                </p>

                <div className="mt-5 grid gap-4">
                  <div>
                    <label className="mb-2 block text-sm text-white/70">
                      Learning modes
                    </label>

                    <div className="flex flex-wrap gap-2">
                      {detailOptions.learningModes.map((option) => {
                        const selected = details.learningModes.includes(option);

                        return (
                          <button
                            key={option}
                            type="button"
                            onClick={() => toggleLearningMode(option)}
                            className={`rounded-full border px-3 py-2 text-sm transition ${
                              selected
                                ? "border-[rgba(58,109,255,0.28)] bg-[rgba(58,109,255,0.10)] text-white"
                                : "border-white/10 bg-white/[0.03] text-white/70 hover:bg-white/[0.05]"
                            }`}
                          >
                            {option}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm text-white/70">
                      Ownership
                    </label>
                    <select
                      value={details.ownership}
                      onChange={(event) =>
                        setDetails((prev) => ({
                          ...prev,
                          ownership: event.target.value,
                        }))
                      }
                      className="skuully-focus-ring w-full rounded-[20px] border border-white/10 bg-[#0b1022] px-4 py-4 text-white outline-none"
                    >
                      <option value="">Select ownership</option>
                      {detailOptions.ownerships.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm text-white/70">
                      Level type
                    </label>
                    <select
                      value={details.levelType}
                      onChange={(event) =>
                        setDetails((prev) => ({
                          ...prev,
                          levelType: event.target.value,
                        }))
                      }
                      className="skuully-focus-ring w-full rounded-[20px] border border-white/10 bg-[#0b1022] px-4 py-4 text-white outline-none"
                    >
                      <option value="">Select level type</option>
                      {detailOptions.levelTypes.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm text-white/70">
                      Admissions policy
                    </label>
                    <select
                      value={details.genderAdmissionPolicy}
                      onChange={(event) =>
                        setDetails((prev) => ({
                          ...prev,
                          genderAdmissionPolicy: event.target.value,
                        }))
                      }
                      className="skuully-focus-ring w-full rounded-[20px] border border-white/10 bg-[#0b1022] px-4 py-4 text-white outline-none"
                    >
                      <option value="">Select admissions policy</option>
                      {detailOptions.genderAdmissionPolicies.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            ) : null}

            {step === "security" ? (
              <div className="skuully-glass-card rounded-[24px] p-5">
                <div className="flex items-start gap-3">
                  <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04]">
                    <LockKeyhole className="h-4 w-4 text-[#b7c8ff]" />
                  </div>

                  <div className="min-w-0">
                    <h3 className="text-lg font-medium text-white">
                      Add a verification number
                    </h3>
                    <p className="mt-1 text-sm leading-7 text-white/55">
                      Protect your account with a phone number for future verification and 2FA.
                    </p>
                  </div>
                </div>

                <div className="mt-5 grid gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setAddPhoneLater(true);
                      setPhoneError(null);
                      setPhoneVerified(false);
                      setCodeSent(false);
                      setVerificationCode("");
                    }}
                    className={`rounded-[20px] border px-4 py-4 text-left transition ${
                      addPhoneLater
                        ? "border-[rgba(58,109,255,0.28)] bg-[rgba(58,109,255,0.10)]"
                        : "border-white/10 bg-white/[0.03] hover:bg-white/[0.05]"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <div className="text-sm font-medium text-white">
                          Add later
                        </div>
                        <div className="mt-1 text-sm text-white/52">
                          Skip phone verification for now
                        </div>
                      </div>

                      {addPhoneLater ? (
                        <Check className="h-4 w-4 text-[#9bb4ff]" />
                      ) : null}
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setAddPhoneLater(false)}
                    className={`rounded-[20px] border px-4 py-4 text-left transition ${
                      !addPhoneLater
                        ? "border-[rgba(58,109,255,0.28)] bg-[rgba(58,109,255,0.10)]"
                        : "border-white/10 bg-white/[0.03] hover:bg-white/[0.05]"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <div className="text-sm font-medium text-white">
                          Add phone now
                        </div>
                        <div className="mt-1 text-sm text-white/52">
                          Use a verification number for future account protection
                        </div>
                      </div>

                      {!addPhoneLater ? (
                        <Check className="h-4 w-4 text-[#9bb4ff]" />
                      ) : null}
                    </div>
                  </button>

                  {!addPhoneLater ? (
                    <div className="space-y-3">
                      <div className="grid gap-3 sm:grid-cols-[190px_1fr]">
                        <div>
                          <label className="mb-2 block text-sm text-white/70">
                            Country
                          </label>
                          <select
                            value={phoneCountryCode}
                            onChange={(event) => {
                              setPhoneCountryCode(event.target.value);
                              setPhoneError(null);
                              setPhoneNumber("");
                              setCodeSent(false);
                              setPhoneVerified(false);
                              setVerificationCode("");
                            }}
                            className="skuully-focus-ring w-full rounded-[20px] border border-white/10 bg-[#0b1022] px-4 py-4 text-white outline-none"
                          >
                            {PHONE_COUNTRIES.map((item) => (
                              <option key={item.code} value={item.code}>
                                {item.flag} {item.name} ({item.dialCode})
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="mb-2 block text-sm text-white/70">
                            Phone number
                          </label>
                          <div className="flex overflow-hidden rounded-[20px] border border-white/10 bg-white/[0.03]">
                            <div className="flex items-center gap-2 border-r border-white/10 px-4 text-sm text-white/70">
                              <span>{currentPhoneCountry.flag}</span>
                              <span>{currentPhoneCountry.dialCode}</span>
                            </div>

                            <input
                              className="skuully-focus-ring w-full bg-transparent px-4 py-4 text-white outline-none placeholder:text-white/25"
                              value={phoneNumber}
                              onChange={(event) =>
                                handlePhoneChange(event.target.value)
                              }
                              placeholder="Enter phone number"
                              inputMode="numeric"
                              type="tel"
                            />
                          </div>
                        </div>
                      </div>

                      {!codeSent ? (
                        <button
                          type="button"
                          onClick={handleSendCode}
                          disabled={isSendingCode}
                          className="w-full rounded-[18px] bg-white px-4 py-3 text-sm font-medium text-black disabled:opacity-50"
                        >
                          {isSendingCode
                            ? "Sending code..."
                            : "Send verification code"}
                        </button>
                      ) : null}

                      {codeSent && !phoneVerified ? (
                        <div className="space-y-2">
                          <input
                            value={verificationCode}
                            onChange={(e) => setVerificationCode(e.target.value)}
                            placeholder="Enter verification code"
                            className="skuully-focus-ring w-full rounded-[20px] border border-white/10 bg-white/[0.03] px-4 py-4 text-white outline-none"
                          />

                          <button
                            type="button"
                            onClick={handleVerifyCode}
                            disabled={isVerifyingCode}
                            className="w-full rounded-[18px] bg-white px-4 py-3 text-sm font-medium text-black disabled:opacity-50"
                          >
                            {isVerifyingCode ? "Verifying..." : "Verify code"}
                          </button>
                        </div>
                      ) : null}

                      {phoneVerified ? (
                        <div className="rounded-2xl border border-green-400/20 bg-green-400/10 px-4 py-3 text-sm text-green-100">
                          ✅ Phone number verified successfully
                        </div>
                      ) : null}

                      {phoneError ? (
                        <div className="rounded-2xl border border-rose-400/20 bg-rose-400/10 px-4 py-3 text-sm text-rose-100">
                          {phoneError}
                        </div>
                      ) : (
                        <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white/55">
                          Final number: {normalizedPhone}
                        </div>
                      )}
                    </div>
                  ) : null}
                </div>
              </div>
            ) : null}

            {step === "review" ? (
              <div className="skuully-glass-card rounded-[24px] p-5">
                <h3 className="text-lg font-medium text-white">
                  Review your workspace
                </h3>

                <div className="mt-5 space-y-3 text-sm text-white/55">
                  <p>
                    <span className="text-white">Type:</span>{" "}
                    {prettyInstitutionLabel(institutionType)}
                  </p>
                  <p>
                    <span className="text-white">Name:</span>{" "}
                    {review?.institutionName ?? schoolName.trim()}
                  </p>
                  <p>
                    <span className="text-white">Country:</span>{" "}
                    {review?.country ?? selectedCountry?.name}
                  </p>
                  <p>
                    <span className="text-white">{academicLabel}:</span>{" "}
                    {review?.academicSetLater
                      ? "Will set later"
                      : review?.academicItems?.length
                      ? review.academicItems.join(", ")
                      : "None selected"}
                  </p>
                  <p>
                    <span className="text-white">Learning modes:</span>{" "}
                    {review?.learningModes?.length
                      ? review.learningModes.join(", ")
                      : "Not set"}
                  </p>
                  <p>
                    <span className="text-white">Ownership:</span>{" "}
                    {review?.ownership ?? "Not set"}
                  </p>
                  <p>
                    <span className="text-white">Level type:</span>{" "}
                    {review?.levelType ?? "Not set"}
                  </p>
                  <p>
                    <span className="text-white">Admissions policy:</span>{" "}
                    {review?.genderAdmissionPolicy ?? "Not set"}
                  </p>
                  <p>
                    <span className="text-white">Verification phone:</span>{" "}
                    {review?.phoneSetLater
                      ? "Will add later"
                      : review?.phone ?? "Not set"}
                  </p>
                </div>

                <div className="mt-5 rounded-[20px] border border-white/10 bg-white/[0.03] p-4 text-sm leading-7 text-white/52">
                  Skuully will prepare your main workspace and initial structure from this setup.
                </div>
              </div>
            ) : null}
          </div>

          <div className="space-y-6">
            <MiniInfo label="Founder" value={me?.fullName ?? "Ready"} />
            <MiniInfo
              label="Institution type"
              value={prettyInstitutionLabel(institutionType)}
            />
            <MiniInfo
              label="Country"
              value={selectedCountry?.name ?? "Pending"}
            />

            <div className="skuully-glass-card rounded-[24px] p-5">
              <div className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04]">
                <Building2 className="h-4 w-4 text-white/72" />
              </div>

              <h3 className="mt-4 text-lg font-medium text-white">
                Workspace snapshot
              </h3>

              <div className="mt-4 space-y-3 text-sm text-white/55">
                <p>
                  <span className="text-white">Step:</span> {currentStep} of{" "}
                  {totalSteps}
                </p>
                <p>
                  <span className="text-white">Suggested default:</span>{" "}
                  {selectedCountry?.nativeCurriculum ?? "Not available"}
                </p>
                <p>
                  <span className="text-white">Selected items:</span>{" "}
                  {setAcademicLater
                    ? "Later"
                    : selectedAcademicItems.length
                    ? selectedAcademicItems.map((item) => item.label).join(", ")
                    : "Pending"}
                </p>
              </div>
            </div>

            <div className="skuully-glass-card rounded-[24px] p-5">
              <div className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04]">
                <Globe2 className="h-4 w-4 text-white/72" />
              </div>

              <h3 className="mt-4 text-lg font-medium text-white">
                Smart setup
              </h3>

              <p className="mt-2 text-sm leading-7 text-white/55">
                Skuully is using your institution type and country to shape the most relevant setup path for you.
              </p>
            </div>
          </div>
        </div>

        {error ? (
          <div className="rounded-2xl border border-rose-400/20 bg-rose-400/10 px-4 py-3 text-sm text-rose-100">
            {error}
          </div>
        ) : null}
      </form>
    </OnboardingShell>
  );
}