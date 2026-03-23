"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Building2,
  Check,
  ChevronDown,
  Globe2,
  GraduationCap,
  LockKeyhole,
  Search,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

import { getMe } from "@/lib/auth";
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
  type AcademicOption,
  type GenderAdmissionPolicy,
  type LearningMode,
} from "@/lib/onboarding";
import {
  getGeoCountries,
  getPhoneCountries,
  type GeoCountry,
} from "@/lib/geo";
import {
  readOnboardingState,
  type BuildInstitutionType,
} from "@/lib/onboarding-flow";
import { OnboardingShell } from "@/components/onboarding/onboarding-shell";

type MeResponse = {
  id: string;
  fullName: string;
  email: string;
  phone?: string | null;
  skuullyId?: string | null;
  emailVerified?: boolean;
  phoneVerified?: boolean;
  context?: {
    schoolId?: string | null;
    programId?: string | null;
    role?: string | null;
    membershipId?: string | null;
  };
};

type BuildStep = "identity" | "academic" | "details" | "security" | "review";

type InstitutionDetails = {
  learningModes: LearningMode[];
  ownership: string;
  levelType: string;
  genderAdmissionPolicy: GenderAdmissionPolicy | "";
};

type PhoneCountry = {
  code: string;
  name: string;
  flagEmoji?: string | null;
  phoneCode?: string | null;
  phoneMinLength?: number | null;
  phoneMaxLength?: number | null;
};

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

function normalizeDigits(value: string) {
  return value.replace(/\D/g, "");
}

function normalizeNationalPhone(country: PhoneCountry | null, value: string) {
  let digits = normalizeDigits(value);

  if (!digits || !country?.phoneCode) return digits;

  const dialDigits = country.phoneCode.replace("+", "");

  if (digits.startsWith(dialDigits)) {
    digits = digits.slice(dialDigits.length);
  }

  if (digits.startsWith("0")) {
    digits = digits.slice(1);
  }

  return digits;
}

function validatePhone(country: PhoneCountry | null, value: string) {
  if (!country?.phoneCode) return "Select a phone country first.";

  const cleaned = normalizeNationalPhone(country, value);
  const min = country.phoneMinLength ?? 6;
  const max = country.phoneMaxLength ?? 15;

  if (!cleaned.length) return "Enter your phone number.";
  if (cleaned.length < min) return "Phone number is too short for this country.";
  if (cleaned.length > max) return "Phone number is too long for this country.";

  return null;
}

function formatEnumLabel(value: string) {
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function StepCard({
  icon,
  title,
  description,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="glass-strong spotlight-card rounded-[28px] border border-[var(--border)] p-5 sm:p-6">
      <div className="choice-card-glow" />

      <div className="relative flex items-start gap-4">
        <div className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-[var(--border)] bg-[var(--surface-1)] text-[rgb(var(--skuully-cyan))] shadow-[var(--elev-shadow-xs)]">
          {icon}
        </div>

        <div className="min-w-0">
          <h2 className="text-xl font-semibold tracking-[-0.02em] text-[var(--text-strong)]">
            {title}
          </h2>
          {description ? (
            <p className="mt-1.5 text-sm leading-7 text-[var(--text-soft)]">
              {description}
            </p>
          ) : null}
        </div>
      </div>

      <div className="relative mt-6">{children}</div>
    </div>
  );
}

function SummaryCard({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="glass rounded-[24px] border border-[var(--border)] p-5">
      <div className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-[var(--border)] bg-[var(--surface-1)] text-[rgb(var(--skuully-cyan))] shadow-[var(--elev-shadow-xs)]">
        {icon}
      </div>

      <h3 className="mt-4 text-base font-semibold text-[var(--text-strong)]">
        {title}
      </h3>

      <div className="mt-4">{children}</div>
    </div>
  );
}

function SummaryRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start justify-between gap-4 py-2">
      <span className="text-sm text-[var(--text-soft)]">{label}</span>
      <span className="max-w-[65%] text-right text-sm font-medium text-[var(--text-strong)]">
        {value}
      </span>
    </div>
  );
}

function SelectableCard({
  title,
  description,
  selected,
  onClick,
}: {
  title: string;
  description: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "w-full rounded-[22px] border p-4 text-left transition",
        selected
          ? "border-[rgba(var(--skuully-cyan),0.34)] bg-[rgba(var(--skuully-cyan),0.10)] shadow-[0_0_0_1px_rgba(59,180,229,0.10)]"
          : "border-[var(--border)] bg-[var(--surface-1)] hover:bg-[var(--surface-2)]",
      ].join(" ")}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-sm font-semibold text-[var(--text-strong)]">
            {title}
          </div>
          <div className="mt-1 text-sm leading-6 text-[var(--text-soft)]">
            {description}
          </div>
        </div>

        {selected ? (
          <div className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[rgba(var(--skuully-cyan),0.18)] text-[rgb(var(--skuully-cyan))]">
            <Check className="h-3.5 w-3.5" />
          </div>
        ) : null}
      </div>
    </button>
  );
}

function Chip({
  selected,
  children,
  onClick,
}: {
  selected: boolean;
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "rounded-full border px-3.5 py-2 text-sm transition",
        selected
          ? "border-[rgba(var(--skuully-cyan),0.30)] bg-[rgba(var(--skuully-cyan),0.12)] text-[var(--text-strong)]"
          : "border-[var(--border)] bg-[var(--surface-1)] text-[var(--text-soft)] hover:bg-[var(--surface-2)] hover:text-[var(--text-main)]",
      ].join(" ")}
    >
      {children}
    </button>
  );
}

export default function CreateSchoolPage() {
  const router = useRouter();
  const pickerRef = useRef<HTMLDivElement | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [isBusy, setIsBusy] = useState(false);
  const [me, setMe] = useState<MeResponse | null>(null);
  const [institutionType, setInstitutionType] =
    useState<BuildInstitutionType | null>(null);
  const [step, setStep] = useState<BuildStep>("identity");

  const [schoolName, setSchoolName] = useState("");
  const [countrySearch, setCountrySearch] = useState("");
  const [selectedCountry, setSelectedCountry] = useState<GeoCountry | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [countries, setCountries] = useState<GeoCountry[]>([]);

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
    genderAdmissionPolicies: Array<{ label: string; value: GenderAdmissionPolicy }>;
  }>({
    learningModes: [],
    ownerships: [],
    levelTypes: [],
    genderAdmissionPolicies: [],
  });

  const [addPhoneLater, setAddPhoneLater] = useState(true);
  const [phoneCountries, setPhoneCountries] = useState<PhoneCountry[]>([]);
  const [phoneCountryCode, setPhoneCountryCode] = useState("KE");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [phoneCode, setPhoneCode] = useState("");
  const [phoneCodeSent, setPhoneCodeSent] = useState(false);
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [phoneBusy, setPhoneBusy] = useState(false);

  const [review, setReview] = useState<Awaited<ReturnType<typeof getBuildReview>> | null>(null);
  const [error, setError] = useState<string | null>(null);

  const currentPhoneCountry =
    phoneCountries.find((item) => item.code === phoneCountryCode) ?? null;

  useEffect(() => {
    async function load() {
      try {
        const [meResponse, countriesResponse, phoneCountriesResponse] =
          await Promise.all([getMe(), getGeoCountries(), getPhoneCountries()]);

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
        setCountries(countriesResponse.items ?? []);

        const mappedPhoneCountries = (phoneCountriesResponse.items ?? []).map((item) => ({
          code: item.code,
          name: item.name,
          flagEmoji: item.flagEmoji,
          phoneCode: item.phoneCode,
          phoneMinLength: item.phoneMinLength,
          phoneMaxLength: item.phoneMaxLength,
        }));

        setPhoneCountries(mappedPhoneCountries);

        const defaultCountry =
          countriesResponse.items?.find((item) => item.code === "KE") ??
          countriesResponse.items?.[0] ??
          null;

        if (defaultCountry) {
          setSelectedCountry(defaultCountry);
          setCountrySearch(defaultCountry.name);
        }

        const defaultPhoneCountry =
          mappedPhoneCountries.find((item) => item.code === (defaultCountry?.code ?? "KE")) ??
          mappedPhoneCountries.find((item) => item.code === "KE") ??
          mappedPhoneCountries[0] ??
          null;

        if (defaultPhoneCountry) {
          setPhoneCountryCode(defaultPhoneCountry.code);
        }

        if (meResponse.phoneVerified) {
          setPhoneVerified(true);
        }

        setIsLoading(false);
      } catch {
        router.replace("/login");
      }
    }

    void load();
  }, [router]);

  useEffect(() => {
    async function loadAcademicAndDetails() {
      if (!institutionType || !selectedCountry?.code) return;

      try {
        const [academic, detail] = await Promise.all([
          getAcademicOptions(
            mapInstitutionTypeForApi(institutionType),
            selectedCountry.code
          ),
          getDetailOptions(mapInstitutionTypeForApi(institutionType)),
        ]);

        setAcademicLabel(academic.label);
        setAcademicDescription(academic.description);
        setAcademicOptions(academic.options);
        setDetailOptions(detail);
      } catch {
        setError("We couldn’t load setup options right now.");
      }
    }

    void loadAcademicAndDetails();
  }, [institutionType, selectedCountry]);

  useEffect(() => {
    async function loadReview() {
      if (step !== "review") return;

      try {
        const data = await getBuildReview();
        setReview(data);
      } catch {
        setError("We couldn’t load the review step.");
      }
    }

    void loadReview();
  }, [step]);

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

  const filteredCountries = useMemo(() => {
    const query = countrySearch.trim().toLowerCase();
    if (!query) return countries;

    return countries.filter(
      (item) =>
        item.name.toLowerCase().includes(query) ||
        item.code.toLowerCase().includes(query) ||
        (item.nativeCurriculumName ?? "").toLowerCase().includes(query)
    );
  }, [countries, countrySearch]);

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

  const normalizedNationalPhone = normalizeNationalPhone(
    currentPhoneCountry,
    phoneNumber
  );

  const normalizedPhone =
    currentPhoneCountry?.phoneCode && normalizedNationalPhone
      ? `${currentPhoneCountry.phoneCode}${normalizedNationalPhone}`
      : "";

  const securityReady =
    addPhoneLater ||
    (phoneVerified && !validatePhone(currentPhoneCountry, phoneNumber));

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

  function toggleLearningMode(mode: string) {
    const value = mode
      .trim()
      .toUpperCase()
      .replace(/[\s-]+/g, "_") as LearningMode;

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
    setPhoneVerified(false);
  }

  async function handleSendPhoneCode() {
    const validationError = validatePhone(currentPhoneCountry, phoneNumber);
    setPhoneError(validationError);

    if (validationError || !currentPhoneCountry?.phoneCode) return;

    setPhoneBusy(true);
    setError(null);

    try {
      await sendPhoneCode({
        countryCode: currentPhoneCountry.code,
        dialCode: currentPhoneCountry.phoneCode,
        nationalNumber: normalizedNationalPhone,
        e164: normalizedPhone,
      });

      setPhoneCodeSent(true);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to send verification code."
      );
    } finally {
      setPhoneBusy(false);
    }
  }

  async function handleVerifyPhoneCode() {
    if (!phoneCode.trim()) {
      setError("Enter the verification code sent to your phone.");
      return;
    }

    setPhoneBusy(true);
    setError(null);

    try {
      const result = await verifyPhoneCode({
        e164: normalizedPhone,
        code: phoneCode.trim(),
      });

      if (result.verified || result.phoneVerified) {
        setPhoneVerified(true);
        setPhoneError(null);
      } else {
        setPhoneVerified(false);
        setError("Invalid verification code.");
      }
    } catch (err) {
      setPhoneVerified(false);
      setError(
        err instanceof Error ? err.message : "Failed to verify phone code."
      );
    } finally {
      setPhoneBusy(false);
    }
  }

  async function goNext() {
    setError(null);

    try {
      if (step === "identity" && identityReady && selectedCountry) {
        await saveBuildIdentity({
          institutionType: mapInstitutionTypeForApi(institutionType),
          institutionName: schoolName.trim(),
          country: selectedCountry.name,
          countryCode: selectedCountry.code,
        });

        if (!selectedAcademicItems.length && !setAcademicLater) {
          if (selectedCountry.code === "KE") {
            const defaultCBC = academicOptions.find((item) => item.code === "KE_CBC");
            if (defaultCBC) {
              setSelectedAcademicItems([defaultCBC]);
            }
          } else if (selectedCountry.nativeCurriculumName) {
            setSelectedAcademicItems([
              {
                label: selectedCountry.nativeCurriculumName,
                category: "national",
              },
            ]);
          }
        }

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
          learningModes: details.learningModes,
          ownership: details.ownership || undefined,
          levelType: details.levelType || undefined,
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

        const validationError = validatePhone(currentPhoneCountry, phoneNumber);
        setPhoneError(validationError);

        if (validationError) {
          setError(validationError);
          return;
        }

        if (!phoneVerified) {
          setError("Verify your phone number before continuing.");
          return;
        }

        setStep("review");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save this step.");
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

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsBusy(true);

    try {
      await completeBuildInstitution();
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

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--surface-0)] px-4 text-[var(--text-main)]">
        <div className="glass rounded-[28px] border border-[var(--border)] px-6 py-5 text-sm text-[var(--text-soft)]">
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
            className="text-sm text-[var(--text-soft)] transition hover:text-[var(--text-main)]"
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
              className="skuully-cta inline-flex h-12 items-center gap-2 rounded-2xl px-5 text-sm font-semibold tracking-[-0.01em] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <span>Continue</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          ) : (
            <button
              type="submit"
              form="create-school-form"
              disabled={isBusy}
              className="skuully-cta inline-flex h-12 items-center gap-2 rounded-2xl px-5 text-sm font-semibold tracking-[-0.01em] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <span>{isBusy ? "Creating workspace..." : "Create workspace"}</span>
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
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
          <div className="space-y-6">
            {step === "identity" ? (
              <StepCard
                icon={<Building2 className="h-5 w-5" />}
                title={`Name your ${prettyInstitutionLabel(institutionType).toLowerCase()}`}
                description="Start with the institution name and country so Skuully can tailor your setup."
              >
                <div className="space-y-5">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-[var(--text-main)]">
                      {prettyInstitutionLabel(institutionType)} name
                    </label>
                    <input
                      className="h-12 w-full rounded-2xl border border-[var(--border)] bg-[var(--surface-1)] px-4 text-sm text-[var(--foreground)] outline-none transition placeholder:text-[var(--text-faint)] focus:border-[rgba(59,180,229,0.36)] focus:bg-[var(--surface-2)] focus:ring-4 focus:ring-[var(--ring)]"
                      value={schoolName}
                      onChange={(event) => setSchoolName(event.target.value)}
                      placeholder={suggestedPlaceholder(institutionType)}
                      required
                    />
                  </div>

                  <div ref={pickerRef}>
                    <label className="mb-2 block text-sm font-medium text-[var(--text-main)]">
                      Country
                    </label>

                    <div className="relative">
                      <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-faint)]" />

                      <input
                        className="h-12 w-full rounded-2xl border border-[var(--border)] bg-[var(--surface-1)] py-3 pl-11 pr-12 text-sm text-[var(--foreground)] outline-none transition placeholder:text-[var(--text-faint)] focus:border-[rgba(59,180,229,0.36)] focus:bg-[var(--surface-2)] focus:ring-4 focus:ring-[var(--ring)]"
                        value={countrySearch}
                        onChange={(event) => {
                          setCountrySearch(event.target.value);
                          setPickerOpen(true);
                        }}
                        onFocus={() => setPickerOpen(true)}
                        placeholder="Search any country"
                      />

                      <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-faint)]" />

                      {pickerOpen ? (
                        <div className="absolute z-30 mt-2 max-h-72 w-full overflow-y-auto rounded-[20px] border border-[var(--border)] bg-[var(--surface-0)] p-2 shadow-[var(--elev-shadow-lg)]">
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

                                    const matchedPhoneCountry = phoneCountries.find(
                                      (item) => item.code === country.code
                                    );

                                    if (matchedPhoneCountry) {
                                      setPhoneCountryCode(matchedPhoneCountry.code);
                                      setPhoneNumber("");
                                      setPhoneError(null);
                                      setPhoneCode("");
                                      setPhoneCodeSent(false);
                                      setPhoneVerified(false);
                                    }
                                  }}
                                  className={[
                                    "flex w-full items-start justify-between rounded-2xl px-4 py-3 text-left transition",
                                    selected
                                      ? "bg-[rgba(var(--skuully-cyan),0.10)]"
                                      : "hover:bg-[var(--surface-1)]",
                                  ].join(" ")}
                                >
                                  <div>
                                    <div className="text-sm font-medium text-[var(--text-strong)]">
                                      {country.name}
                                    </div>
                                    <div className="mt-1 text-xs text-[var(--text-soft)]">
                                      {country.nativeCurriculumName ??
                                        "No default academic suggestion"}
                                    </div>
                                  </div>

                                  {selected ? (
                                    <Check className="mt-0.5 h-4 w-4 text-[rgb(var(--skuully-cyan))]" />
                                  ) : null}
                                </button>
                              );
                            })
                          ) : (
                            <div className="rounded-2xl px-4 py-4 text-sm text-[var(--text-soft)]">
                              No countries matched your search.
                            </div>
                          )}
                        </div>
                      ) : null}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-1)] px-4 py-3 text-sm text-[var(--text-soft)]">
                    Skuully uses your country and institution type to suggest the most relevant academic structure.
                  </div>
                </div>
              </StepCard>
            ) : null}

            {step === "academic" ? (
              <StepCard
                icon={<Sparkles className="h-5 w-5" />}
                title={academicLabel}
                description={academicDescription}
              >
                <div className="space-y-5">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-[var(--text-main)]">
                      Search options
                    </label>
                    <div className="relative">
                      <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-faint)]" />
                      <input
                        className="h-12 w-full rounded-2xl border border-[var(--border)] bg-[var(--surface-1)] py-3 pl-11 pr-4 text-sm text-[var(--foreground)] outline-none transition placeholder:text-[var(--text-faint)] focus:border-[rgba(59,180,229,0.36)] focus:bg-[var(--surface-2)] focus:ring-4 focus:ring-[var(--ring)]"
                        value={academicSearch}
                        onChange={(event) => setAcademicSearch(event.target.value)}
                        placeholder={`Search ${academicLabel.toLowerCase()}`}
                      />
                    </div>
                  </div>

                  <div className="max-h-72 space-y-2 overflow-y-auto pr-1">
                    {filteredAcademicOptions.map((item) => {
                      const selected = isSelectedAcademicOption(item);

                      return (
                        <SelectableCard
                          key={`${item.label}-${item.code ?? "no-code"}`}
                          title={item.label}
                          description={
                            item.category
                              ? formatEnumLabel(item.category)
                              : item.recommended
                              ? "Recommended"
                              : "Academic option"
                          }
                          selected={selected}
                          onClick={() => toggleAcademicItem(item)}
                        />
                      );
                    })}
                  </div>

                  {selectedAcademicItems.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {selectedAcademicItems.map((item) => (
                        <Chip
                          key={`${item.label}-${item.code ?? "no-code"}-chip`}
                          selected
                          onClick={() => toggleAcademicItem(item)}
                        >
                          {item.label} ×
                        </Chip>
                      ))}
                    </div>
                  ) : null}

                  <SelectableCard
                    title="Set up later"
                    description="Continue now and configure academic structure in more detail later."
                    selected={setAcademicLater}
                    onClick={() => {
                      setSetAcademicLater(true);
                      setSelectedAcademicItems([]);
                    }}
                  />
                </div>
              </StepCard>
            ) : null}

            {step === "details" ? (
              <StepCard
                icon={<GraduationCap className="h-5 w-5" />}
                title="Add institution details"
                description="These details help shape operations, learning structure, and admissions setup."
              >
                <div className="grid gap-5">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-[var(--text-main)]">
                      Learning modes
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {detailOptions.learningModes.map((mode) => {
                        const value = mode
                          .trim()
                          .toUpperCase()
                          .replace(/[\s-]+/g, "_") as LearningMode;
                        const selected = details.learningModes.includes(value);

                        return (
                          <Chip
                            key={mode}
                            selected={selected}
                            onClick={() => toggleLearningMode(mode)}
                          >
                            {formatEnumLabel(value)}
                          </Chip>
                        );
                      })}
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-sm font-medium text-[var(--text-main)]">
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
                        className="h-12 w-full rounded-2xl border border-[var(--border)] bg-[var(--surface-1)] px-4 text-sm text-[var(--foreground)] outline-none transition focus:border-[rgba(59,180,229,0.36)] focus:bg-[var(--surface-2)] focus:ring-4 focus:ring-[var(--ring)]"
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
                      <label className="mb-2 block text-sm font-medium text-[var(--text-main)]">
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
                        className="h-12 w-full rounded-2xl border border-[var(--border)] bg-[var(--surface-1)] px-4 text-sm text-[var(--foreground)] outline-none transition focus:border-[rgba(59,180,229,0.36)] focus:bg-[var(--surface-2)] focus:ring-4 focus:ring-[var(--ring)]"
                      >
                        <option value="">Select level type</option>
                        {detailOptions.levelTypes.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-[var(--text-main)]">
                      Admissions policy
                    </label>
                    <select
                      value={details.genderAdmissionPolicy}
                      onChange={(event) =>
                        setDetails((prev) => ({
                          ...prev,
                          genderAdmissionPolicy:
                            event.target.value as GenderAdmissionPolicy | "",
                        }))
                      }
                      className="h-12 w-full rounded-2xl border border-[var(--border)] bg-[var(--surface-1)] px-4 text-sm text-[var(--foreground)] outline-none transition focus:border-[rgba(59,180,229,0.36)] focus:bg-[var(--surface-2)] focus:ring-4 focus:ring-[var(--ring)]"
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
              </StepCard>
            ) : null}

            {step === "security" ? (
              <StepCard
                icon={<ShieldCheck className="h-5 w-5" />}
                title="Add a verification number"
                description="Protect your account with a phone number for future verification and stronger account security."
              >
                <div className="space-y-4">
                  <SelectableCard
                    title="Add later"
                    description="Skip phone verification for now and continue setup."
                    selected={addPhoneLater}
                    onClick={() => {
                      setAddPhoneLater(true);
                      setPhoneError(null);
                    }}
                  />

                  <SelectableCard
                    title="Add phone now"
                    description="Verify your phone number before continuing."
                    selected={!addPhoneLater}
                    onClick={() => setAddPhoneLater(false)}
                  />

                  {!addPhoneLater ? (
                    <div className="space-y-4 rounded-[22px] border border-[var(--border)] bg-[var(--surface-1)] p-4">
                      <div className="grid gap-4 sm:grid-cols-[190px_1fr]">
                        <div>
                          <label className="mb-2 block text-sm font-medium text-[var(--text-main)]">
                            Country
                          </label>
                          <select
                            value={phoneCountryCode}
                            onChange={(event) => {
                              setPhoneCountryCode(event.target.value);
                              setPhoneError(null);
                              setPhoneNumber("");
                              setPhoneCode("");
                              setPhoneCodeSent(false);
                              setPhoneVerified(false);
                            }}
                            className="h-12 w-full rounded-2xl border border-[var(--border)] bg-[var(--surface-2)] px-4 text-sm text-[var(--foreground)] outline-none transition focus:border-[rgba(59,180,229,0.36)] focus:ring-4 focus:ring-[var(--ring)]"
                          >
                            {phoneCountries.map((item) => (
                              <option key={item.code} value={item.code}>
                                {item.flagEmoji ?? "🌍"} {item.name} ({item.phoneCode})
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="mb-2 block text-sm font-medium text-[var(--text-main)]">
                            Phone number
                          </label>
                          <div className="flex overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface-2)]">
                            <div className="flex items-center gap-2 border-r border-[var(--border)] px-4 text-sm text-[var(--text-soft)]">
                              <span>{currentPhoneCountry?.flagEmoji ?? "🌍"}</span>
                              <span>{currentPhoneCountry?.phoneCode ?? ""}</span>
                            </div>

                            <input
                              className="h-12 w-full bg-transparent px-4 text-sm text-[var(--foreground)] outline-none placeholder:text-[var(--text-faint)]"
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

                      {phoneError ? (
                        <div className="rounded-2xl border border-[rgba(198,38,74,0.24)] bg-[rgba(198,38,74,0.10)] px-4 py-3 text-sm text-[var(--text-main)] dark:text-rose-100">
                          {phoneError}
                        </div>
                      ) : (
                        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-2)] px-4 py-3 text-sm text-[var(--text-soft)]">
                          Final number: {normalizedPhone || "—"}
                        </div>
                      )}

                      <div className="flex flex-wrap gap-3">
                        <button
                          type="button"
                          onClick={handleSendPhoneCode}
                          disabled={phoneBusy}
                          className="rounded-2xl border border-[rgba(var(--skuully-cyan),0.28)] bg-[rgba(var(--skuully-cyan),0.10)] px-4 py-2.5 text-sm font-medium text-[var(--text-strong)] transition hover:bg-[rgba(var(--skuully-cyan),0.14)] disabled:opacity-50"
                        >
                          {phoneBusy ? "Sending..." : "Send code"}
                        </button>

                        {phoneVerified ? (
                          <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-2.5 text-sm text-emerald-100">
                            Phone verified
                          </div>
                        ) : null}
                      </div>

                      {phoneCodeSent ? (
                        <div className="space-y-3">
                          <div>
                            <label className="mb-2 block text-sm font-medium text-[var(--text-main)]">
                              Verification code
                            </label>
                            <input
                              className="h-12 w-full rounded-2xl border border-[var(--border)] bg-[var(--surface-2)] px-4 text-sm text-[var(--foreground)] outline-none transition placeholder:text-[var(--text-faint)] focus:border-[rgba(59,180,229,0.36)] focus:ring-4 focus:ring-[var(--ring)]"
                              value={phoneCode}
                              onChange={(event) => setPhoneCode(event.target.value)}
                              placeholder="Enter SMS code"
                              inputMode="numeric"
                            />
                          </div>

                          <button
                            type="button"
                            onClick={handleVerifyPhoneCode}
                            disabled={phoneBusy}
                            className="rounded-2xl border border-[rgba(var(--skuully-cyan),0.28)] bg-[rgba(var(--skuully-cyan),0.10)] px-4 py-2.5 text-sm font-medium text-[var(--text-strong)] transition hover:bg-[rgba(var(--skuully-cyan),0.14)] disabled:opacity-50"
                          >
                            {phoneBusy ? "Verifying..." : "Verify code"}
                          </button>
                        </div>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              </StepCard>
            ) : null}

            {step === "review" ? (
              <StepCard
                icon={<Check className="h-5 w-5" />}
                title="Review your workspace"
                description="Confirm your setup before Skuully creates your workspace."
              >
                <div className="rounded-[22px] border border-[var(--border)] bg-[var(--surface-1)] p-4">
                  <SummaryRow
                    label="Type"
                    value={prettyInstitutionLabel(institutionType)}
                  />
                  <SummaryRow
                    label="Name"
                    value={(review?.institutionName ?? schoolName.trim()) || "—"}
                  />
                  <SummaryRow
                    label="Country"
                    value={(review?.country ?? selectedCountry?.name) || "—"}
                  />
                  <SummaryRow
                    label={academicLabel}
                    value={
                      review?.academicSetLater
                        ? "Will set later"
                        : review?.academicItems?.length
                        ? review.academicItems.join(", ")
                        : selectedAcademicItems.length
                        ? selectedAcademicItems.map((item) => item.label).join(", ")
                        : "None selected"
                    }
                  />
                  <SummaryRow
                    label="Learning modes"
                    value={
                      review?.learningModes?.length
                        ? review.learningModes.map(formatEnumLabel).join(", ")
                        : details.learningModes.length
                        ? details.learningModes.map(formatEnumLabel).join(", ")
                        : "None"
                    }
                  />
                  <SummaryRow
                    label="Ownership"
                    value={(review?.ownership ?? details.ownership) || "Not set"}
                  />
                  <SummaryRow
                    label="Level type"
                    value={(review?.levelType ?? details.levelType) || "Not set"}
                  />
                  <SummaryRow
                    label="Admissions policy"
                    value={
                      review?.genderAdmissionPolicy
                        ? formatEnumLabel(review.genderAdmissionPolicy)
                        : details.genderAdmissionPolicy
                        ? formatEnumLabel(details.genderAdmissionPolicy)
                        : "Not set"
                    }
                  />
                  <SummaryRow
                    label="Verification phone"
                    value={
                      review?.phoneSetLater
                        ? "Will add later"
                        : review?.phone ??
                          (addPhoneLater ? "Will add later" : normalizedPhone || "—")
                    }
                  />
                </div>

                <div className="mt-4 rounded-2xl border border-[var(--border)] bg-[var(--surface-2)] p-4 text-sm leading-7 text-[var(--text-soft)]">
                  Skuully will prepare your main workspace and its initial academic structure from this setup.
                </div>
              </StepCard>
            ) : null}

            {error ? (
              <div className="rounded-2xl border border-[rgba(198,38,74,0.24)] bg-[rgba(198,38,74,0.10)] px-4 py-3 text-sm text-[var(--text-main)] dark:text-rose-100">
                {error}
              </div>
            ) : null}
          </div>

          <div className="space-y-5">
            <SummaryCard
              icon={<Building2 className="h-4 w-4" />}
              title="Workspace snapshot"
            >
              <div className="divide-y divide-[var(--border)]">
                <SummaryRow label="Founder" value={me?.fullName ?? "Ready"} />
                <SummaryRow
                  label="Institution type"
                  value={prettyInstitutionLabel(institutionType)}
                />
                <SummaryRow
                  label="Country"
                  value={selectedCountry?.name ?? "Pending"}
                />
                <SummaryRow
                  label="Step"
                  value={`${currentStep} of ${totalSteps}`}
                />
              </div>
            </SummaryCard>

            <SummaryCard
              icon={<Globe2 className="h-4 w-4" />}
              title="Smart setup"
            >
              <p className="text-sm leading-7 text-[var(--text-soft)]">
                Skuully uses your institution type and country to shape the most relevant setup path for your workspace.
              </p>

              <div className="mt-4 rounded-2xl border border-[var(--border)] bg-[var(--surface-2)] px-4 py-3 text-sm text-[var(--text-soft)]">
                Suggested default:{" "}
                <span className="font-medium text-[var(--text-strong)]">
                  {selectedCountry?.nativeCurriculumName ?? "Not available"}
                </span>
              </div>

              <div className="mt-3 rounded-2xl border border-[var(--border)] bg-[var(--surface-2)] px-4 py-3 text-sm text-[var(--text-soft)]">
                Selected items:{" "}
                <span className="font-medium text-[var(--text-strong)]">
                  {setAcademicLater
                    ? "Later"
                    : selectedAcademicItems.length
                    ? selectedAcademicItems.map((item) => item.label).join(", ")
                    : "Pending"}
                </span>
              </div>
            </SummaryCard>

            <SummaryCard
              icon={<LockKeyhole className="h-4 w-4" />}
              title="Security"
            >
              <p className="text-sm leading-7 text-[var(--text-soft)]">
                Email verification is already active. You can also add a phone number now or later for stronger account protection.
              </p>
            </SummaryCard>
          </div>
        </div>
      </form>
    </OnboardingShell>
  );
}