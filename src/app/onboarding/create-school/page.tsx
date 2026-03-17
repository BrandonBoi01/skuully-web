"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  Building2,
  Check,
  ChevronDown,
  Globe2,
  GraduationCap,
  Search,
  Sparkles,
} from "lucide-react";
import { apiFetch } from "@/lib/api";
import { getMe } from "@/lib/auth";

type MeResponse = {
  id: string;
  fullName: string;
  email: string;
  skuullyId?: string | null;
  emailVerified?: boolean;
};

type CountryOption = {
  code: string;
  name: string;
  curriculum: string;
  note: string;
};

type InstitutionType =
  | "SCHOOL"
  | "COLLEGE"
  | "UNIVERSITY"
  | "POLYTECHNIC"
  | "VOCATIONAL"
  | "TRAINING_CENTER"
  | "ACADEMY"
  | "OTHER";

type CreateSchoolResponse = {
  message: string;
  school?: {
    id: string;
    name: string;
    country: string;
  };
  active?: {
    school?: {
      id: string;
      name: string;
    };
    role?: string;
  };
  program?: {
    id: string;
    name: string;
  };
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

function MiniInfo({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
      <div className="text-xs uppercase tracking-[0.16em] text-white/35">
        {label}
      </div>
      <div className="mt-2 text-base font-medium text-white">{value}</div>
    </div>
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <label className="mb-2 block text-sm font-medium text-white/70">
      {children}
    </label>
  );
}

function prettyInstitutionLabel(type: InstitutionType) {
  const labels: Record<InstitutionType, string> = {
    SCHOOL: "School",
    COLLEGE: "College",
    UNIVERSITY: "University",
    POLYTECHNIC: "Polytechnic",
    VOCATIONAL: "Vocational / TVET",
    TRAINING_CENTER: "Training Center",
    ACADEMY: "Academy",
    OTHER: "Institution",
  };

  return labels[type];
}

function heroTitle(type: InstitutionType) {
  const map: Record<InstitutionType, string> = {
    SCHOOL: "Give your school a calm, powerful beginning.",
    COLLEGE: "Give your college a strong academic foundation.",
    UNIVERSITY: "Give your university a future-ready starting point.",
    POLYTECHNIC: "Give your polytechnic a practical, powerful foundation.",
    VOCATIONAL: "Give your training institution a smart beginning.",
    TRAINING_CENTER: "Give your training center a focused new home.",
    ACADEMY: "Give your academy a refined place to grow.",
    OTHER: "Give your institution a calm, powerful beginning.",
  };

  return map[type];
}

function heroDescription(type: InstitutionType) {
  const map: Record<InstitutionType, string> = {
    SCHOOL:
      "Tell Skuully where your school belongs and we’ll shape a strong academic starting point around it. You can refine everything later.",
    COLLEGE:
      "Set up your college workspace with the right country and academic starting structure, then build steadily from there.",
    UNIVERSITY:
      "Start your university workspace with clarity. Skuully helps you begin cleanly, then scale into deeper academic structure.",
    POLYTECHNIC:
      "Build a practical academic workspace that can grow into departments, programs, and hands-on learning structure over time.",
    VOCATIONAL:
      "Start with a strong operational base, then expand into programs, cohorts, modules, and training pathways as you grow.",
    TRAINING_CENTER:
      "Begin with a focused training workspace, then evolve it into the structure your institution needs.",
    ACADEMY:
      "Create a polished academic home for your academy and shape it to fit your learning model.",
    OTHER:
      "Tell Skuully where your institution belongs and we’ll help shape a clean academic starting point around it.",
  };

  return map[type];
}

export default function CreateSchoolPage() {
  const router = useRouter();
  const pickerRef = useRef<HTMLDivElement | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [me, setMe] = useState<MeResponse | null>(null);

  const [institutionType, setInstitutionType] =
    useState<InstitutionType>("SCHOOL");
  const [schoolName, setSchoolName] = useState("");
  const [countrySearch, setCountrySearch] = useState("");
  const [selectedCountry, setSelectedCountry] = useState<CountryOption | null>(
    null
  );
  const [pickerOpen, setPickerOpen] = useState(false);
  const [useSuggestedCurriculum, setUseSuggestedCurriculum] = useState(true);
  const [customCurriculum, setCustomCurriculum] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isBusy, setIsBusy] = useState(false);

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

        setMe(meResponse);

        const kenya = COUNTRIES.find((item) => item.code === "KE") ?? null;
        setSelectedCountry(kenya);
        setCountrySearch(kenya?.name ?? "");
      } catch {
        router.replace("/login");
        return;
      } finally {
        setIsLoading(false);
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
    resolvedCurriculum.trim().length >= 2;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!schoolName.trim()) {
      setError(
        `Give your ${prettyInstitutionLabel(
          institutionType
        ).toLowerCase()} a name to continue.`
      );
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
      await apiFetch<CreateSchoolResponse>("/schools", {
        method: "POST",
        body: JSON.stringify({
          name: schoolName.trim(),
          country: selectedCountry.name,
          curriculumName: resolvedCurriculum.trim(),
          institutionType,
          organizationName: schoolName.trim(),
          branchName: "Main Campus",
        }),
      });

      router.push("/dashboard/control-center");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "We couldn’t create your Skuully workspace yet."
      );
    } finally {
      setIsBusy(false);
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#060816] text-white">
        <div className="relative isolate min-h-screen overflow-hidden">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(54,97,225,0.18),transparent_30%),radial-gradient(circle_at_82%_18%,rgba(165,94,149,0.10),transparent_28%),linear-gradient(180deg,#050816_0%,#070b1d_48%,#050816_100%)]" />
          <div className="relative flex min-h-screen items-center justify-center px-4">
            <div className="rounded-3xl border border-white/10 bg-white/[0.05] px-6 py-5 text-sm text-white/70 backdrop-blur-xl">
              Preparing your institution setup...
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#060816] text-white">
      <div className="relative isolate min-h-screen overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(54,97,225,0.18),transparent_30%),radial-gradient(circle_at_82%_18%,rgba(165,94,149,0.10),transparent_28%),linear-gradient(180deg,#050816_0%,#070b1d_48%,#050816_100%)]" />

        <div className="relative mx-auto max-w-7xl px-4 py-10 lg:px-8">
          <section className="rounded-[32px] border border-white/10 bg-white/[0.05] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.28)] backdrop-blur-2xl sm:p-8">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-3xl">
                <Link
                  href="/onboarding"
                  className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs text-white/60 transition hover:bg-white/[0.06] hover:text-white"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  Back to choices
                </Link>

                <div className="mt-5 inline-flex items-center gap-2 rounded-full border border-[rgba(54,97,225,0.22)] bg-[rgba(54,97,225,0.08)] px-3 py-1 text-xs text-[rgba(180,198,255,0.92)]">
                  <Building2 className="h-3.5 w-3.5" />
                  Build on Skuully
                </div>

                <h1 className="mt-5 text-4xl font-semibold tracking-tight text-white sm:text-5xl">
                  {heroTitle(institutionType)}
                </h1>

                <p className="mt-4 max-w-2xl text-sm leading-7 text-white/58 sm:text-base">
                  {heroDescription(institutionType)}
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <MiniInfo label="Founder" value={me?.fullName ?? "Ready"} />
                <MiniInfo
                  label="Institution type"
                  value={prettyInstitutionLabel(institutionType)}
                />
                <MiniInfo
                  label="Suggested curriculum"
                  value={selectedCountry?.curriculum ?? "Pending"}
                />
              </div>
            </div>
          </section>

          <div className="mt-8 grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
            <section className="rounded-[32px] border border-white/10 bg-white/[0.04] p-6 backdrop-blur-xl sm:p-8">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs uppercase tracking-[0.16em] text-white/45">
                Institution setup
              </div>

              <form className="mt-6 space-y-6" onSubmit={handleSubmit}>
                <div>
                  <FieldLabel>Institution type</FieldLabel>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {(
                      [
                        "SCHOOL",
                        "COLLEGE",
                        "UNIVERSITY",
                        "POLYTECHNIC",
                        "VOCATIONAL",
                        "TRAINING_CENTER",
                        "ACADEMY",
                        "OTHER",
                      ] as InstitutionType[]
                    ).map((type) => {
                      const selected = institutionType === type;

                      return (
                        <button
                          key={type}
                          type="button"
                          onClick={() => setInstitutionType(type)}
                          className={`rounded-2xl border px-4 py-4 text-left transition ${
                            selected
                              ? "border-[rgba(54,97,225,0.28)] bg-[rgba(54,97,225,0.10)]"
                              : "border-white/10 bg-white/[0.03] hover:bg-white/[0.05]"
                          }`}
                        >
                          <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-3">
                              <GraduationCap className="h-4 w-4 text-[#9bb4ff]" />
                              <span className="text-sm font-medium text-white">
                                {prettyInstitutionLabel(type)}
                              </span>
                            </div>
                            {selected ? (
                              <Check className="h-4 w-4 text-[#9bb4ff]" />
                            ) : null}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <FieldLabel>{prettyInstitutionLabel(institutionType)} name</FieldLabel>
                  <input
                    className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3.5 text-white outline-none transition placeholder:text-white/25 focus:border-[rgba(54,97,225,0.45)] focus:bg-white/[0.05]"
                    value={schoolName}
                    onChange={(event) => setSchoolName(event.target.value)}
                    placeholder={`Enter the name your ${prettyInstitutionLabel(
                      institutionType
                    ).toLowerCase()} will be known by on Skuully`}
                    required
                  />
                </div>

                <div ref={pickerRef}>
                  <FieldLabel>Country</FieldLabel>

                  <div className="relative">
                    <div className="relative">
                      <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/35" />
                      <input
                        className="w-full rounded-2xl border border-white/10 bg-white/[0.04] py-3.5 pl-11 pr-12 text-white outline-none transition placeholder:text-white/25 focus:border-[rgba(54,97,225,0.45)] focus:bg-white/[0.05]"
                        value={countrySearch}
                        onChange={(event) => {
                          setCountrySearch(event.target.value);
                          setPickerOpen(true);
                        }}
                        onFocus={() => setPickerOpen(true)}
                        placeholder="Search for your country"
                      />
                      <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/35" />
                    </div>

                    {pickerOpen ? (
                      <div className="absolute z-30 mt-2 max-h-72 w-full overflow-y-auto rounded-2xl border border-white/10 bg-[#0a1022] p-2 shadow-[0_20px_60px_rgba(0,0,0,0.45)]">
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
                                  setUseSuggestedCurriculum(true);
                                }}
                                className={`flex w-full items-start justify-between rounded-2xl px-4 py-3 text-left transition ${
                                  selected
                                    ? "bg-[rgba(54,97,225,0.14)]"
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

                  <p className="mt-2 text-xs text-white/40">
                    We use country to suggest a strong academic starting point for your workspace.
                  </p>
                </div>

                <div className="rounded-[28px] border border-white/10 bg-white/[0.03] p-5">
                  <div className="flex items-start gap-3">
                    <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-[rgba(54,97,225,0.22)] bg-[rgba(54,97,225,0.10)]">
                      <Sparkles className="h-4 w-4 text-[#b7c8ff]" />
                    </div>

                    <div className="min-w-0">
                      <h3 className="text-lg font-semibold text-white">
                        Curriculum suggestion
                      </h3>
                      <p className="mt-1 text-sm leading-6 text-white/55">
                        Skuully suggests a starting curriculum from your selected country.
                        You can support more than one curriculum later.
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 grid gap-3">
                    <button
                      type="button"
                      onClick={() => setUseSuggestedCurriculum(true)}
                      className={`rounded-2xl border px-4 py-4 text-left transition ${
                        useSuggestedCurriculum
                          ? "border-[rgba(54,97,225,0.28)] bg-[rgba(54,97,225,0.10)]"
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
                      className={`rounded-2xl border px-4 py-4 text-left transition ${
                        !useSuggestedCurriculum
                          ? "border-[rgba(54,97,225,0.28)] bg-[rgba(54,97,225,0.10)]"
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
                      <div>
                        <input
                          className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3.5 text-white outline-none transition placeholder:text-white/25 focus:border-[rgba(54,97,225,0.45)] focus:bg-white/[0.05]"
                          value={customCurriculum}
                          onChange={(event) =>
                            setCustomCurriculum(event.target.value)
                          }
                          placeholder="Enter your curriculum name"
                        />
                      </div>
                    ) : null}
                  </div>
                </div>

                {error ? (
                  <div className="rounded-2xl border border-rose-400/20 bg-rose-400/10 px-4 py-3 text-sm leading-6 text-rose-100">
                    {error}
                  </div>
                ) : null}

                <button
                  type="submit"
                  disabled={isBusy || !canSubmit}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[linear-gradient(135deg,rgba(54,97,225,1),rgba(88,66,171,0.96))] px-4 py-3.5 text-sm font-medium text-white transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <span>
                    {isBusy
                      ? "Opening your Skuully workspace..."
                      : `Create ${prettyInstitutionLabel(
                          institutionType
                        ).toLowerCase()} workspace`}
                  </span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              </form>
            </section>

            <section className="space-y-6">
              <div className="rounded-[32px] border border-white/10 bg-white/[0.04] p-6 backdrop-blur-xl sm:p-8">
                <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs uppercase tracking-[0.16em] text-white/45">
                  What happens next
                </div>

                <div className="mt-5 space-y-4">
                  <div className="flex gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                    <BadgeCheck className="mt-0.5 h-4 w-4 shrink-0 text-[#9bb4ff]" />
                    <p className="text-sm leading-6 text-white/60">
                      Your workspace is created around the institution type,
                      country, and curriculum you choose.
                    </p>
                  </div>

                  <div className="flex gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                    <BadgeCheck className="mt-0.5 h-4 w-4 shrink-0 text-[#9bb4ff]" />
                    <p className="text-sm leading-6 text-white/60">
                      Skuully creates an organization, a main campus, your
                      institution workspace, and a starter academic program.
                    </p>
                  </div>

                  <div className="flex gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                    <BadgeCheck className="mt-0.5 h-4 w-4 shrink-0 text-[#9bb4ff]" />
                    <p className="text-sm leading-6 text-white/60">
                      You can later add more branches, programs, curriculums,
                      and people without rebuilding from scratch.
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-[32px] border border-white/10 bg-white/[0.04] p-6 backdrop-blur-xl sm:p-8">
                <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs uppercase tracking-[0.16em] text-white/45">
                  Current selection
                </div>

                <div className="mt-5 grid gap-4">
                  <MiniInfo
                    label="Institution type"
                    value={prettyInstitutionLabel(institutionType)}
                  />
                  <MiniInfo
                    label="Name"
                    value={schoolName.trim() || "Not entered yet"}
                  />
                  <MiniInfo
                    label="Country"
                    value={selectedCountry?.name ?? "Not selected yet"}
                  />
                  <MiniInfo
                    label="Starting curriculum"
                    value={resolvedCurriculum || "Not selected yet"}
                  />
                  <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
                    <div className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04]">
                      <Globe2 className="h-4 w-4 text-white/72" />
                    </div>
                    <div className="mt-4 text-xs uppercase tracking-[0.16em] text-white/35">
                      Country note
                    </div>
                    <div className="mt-2 text-sm leading-6 text-white/58">
                      {selectedCountry?.note ??
                        "Choose a country to see how Skuully will guide your starting structure."}
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}