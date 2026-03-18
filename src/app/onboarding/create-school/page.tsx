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
  Search,
  Sparkles,
} from "lucide-react";

import { getMe } from "@/lib/auth";
import {
  clearOnboardingState,
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

type CountryOption = {
  code: string;
  name: string;
  curriculum: string;
  note: string;
};

const COUNTRIES: CountryOption[] = [
  { code: "KE", name: "Kenya", curriculum: "CBC", note: "Competency Based Curriculum" },
  { code: "UG", name: "Uganda", curriculum: "Uganda National Curriculum", note: "Suggested from country" },
  { code: "TZ", name: "Tanzania", curriculum: "Tanzania National Curriculum", note: "Suggested from country" },
  { code: "RW", name: "Rwanda", curriculum: "Rwanda Competence Based Curriculum", note: "Suggested from country" },
  { code: "BI", name: "Burundi", curriculum: "Burundi National Curriculum", note: "Suggested from country" },
  { code: "ET", name: "Ethiopia", curriculum: "Ethiopian National Curriculum", note: "Suggested from country" },
  { code: "ZA", name: "South Africa", curriculum: "CAPS", note: "Curriculum and Assessment Policy Statement" },
  { code: "NG", name: "Nigeria", curriculum: "Nigerian National Curriculum", note: "Suggested from country" },
  { code: "GH", name: "Ghana", curriculum: "Ghana Standards-Based Curriculum", note: "Suggested from country" },
  { code: "CM", name: "Cameroon", curriculum: "Cameroon National Curriculum", note: "Suggested from country" },
  { code: "US", name: "United States", curriculum: "General Program", note: "Flexible school setup" },
  { code: "CA", name: "Canada", curriculum: "General Program", note: "Flexible school setup" },
  { code: "GB", name: "United Kingdom", curriculum: "British Curriculum", note: "Suggested from country" },
  { code: "IN", name: "India", curriculum: "CBSE", note: "Suggested from country" },
  { code: "AE", name: "United Arab Emirates", curriculum: "General Program", note: "Flexible school setup" },
  { code: "SA", name: "Saudi Arabia", curriculum: "Saudi National Curriculum", note: "Suggested from country" },
  { code: "EG", name: "Egypt", curriculum: "Egyptian National Curriculum", note: "Suggested from country" },
  { code: "FR", name: "France", curriculum: "French National Curriculum", note: "Suggested from country" },
  { code: "DE", name: "Germany", curriculum: "General Program", note: "Flexible school setup" },
  { code: "BR", name: "Brazil", curriculum: "Brazilian National Curriculum", note: "Suggested from country" },
  { code: "AU", name: "Australia", curriculum: "Australian Curriculum", note: "Suggested from country" },
  { code: "NZ", name: "New Zealand", curriculum: "New Zealand Curriculum", note: "Suggested from country" },
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

export default function CreateSchoolPage() {
  const router = useRouter();
  const pickerRef = useRef<HTMLDivElement | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [isBusy, setIsBusy] = useState(false);
  const [me, setMe] = useState<MeResponse | null>(null);
  const [institutionType, setInstitutionType] = useState<BuildInstitutionType | null>(null);

  const [schoolName, setSchoolName] = useState("");
  const [countrySearch, setCountrySearch] = useState("");
  const [selectedCountry, setSelectedCountry] = useState<CountryOption | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [useSuggestedCurriculum, setUseSuggestedCurriculum] = useState(true);
  const [customCurriculum, setCustomCurriculum] = useState("");
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
        item.curriculum.toLowerCase().includes(query)
    );
  }, [countrySearch]);

  const resolvedCurriculum = useSuggestedCurriculum
    ? selectedCountry?.curriculum ?? "General Program"
    : customCurriculum.trim();

  const canSubmit =
    schoolName.trim().length >= 2 &&
    !!selectedCountry &&
    resolvedCurriculum.trim().length >= 2 &&
    !!institutionType;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!institutionType) {
      setError("Choose what you are building first.");
      return;
    }

    if (!schoolName.trim()) {
      setError(`Give your ${prettyInstitutionLabel(institutionType).toLowerCase()} a name to continue.`);
      return;
    }

    if (!selectedCountry) {
      setError("Choose the country your institution operates in.");
      return;
    }

    if (!resolvedCurriculum.trim()) {
      setError("Choose or enter a curriculum for this workspace.");
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
          curriculumName: resolvedCurriculum.trim(),
          institutionType: mapInstitutionTypeForApi(institutionType),
          organizationName: schoolName.trim(),
          branchName: "Main Campus",
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
      title={`What should we call your ${prettyInstitutionLabel(institutionType).toLowerCase()}?`}
      subtitle="Set the name, location, and starting curriculum. We’ll shape the first workspace around it."
      backHref="/onboarding"
      align="top"
      footer={
        <div className="flex flex-wrap items-center justify-between gap-4">
          <button
            type="button"
            onClick={() => router.push("/onboarding")}
            className="text-sm text-white/55 transition hover:text-white"
          >
            Back
          </button>

          <button
            type="submit"
            form="create-school-form"
            disabled={!canSubmit || isBusy}
            className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-medium text-black transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isBusy ? "Creating workspace..." : "Create workspace"}
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      }
    >
      <form id="create-school-form" className="space-y-6" onSubmit={handleSubmit}>
        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-6">
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
                  placeholder="Search for your country"
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
                              setUseSuggestedCurriculum(true);
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
                                {country.curriculum}
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

              <p className="mt-3 text-sm text-white/48">
                Skuully uses this to suggest your starting academic structure.
              </p>
            </div>

            <div className="skuully-glass-card rounded-[24px] p-5">
              <div className="flex items-start gap-3">
                <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04]">
                  <Sparkles className="h-4 w-4 text-[#b7c8ff]" />
                </div>

                <div className="min-w-0">
                  <h3 className="text-lg font-medium text-white">
                    Curriculum suggestion
                  </h3>
                  <p className="mt-1 text-sm leading-7 text-white/55">
                    Start with a country-based suggestion or use your own curriculum name.
                  </p>
                </div>
              </div>

              <div className="mt-5 grid gap-3">
                <button
                  type="button"
                  onClick={() => setUseSuggestedCurriculum(true)}
                  className={`rounded-[20px] border px-4 py-4 text-left transition ${
                    useSuggestedCurriculum
                      ? "border-[rgba(58,109,255,0.28)] bg-[rgba(58,109,255,0.10)]"
                      : "border-white/10 bg-white/[0.03] hover:bg-white/[0.05]"
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="text-sm font-medium text-white">
                        Use suggested curriculum
                      </div>
                      <div className="mt-1 text-sm text-white/52">
                        {selectedCountry?.curriculum ?? "Choose a country first"}
                      </div>
                    </div>

                    {useSuggestedCurriculum ? (
                      <Check className="h-4 w-4 text-[#9bb4ff]" />
                    ) : null}
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setUseSuggestedCurriculum(false)}
                  className={`rounded-[20px] border px-4 py-4 text-left transition ${
                    !useSuggestedCurriculum
                      ? "border-[rgba(58,109,255,0.28)] bg-[rgba(58,109,255,0.10)]"
                      : "border-white/10 bg-white/[0.03] hover:bg-white/[0.05]"
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="text-sm font-medium text-white">
                        Start with a custom curriculum
                      </div>
                      <div className="mt-1 text-sm text-white/52">
                        Use your own starting structure instead
                      </div>
                    </div>

                    {!useSuggestedCurriculum ? (
                      <Check className="h-4 w-4 text-[#9bb4ff]" />
                    ) : null}
                  </div>
                </button>

                {!useSuggestedCurriculum ? (
                  <input
                    className="skuully-focus-ring w-full rounded-[20px] border border-white/10 bg-white/[0.03] px-4 py-4 text-white outline-none placeholder:text-white/25"
                    value={customCurriculum}
                    onChange={(event) => setCustomCurriculum(event.target.value)}
                    placeholder="Enter your curriculum name"
                  />
                ) : null}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <MiniInfo label="Founder" value={me?.fullName ?? "Ready"} />
            <MiniInfo
              label="Institution type"
              value={prettyInstitutionLabel(institutionType)}
            />
            <MiniInfo
              label="Suggested curriculum"
              value={selectedCountry?.curriculum ?? "Pending"}
            />

            <div className="skuully-glass-card rounded-[24px] p-5">
              <div className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04]">
                <Building2 className="h-4 w-4 text-white/72" />
              </div>

              <h3 className="mt-4 text-lg font-medium text-white">
                Your first Skuully workspace
              </h3>

              <div className="mt-4 space-y-3 text-sm text-white/55">
                <p>
                  <span className="text-white">Type:</span>{" "}
                  {prettyInstitutionLabel(institutionType)}
                </p>
                <p>
                  <span className="text-white">Name:</span>{" "}
                  {schoolName.trim() || "Not entered yet"}
                </p>
                <p>
                  <span className="text-white">Country:</span>{" "}
                  {selectedCountry?.name ?? "Not selected yet"}
                </p>
                <p>
                  <span className="text-white">Curriculum:</span>{" "}
                  {resolvedCurriculum || "Not selected yet"}
                </p>
              </div>

              <div className="mt-5 rounded-[20px] border border-white/10 bg-white/[0.03] p-4 text-sm leading-7 text-white/52">
                We’ll prepare your main workspace and starter academic structure around this setup.
              </div>
            </div>

            <div className="skuully-glass-card rounded-[24px] p-5">
              <div className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04]">
                <Globe2 className="h-4 w-4 text-white/72" />
              </div>

              <h3 className="mt-4 text-lg font-medium text-white">
                Country note
              </h3>

              <p className="mt-2 text-sm leading-7 text-white/55">
                {selectedCountry?.note ??
                  "Choose a country to see how Skuully will guide your starting structure."}
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