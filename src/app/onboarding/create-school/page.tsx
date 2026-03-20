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
import { getGeoCountries, getPhoneCountries, type GeoCountry } from "@/lib/geo";
import {
  readOnboardingState,
  type BuildInstitutionType,
} from "@/lib/onboarding-flow";
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

  const [error, setError] = useState<string | null>(null);

  const currentPhoneCountry =
    phoneCountries.find((item) => item.code === phoneCountryCode) ?? null;

  useEffect(() => {
    async function load() {
      try {
        const [meResponse, countriesResponse, phoneCountriesResponse] = await Promise.all([
          getMe(),
          getGeoCountries(),
          getPhoneCountries(),
        ]);

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
        setCountries(countriesResponse.items);
        setPhoneCountries(
          phoneCountriesResponse.items.map((item) => ({
            code: item.code,
            name: item.name,
            flagEmoji: item.flagEmoji,
            phoneCode: item.phoneCode,
            phoneMinLength: item.phoneMinLength,
            phoneMaxLength: item.phoneMaxLength,
          }))
        );

        const kenya = countriesResponse.items.find((item) => item.code === "KE") ?? null;
        if (kenya) {
          setSelectedCountry(kenya);
          setCountrySearch(kenya.name);
        }

        const phoneKenya =
          phoneCountriesResponse.items.find((item) => item.code === "KE") ?? null;
        if (phoneKenya) {
          setPhoneCountryCode(phoneKenya.code);
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
      } catch {}
    }

    void loadAcademicAndDetails();
  }, [institutionType, selectedCountry]);

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
  const securityReady =
    addPhoneLater ||
    (phoneVerified && !validatePhone(currentPhoneCountry, phoneNumber));

  const normalizedNationalPhone = normalizeNationalPhone(
    currentPhoneCountry,
    phoneNumber
  );
  const normalizedPhone =
    currentPhoneCountry?.phoneCode && normalizedNationalPhone
      ? `${currentPhoneCountry.phoneCode}${normalizedNationalPhone}`
      : "";

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
      setError(err instanceof Error ? err.message : "Failed to send verification code.");
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
      await verifyPhoneCode({
        e164: normalizedPhone,
        code: phoneCode.trim(),
      });

      setPhoneVerified(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to verify phone code.");
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
          genderAdmissionPolicy:
            details.genderAdmissionPolicy || undefined,
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
      await getBuildReview();
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
                                    {country.nativeCurriculumName ??
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
                      {detailOptions.learningModes.map((mode) => {
                        const value = mode
                          .trim()
                          .toUpperCase()
                          .replace(/[\s-]+/g, "_") as LearningMode;
                        const selected = details.learningModes.includes(value);

                        return (
                          <button
                            key={mode}
                            type="button"
                            onClick={() => toggleLearningMode(mode)}
                            className={`rounded-full border px-3 py-2 text-sm transition ${
                              selected
                                ? "border-[rgba(58,109,255,0.28)] bg-[rgba(58,109,255,0.10)] text-white"
                                : "border-white/10 bg-white/[0.03] text-white/75 hover:bg-white/[0.05]"
                            }`}
                          >
                            {mode}
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
                          genderAdmissionPolicy:
                            event.target.value as GenderAdmissionPolicy | "",
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
                          Verify before continuing
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
                              setPhoneCode("");
                              setPhoneCodeSent(false);
                              setPhoneVerified(false);
                            }}
                            className="skuully-focus-ring w-full rounded-[20px] border border-white/10 bg-[#0b1022] px-4 py-4 text-white outline-none"
                          >
                            {phoneCountries.map((item) => (
                              <option key={item.code} value={item.code}>
                                {item.flagEmoji ?? "🌍"} {item.name} ({item.phoneCode})
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
                              <span>{currentPhoneCountry?.flagEmoji ?? "🌍"}</span>
                              <span>{currentPhoneCountry?.phoneCode ?? ""}</span>
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

                      {phoneError ? (
                        <div className="rounded-2xl border border-rose-400/20 bg-rose-400/10 px-4 py-3 text-sm text-rose-100">
                          {phoneError}
                        </div>
                      ) : (
                        <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white/55">
                          Final number: {normalizedPhone || "—"}
                        </div>
                      )}

                      <div className="flex flex-wrap gap-3">
                        <button
                          type="button"
                          onClick={handleSendPhoneCode}
                          disabled={phoneBusy}
                          className="rounded-full bg-white px-4 py-2 text-sm font-medium text-black disabled:opacity-50"
                        >
                          {phoneBusy ? "Sending..." : "Send code"}
                        </button>

                        {phoneVerified ? (
                          <div className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-4 py-2 text-sm text-emerald-100">
                            Phone verified
                          </div>
                        ) : null}
                      </div>

                      {phoneCodeSent ? (
                        <div className="space-y-3">
                          <div>
                            <label className="mb-2 block text-sm text-white/70">
                              Verification code
                            </label>
                            <input
                              className="skuully-focus-ring w-full rounded-[20px] border border-white/10 bg-white/[0.03] px-4 py-4 text-white outline-none placeholder:text-white/25"
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
                            className="rounded-full bg-white px-4 py-2 text-sm font-medium text-black disabled:opacity-50"
                          >
                            {phoneBusy ? "Verifying..." : "Verify code"}
                          </button>
                        </div>
                      ) : null}
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
                    {schoolName.trim()}
                  </p>
                  <p>
                    <span className="text-white">Country:</span>{" "}
                    {selectedCountry?.name}
                  </p>
                  <p>
                    <span className="text-white">{academicLabel}:</span>{" "}
                    {setAcademicLater
                      ? "Will set later"
                      : selectedAcademicItems.length
                      ? selectedAcademicItems.map((item) => item.label).join(", ")
                      : "None selected"}
                  </p>
                  <p>
                    <span className="text-white">Learning modes:</span>{" "}
                    {details.learningModes.length
                      ? details.learningModes.join(", ")
                      : "None"}
                  </p>
                  <p>
                    <span className="text-white">Ownership:</span>{" "}
                    {details.ownership}
                  </p>
                  <p>
                    <span className="text-white">Level type:</span>{" "}
                    {details.levelType}
                  </p>
                  <p>
                    <span className="text-white">Admissions policy:</span>{" "}
                    {details.genderAdmissionPolicy || "Not set"}
                  </p>
                  <p>
                    <span className="text-white">Verification phone:</span>{" "}
                    {addPhoneLater ? "Will add later" : normalizedPhone}
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
                  {selectedCountry?.nativeCurriculumName ?? "Not available"}
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