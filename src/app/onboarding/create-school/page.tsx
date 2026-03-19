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

type BuildStep = "identity" | "curriculum" | "details" | "security" | "review";

type InstitutionDetails = {
  learningMode: string;
  ownership: string;
  levelType: string;
};

const INTERNATIONAL_CURRICULA = [
  "Cambridge Curriculum",
  "International Baccalaureate (IB)",
  "American Curriculum",
  "British Curriculum",
  "CBSE",
  "IGCSE",
  "Pearson Edexcel",
  "Montessori",
  "Waldorf",
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

function getInstitutionDetailOptions(type: BuildInstitutionType | null) {
  switch (type) {
    case "school":
      return {
        learningModes: ["Day", "Boarding", "Mixed"],
        ownerships: ["Private", "Public", "International"],
        levelTypes: ["Primary", "Secondary", "Combined"],
      };
    case "college":
      return {
        learningModes: ["In-person", "Hybrid", "Mixed"],
        ownerships: ["Private", "Public"],
        levelTypes: ["Certificate", "Diploma", "Mixed"],
      };
    case "university":
      return {
        learningModes: ["In-person", "Hybrid", "Online"],
        ownerships: ["Private", "Public"],
        levelTypes: ["Undergraduate", "Postgraduate", "Both"],
      };
    case "polytechnic":
      return {
        learningModes: ["Practical", "Hybrid", "Workshop-led"],
        ownerships: ["Private", "Public"],
        levelTypes: ["Technical", "Diploma", "Mixed"],
      };
    case "vocational":
      return {
        learningModes: ["Hands-on", "Hybrid", "Workshop-led"],
        ownerships: ["Private", "Public"],
        levelTypes: ["Skills", "Certification", "Mixed"],
      };
    case "academy":
      return {
        learningModes: ["In-person", "Hybrid", "Online"],
        ownerships: ["Private", "Independent"],
        levelTypes: ["Specialized", "General", "Mixed"],
      };
    case "training_center":
      return {
        learningModes: ["In-person", "Hybrid", "Online"],
        ownerships: ["Private", "Public"],
        levelTypes: ["Professional", "Certification", "Mixed"],
      };
    default:
      return {
        learningModes: ["In-person", "Hybrid"],
        ownerships: ["Private", "Public"],
        levelTypes: ["General"],
      };
  }
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

  const [curriculumSearch, setCurriculumSearch] = useState("");
  const [selectedCurriculum, setSelectedCurriculum] = useState("");
  const [setCurriculumLater, setSetCurriculumLater] = useState(false);

  const [details, setDetails] = useState<InstitutionDetails>({
    learningMode: "",
    ownership: "",
    levelType: "",
  });

  const [phoneNumber, setPhoneNumber] = useState("");
  const [addPhoneLater, setAddPhoneLater] = useState(true);

  const [error, setError] = useState<string | null>(null);

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

        if (meResponse.context?.schoolId && meResponse.context?.programId) {
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
        setSelectedCountry(kenya);
        setCountrySearch(kenya?.name ?? "");
        setSelectedCurriculum(kenya?.nativeCurriculum ?? "");

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

  const filteredCurricula = useMemo(() => {
    const all = [
      ...(selectedCountry?.nativeCurriculum ? [selectedCountry.nativeCurriculum] : []),
      ...INTERNATIONAL_CURRICULA,
    ].filter((value, index, array) => array.indexOf(value) === index);

    const query = curriculumSearch.trim().toLowerCase();
    if (!query) return all;

    return all.filter((item) => item.toLowerCase().includes(query));
  }, [curriculumSearch, selectedCountry]);

  const detailOptions = useMemo(
    () => getInstitutionDetailOptions(institutionType),
    [institutionType]
  );

  const identityReady =
    schoolName.trim().length >= 2 && !!selectedCountry;

  const curriculumReady =
    setCurriculumLater || selectedCurriculum.trim().length >= 2;

  const detailsReady =
    details.learningMode && details.ownership && details.levelType;

  const securityReady =
    addPhoneLater || phoneNumber.trim().length >= 7;

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!institutionType || !selectedCountry || !schoolName.trim()) {
      setError("Complete your institution setup before creating the workspace.");
      return;
    }

    setIsBusy(true);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

      const res = await fetch(`${apiUrl}/schools`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          name: schoolName.trim(),
          country: selectedCountry.name,
          curriculumName: setCurriculumLater ? null : selectedCurriculum.trim(),
          institutionType: mapInstitutionTypeForApi(institutionType),
          organizationName: schoolName.trim(),
          branchName: "Main Campus",
          metadata: {
            details,
            phoneNumber: addPhoneLater ? null : phoneNumber.trim(),
            setCurriculumLater,
          },
        }),
      });

      const payload = await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error(
          Array.isArray(payload?.message)
            ? payload.message[0]
            : payload?.message || "We couldn’t create your workspace yet."
        );
      }

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

  function goNext() {
    setError(null);

    if (step === "identity" && identityReady) {
      if (selectedCountry?.nativeCurriculum) {
        setSelectedCurriculum(selectedCountry.nativeCurriculum);
      }
      setStep("curriculum");
      return;
    }

    if (step === "curriculum" && curriculumReady) {
      setStep("details");
      return;
    }

    if (step === "details" && detailsReady) {
      setStep("security");
      return;
    }

    if (step === "security" && securityReady) {
      setStep("review");
    }
  }

  function goBack() {
    setError(null);

    if (step === "identity") {
      router.push("/onboarding");
      return;
    }

    if (step === "curriculum") {
      setStep("identity");
      return;
    }

    if (step === "details") {
      setStep("curriculum");
      return;
    }

    if (step === "security") {
      setStep("details");
      return;
    }

    if (step === "review") {
      setStep("security");
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
      step={2}
      totalSteps={2}
      title={`Build your ${prettyInstitutionLabel(institutionType).toLowerCase()} workspace`}
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
                (step === "curriculum" && !curriculumReady) ||
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
      <form id="create-school-form" className="space-y-6" onSubmit={handleCreate}>
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

                <div ref={pickerRef} className="skuully-glass-card rounded-[24px] p-5">
                  <label className="mb-3 block text-sm text-white/70">Country</label>

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
                            const selected = selectedCountry?.code === country.code;

                            return (
                              <button
                                key={country.code}
                                type="button"
                                onClick={() => {
                                  setSelectedCountry(country);
                                  setCountrySearch(country.name);
                                  setPickerOpen(false);
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
                                    {country.nativeCurriculum ?? "No default curriculum suggestion"}
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

            {step === "curriculum" ? (
              <div className="skuully-glass-card rounded-[24px] p-5">
                <div className="flex items-start gap-3">
                  <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04]">
                    <Sparkles className="h-4 w-4 text-[#b7c8ff]" />
                  </div>

                  <div className="min-w-0">
                    <h3 className="text-lg font-medium text-white">
                      Curriculum setup
                    </h3>
                    <p className="mt-1 text-sm leading-7 text-white/55">
                      Start with the suggested native curriculum, choose an international one, or set it later.
                    </p>
                  </div>
                </div>

                {selectedCountry?.nativeCurriculum ? (
                  <button
                    type="button"
                    onClick={() => {
                      setSetCurriculumLater(false);
                      setSelectedCurriculum(selectedCountry.nativeCurriculum ?? "");
                    }}
                    className={`mt-5 w-full rounded-[20px] border px-4 py-4 text-left transition ${
                      !setCurriculumLater && selectedCurriculum === selectedCountry.nativeCurriculum
                        ? "border-[rgba(58,109,255,0.28)] bg-[rgba(58,109,255,0.10)]"
                        : "border-white/10 bg-white/[0.03] hover:bg-white/[0.05]"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <div className="text-sm font-medium text-white">
                          Suggested for {selectedCountry.name}
                        </div>
                        <div className="mt-1 text-sm text-white/52">
                          {selectedCountry.nativeCurriculum}
                        </div>
                      </div>

                      {!setCurriculumLater && selectedCurriculum === selectedCountry.nativeCurriculum ? (
                        <Check className="h-4 w-4 text-[#9bb4ff]" />
                      ) : null}
                    </div>
                  </button>
                ) : null}

                <div className="mt-4">
                  <label className="mb-3 block text-sm text-white/70">
                    Search curricula
                  </label>

                  <div className="relative">
                    <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/35" />
                    <input
                      className="skuully-focus-ring w-full rounded-[20px] border border-white/10 bg-white/[0.03] py-4 pl-11 pr-4 text-white outline-none placeholder:text-white/25"
                      value={curriculumSearch}
                      onChange={(event) => setCurriculumSearch(event.target.value)}
                      placeholder="Search native or international curricula"
                    />
                  </div>

                  <div className="mt-3 max-h-64 space-y-2 overflow-y-auto">
                    {filteredCurricula.map((curriculum) => {
                      const selected =
                        !setCurriculumLater && selectedCurriculum === curriculum;

                      return (
                        <button
                          key={curriculum}
                          type="button"
                          onClick={() => {
                            setSetCurriculumLater(false);
                            setSelectedCurriculum(curriculum);
                          }}
                          className={`flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-left transition ${
                            selected
                              ? "border-[rgba(58,109,255,0.28)] bg-[rgba(58,109,255,0.10)]"
                              : "border-white/10 bg-white/[0.03] hover:bg-white/[0.05]"
                          }`}
                        >
                          <span className="text-sm text-white">{curriculum}</span>
                          {selected ? <Check className="h-4 w-4 text-[#9bb4ff]" /> : null}
                        </button>
                      );
                    })}
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setSetCurriculumLater(true);
                      setSelectedCurriculum("");
                    }}
                    className={`mt-4 w-full rounded-[20px] border px-4 py-4 text-left transition ${
                      setCurriculumLater
                        ? "border-[rgba(58,109,255,0.28)] bg-[rgba(58,109,255,0.10)]"
                        : "border-white/10 bg-white/[0.03] hover:bg-white/[0.05]"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <div className="text-sm font-medium text-white">
                          Select later
                        </div>
                        <div className="mt-1 text-sm text-white/52">
                          Add or change curricula later during class or academic setup
                        </div>
                      </div>

                      {setCurriculumLater ? (
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
                  Relevant details for your {prettyInstitutionLabel(institutionType).toLowerCase()}
                </h3>
                <p className="mt-1 text-sm leading-7 text-white/55">
                  Skuully adjusts these fields based on what you are building.
                </p>

                <div className="mt-5 grid gap-4">
                  <div>
                    <label className="mb-2 block text-sm text-white/70">
                      Learning mode
                    </label>
                    <select
                      value={details.learningMode}
                      onChange={(event) =>
                        setDetails((prev) => ({ ...prev, learningMode: event.target.value }))
                      }
                      className="skuully-focus-ring w-full rounded-[20px] border border-white/10 bg-[#0b1022] px-4 py-4 text-white outline-none"
                    >
                      <option value="">Select learning mode</option>
                      {detailOptions.learningModes.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm text-white/70">
                      Ownership
                    </label>
                    <select
                      value={details.ownership}
                      onChange={(event) =>
                        setDetails((prev) => ({ ...prev, ownership: event.target.value }))
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
                        setDetails((prev) => ({ ...prev, levelType: event.target.value }))
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
                    onClick={() => setAddPhoneLater(true)}
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
                    <input
                      className="skuully-focus-ring w-full rounded-[20px] border border-white/10 bg-white/[0.03] px-4 py-4 text-white outline-none placeholder:text-white/25"
                      value={phoneNumber}
                      onChange={(event) => setPhoneNumber(event.target.value)}
                      placeholder="Enter phone number"
                      type="tel"
                    />
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
                    <span className="text-white">Curriculum:</span>{" "}
                    {setCurriculumLater ? "Will set later" : selectedCurriculum}
                  </p>
                  <p>
                    <span className="text-white">Learning mode:</span>{" "}
                    {details.learningMode}
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
                    <span className="text-white">Verification phone:</span>{" "}
                    {addPhoneLater ? "Will add later" : phoneNumber}
                  </p>
                </div>

                <div className="mt-5 rounded-[20px] border border-white/10 bg-white/[0.03] p-4 text-sm leading-7 text-white/52">
                  Skuully will prepare your main workspace and initial academic structure from this setup.
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
                  <span className="text-white">Step:</span> {step}
                </p>
                <p>
                  <span className="text-white">Native curriculum:</span>{" "}
                  {selectedCountry?.nativeCurriculum ?? "Not available"}
                </p>
                <p>
                  <span className="text-white">Selected curriculum:</span>{" "}
                  {setCurriculumLater ? "Later" : selectedCurriculum || "Pending"}
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