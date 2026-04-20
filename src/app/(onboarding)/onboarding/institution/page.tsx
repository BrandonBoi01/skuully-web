"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { OnboardingLayout } from "@/components/onboarding/onboarding-layout";
import {
  createInstitutionOnboarding,
  getCountries,
  getCountryCities,
  getCountrySubdivisions,
  getCountryTimezones,
  getOnboardingStatus,
} from "@/lib/onboarding";
import type {
  CountryItem,
  GeoCityItem,
  GeoSubdivisionItem,
  GeoTimezoneItem,
  GenderAdmissionPolicy,
  InstitutionType,
  LearningMode,
} from "@/lib/onboarding-types";

type InstitutionStep = 1 | 2 | 3 | 4;

const INSTITUTION_TYPES: Array<{ value: InstitutionType; label: string }> = [
  { value: "SCHOOL", label: "School" },
  { value: "COLLEGE", label: "College" },
  { value: "UNIVERSITY", label: "University" },
  { value: "POLYTECHNIC", label: "Polytechnic" },
  { value: "VOCATIONAL", label: "Vocational" },
  { value: "TRAINING_CENTER", label: "Training Center" },
  { value: "ACADEMY", label: "Academy" },
];

const LEARNING_MODES: Array<{ value: LearningMode; label: string }> = [
  { value: "DAY", label: "Day" },
  { value: "BOARDING", label: "Boarding" },
  { value: "IN_PERSON", label: "In person" },
  { value: "ONLINE", label: "Online" },
  { value: "HYBRID", label: "Hybrid" },
];

const ADMISSION_POLICIES: Array<{
  value: GenderAdmissionPolicy;
  label: string;
}> = [
  { value: "MIXED", label: "Mixed" },
  { value: "BOYS_ONLY", label: "Boys only" },
  { value: "GIRLS_ONLY", label: "Girls only" },
];

export default function InstitutionOnboardingPage() {
  const router = useRouter();

  const [step, setStep] = useState<InstitutionStep>(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isBusy, setIsBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [countries, setCountries] = useState<CountryItem[]>([]);
  const [subdivisions, setSubdivisions] = useState<GeoSubdivisionItem[]>([]);
  const [cities, setCities] = useState<GeoCityItem[]>([]);
  const [timezones, setTimezones] = useState<GeoTimezoneItem[]>([]);

  const [name, setName] = useState("");
  const [institutionType, setInstitutionType] = useState<InstitutionType>("SCHOOL");
  const [countryCode, setCountryCode] = useState("");
  const [subdivisionId, setSubdivisionId] = useState("");
  const [cityId, setCityId] = useState("");

  const [legalName, setLegalName] = useState("");
  const [email, setEmail] = useState("");
  const [primaryPhone, setPrimaryPhone] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [timezone, setTimezone] = useState("");
  const [addressLine1, setAddressLine1] = useState("");
  const [addressLine2, setAddressLine2] = useState("");

  const [ownership, setOwnership] = useState("");
  const [levelType, setLevelType] = useState("");
  const [genderAdmissionPolicy, setGenderAdmissionPolicy] =
    useState<GenderAdmissionPolicy | "">("");
  const [learningModes, setLearningModes] = useState<LearningMode[]>([]);

  useEffect(() => {
    async function load() {
      try {
        const [status, countriesResponse] = await Promise.all([
          getOnboardingStatus(),
          getCountries(),
        ]);

        if (
          status.onboarding?.route &&
          status.onboarding.route !== "BUILD_INSTITUTION"
        ) {
          router.replace("/onboarding");
          return;
        }

        setCountries(countriesResponse.items ?? []);
        setName(status.onboarding?.institutionNameDraft ?? "");
        setCountryCode(status.onboarding?.residenceCountryCodeDraft ?? "");
        setOwnership(status.onboarding?.ownershipDraft ?? "");
        setLevelType(status.onboarding?.levelTypeDraft ?? "");
        setLearningModes((status.onboarding?.learningModesDraft ?? []) as LearningMode[]);
        setGenderAdmissionPolicy(
          (status.onboarding?.genderAdmissionPolicyDraft as GenderAdmissionPolicy | null) ?? ""
        );
        setInstitutionType(
          (status.onboarding?.institutionTypeDraft as InstitutionType | null) ?? "SCHOOL"
        );
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Could not load onboarding."
        );
      } finally {
        setIsLoading(false);
      }
    }

    void load();
  }, [router]);

  useEffect(() => {
    async function loadGeoChildren() {
      if (!countryCode) {
        setSubdivisions([]);
        setCities([]);
        setTimezones([]);
        return;
      }

      try {
        const [subdivisionRes, timezoneRes] = await Promise.all([
          getCountrySubdivisions(countryCode),
          getCountryTimezones(countryCode),
        ]);

        setSubdivisions(subdivisionRes.items ?? []);
        setTimezones(timezoneRes.items ?? []);
      } catch {
        setSubdivisions([]);
        setTimezones([]);
      }
    }

    void loadGeoChildren();
  }, [countryCode]);

  useEffect(() => {
    async function loadCities() {
      if (!countryCode) {
        setCities([]);
        return;
      }

      const selectedSubdivision = subdivisions.find((item) => item.id === subdivisionId);

      try {
        const cityRes = await getCountryCities(countryCode, {
          subdivisionCode: selectedSubdivision?.code,
        });

        setCities(cityRes.items ?? []);
      } catch {
        setCities([]);
      }
    }

    void loadCities();
  }, [countryCode, subdivisionId, subdivisions]);

  const selectedCountry = useMemo(
    () => countries.find((item) => item.code === countryCode) ?? null,
    [countries, countryCode]
  );

  const selectedSubdivision = useMemo(
    () => subdivisions.find((item) => item.id === subdivisionId) ?? null,
    [subdivisions, subdivisionId]
  );

  const selectedCity = useMemo(
    () => cities.find((item) => item.id === cityId) ?? null,
    [cities, cityId]
  );

  const stepReady =
    step === 1
      ? name.trim().length >= 2 && !!institutionType && !!countryCode
      : step === 2
      ? true
      : step === 3
      ? learningModes.length > 0
      : true;

  function toggleLearningMode(mode: LearningMode) {
    setLearningModes((prev) =>
      prev.includes(mode)
        ? prev.filter((item) => item !== mode)
        : [...prev, mode]
    );
  }

  function goBack() {
    setError(null);

    if (step === 1) {
      router.push("/onboarding");
      return;
    }

    setStep((prev) => (prev - 1) as InstitutionStep);
  }

  async function goNext() {
    setError(null);

    if (step < 4) {
      setStep((prev) => (prev + 1) as InstitutionStep);
      return;
    }

    setIsBusy(true);

    try {
      await createInstitutionOnboarding({
        name: name.trim(),
        institutionType,
        legalName: legalName.trim() || undefined,
        email: email.trim().toLowerCase() || undefined,
        primaryPhone: primaryPhone.trim() || undefined,
        websiteUrl: websiteUrl.trim() || undefined,
        countryCode: countryCode || undefined,
        subdivisionId: subdivisionId || undefined,
        cityId: cityId || undefined,
        addressLine1: addressLine1.trim() || undefined,
        addressLine2: addressLine2.trim() || undefined,
        timezone: timezone || undefined,
        ownership: ownership.trim() || undefined,
        levelType: levelType.trim() || undefined,
        genderAdmissionPolicy: genderAdmissionPolicy || undefined,
        learningModes,
      });

      router.push("/dashboard/control-center");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not create institution."
      );
    } finally {
      setIsBusy(false);
    }
  }

  if (isLoading) {
    return (
      <OnboardingLayout title="Preparing your onboarding">
        <div className="text-sm text-[var(--text-soft)]">Loading...</div>
      </OnboardingLayout>
    );
  }

  return (
    <OnboardingLayout
      title="Create your institution"
      subtitle="Set up the institution clearly and get your workspace ready."
      step={step}
      totalSteps={4}
      backHref="/onboarding"
      footer={
        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={goBack}
            className="h-11 rounded-2xl border border-[var(--border)] px-4 text-sm font-medium text-[var(--text-main)] transition hover:bg-[var(--surface-2)]"
          >
            Back
          </button>

          <button
            type="button"
            onClick={goNext}
            disabled={!stepReady || isBusy}
            className="h-11 rounded-2xl bg-[var(--primary)] px-5 text-sm font-semibold text-[var(--primary-foreground)] transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isBusy ? "Creating..." : step === 4 ? "Create institution" : "Continue"}
          </button>
        </div>
      }
    >
      <div className="space-y-6">
        {step === 1 ? (
          <div className="grid gap-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-[var(--text-main)]">
                Institution name
              </label>
              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Enter institution name"
                className="h-12 w-full rounded-2xl border border-[var(--border)] bg-[var(--input)] px-4 text-sm text-[var(--foreground)] outline-none transition focus:border-[var(--primary)] focus:ring-4 focus:ring-[var(--ring)]"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-[var(--text-main)]">
                Institution type
              </label>
              <select
                value={institutionType}
                onChange={(event) =>
                  setInstitutionType(event.target.value as InstitutionType)
                }
                className="h-12 w-full rounded-2xl border border-[var(--border)] bg-[var(--input)] px-4 text-sm text-[var(--foreground)] outline-none transition focus:border-[var(--primary)] focus:ring-4 focus:ring-[var(--ring)]"
              >
                {INSTITUTION_TYPES.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-[var(--text-main)]">
                Country
              </label>
              <select
                value={countryCode}
                onChange={(event) => {
                  setCountryCode(event.target.value);
                  setSubdivisionId("");
                  setCityId("");
                  setTimezone("");
                }}
                className="h-12 w-full rounded-2xl border border-[var(--border)] bg-[var(--input)] px-4 text-sm text-[var(--foreground)] outline-none transition focus:border-[var(--primary)] focus:ring-4 focus:ring-[var(--ring)]"
              >
                <option value="">Select country</option>
                {countries.map((country) => (
                  <option key={country.code} value={country.code}>
                    {country.flagEmoji ? `${country.flagEmoji} ` : ""}
                    {country.name}
                  </option>
                ))}
              </select>
            </div>

            {subdivisions.length > 0 ? (
              <div>
                <label className="mb-2 block text-sm font-medium text-[var(--text-main)]">
                  Subdivision
                </label>
                <select
                  value={subdivisionId}
                  onChange={(event) => {
                    setSubdivisionId(event.target.value);
                    setCityId("");
                  }}
                  className="h-12 w-full rounded-2xl border border-[var(--border)] bg-[var(--input)] px-4 text-sm text-[var(--foreground)] outline-none transition focus:border-[var(--primary)] focus:ring-4 focus:ring-[var(--ring)]"
                >
                  <option value="">Select subdivision</option>
                  {subdivisions.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                </select>
              </div>
            ) : null}

            {cities.length > 0 ? (
              <div>
                <label className="mb-2 block text-sm font-medium text-[var(--text-main)]">
                  City
                </label>
                <select
                  value={cityId}
                  onChange={(event) => setCityId(event.target.value)}
                  className="h-12 w-full rounded-2xl border border-[var(--border)] bg-[var(--input)] px-4 text-sm text-[var(--foreground)] outline-none transition focus:border-[var(--primary)] focus:ring-4 focus:ring-[var(--ring)]"
                >
                  <option value="">Select city</option>
                  {cities.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                </select>
              </div>
            ) : null}
          </div>
        ) : null}

        {step === 2 ? (
          <div className="grid gap-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-[var(--text-main)]">
                Legal name
              </label>
              <input
                value={legalName}
                onChange={(event) => setLegalName(event.target.value)}
                placeholder="Optional legal name"
                className="h-12 w-full rounded-2xl border border-[var(--border)] bg-[var(--input)] px-4 text-sm text-[var(--foreground)] outline-none transition focus:border-[var(--primary)] focus:ring-4 focus:ring-[var(--ring)]"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-[var(--text-main)]">
                  Email
                </label>
                <input
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  type="email"
                  placeholder="institution@example.com"
                  className="h-12 w-full rounded-2xl border border-[var(--border)] bg-[var(--input)] px-4 text-sm text-[var(--foreground)] outline-none transition focus:border-[var(--primary)] focus:ring-4 focus:ring-[var(--ring)]"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-[var(--text-main)]">
                  Primary phone
                </label>
                <input
                  value={primaryPhone}
                  onChange={(event) => setPrimaryPhone(event.target.value)}
                  placeholder="+254..."
                  className="h-12 w-full rounded-2xl border border-[var(--border)] bg-[var(--input)] px-4 text-sm text-[var(--foreground)] outline-none transition focus:border-[var(--primary)] focus:ring-4 focus:ring-[var(--ring)]"
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-[var(--text-main)]">
                Website
              </label>
              <input
                value={websiteUrl}
                onChange={(event) => setWebsiteUrl(event.target.value)}
                placeholder="https://example.org"
                className="h-12 w-full rounded-2xl border border-[var(--border)] bg-[var(--input)] px-4 text-sm text-[var(--foreground)] outline-none transition focus:border-[var(--primary)] focus:ring-4 focus:ring-[var(--ring)]"
              />
            </div>

            {timezones.length > 0 ? (
              <div>
                <label className="mb-2 block text-sm font-medium text-[var(--text-main)]">
                  Timezone
                </label>
                <select
                  value={timezone}
                  onChange={(event) => setTimezone(event.target.value)}
                  className="h-12 w-full rounded-2xl border border-[var(--border)] bg-[var(--input)] px-4 text-sm text-[var(--foreground)] outline-none transition focus:border-[var(--primary)] focus:ring-4 focus:ring-[var(--ring)]"
                >
                  <option value="">Select timezone</option>
                  {timezones.map((item) => (
                    <option key={item.id} value={item.name}>
                      {item.name}
                    </option>
                  ))}
                </select>
              </div>
            ) : null}

            <div>
              <label className="mb-2 block text-sm font-medium text-[var(--text-main)]">
                Address line 1
              </label>
              <input
                value={addressLine1}
                onChange={(event) => setAddressLine1(event.target.value)}
                placeholder="Street address"
                className="h-12 w-full rounded-2xl border border-[var(--border)] bg-[var(--input)] px-4 text-sm text-[var(--foreground)] outline-none transition focus:border-[var(--primary)] focus:ring-4 focus:ring-[var(--ring)]"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-[var(--text-main)]">
                Address line 2
              </label>
              <input
                value={addressLine2}
                onChange={(event) => setAddressLine2(event.target.value)}
                placeholder="Optional"
                className="h-12 w-full rounded-2xl border border-[var(--border)] bg-[var(--input)] px-4 text-sm text-[var(--foreground)] outline-none transition focus:border-[var(--primary)] focus:ring-4 focus:ring-[var(--ring)]"
              />
            </div>
          </div>
        ) : null}

        {step === 3 ? (
          <div className="grid gap-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-[var(--text-main)]">
                Ownership
              </label>
              <input
                value={ownership}
                onChange={(event) => setOwnership(event.target.value)}
                placeholder="Public, private, faith-based..."
                className="h-12 w-full rounded-2xl border border-[var(--border)] bg-[var(--input)] px-4 text-sm text-[var(--foreground)] outline-none transition focus:border-[var(--primary)] focus:ring-4 focus:ring-[var(--ring)]"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-[var(--text-main)]">
                Level type
              </label>
              <input
                value={levelType}
                onChange={(event) => setLevelType(event.target.value)}
                placeholder="Primary, secondary, tertiary..."
                className="h-12 w-full rounded-2xl border border-[var(--border)] bg-[var(--input)] px-4 text-sm text-[var(--foreground)] outline-none transition focus:border-[var(--primary)] focus:ring-4 focus:ring-[var(--ring)]"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-[var(--text-main)]">
                Admissions policy
              </label>
              <select
                value={genderAdmissionPolicy}
                onChange={(event) =>
                  setGenderAdmissionPolicy(
                    event.target.value as GenderAdmissionPolicy | ""
                  )
                }
                className="h-12 w-full rounded-2xl border border-[var(--border)] bg-[var(--input)] px-4 text-sm text-[var(--foreground)] outline-none transition focus:border-[var(--primary)] focus:ring-4 focus:ring-[var(--ring)]"
              >
                <option value="">Select policy</option>
                {ADMISSION_POLICIES.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <div className="mb-2 text-sm font-medium text-[var(--text-main)]">
                Learning modes
              </div>

              <div className="flex flex-wrap gap-2">
                {LEARNING_MODES.map((item) => {
                  const selected = learningModes.includes(item.value);

                  return (
                    <button
                      key={item.value}
                      type="button"
                      onClick={() => toggleLearningMode(item.value)}
                      className={[
                        "rounded-full border px-4 py-2 text-sm transition",
                        selected
                          ? "border-[var(--primary)] bg-[var(--secondary)] text-[var(--text-main)]"
                          : "border-[var(--border)] text-[var(--text-soft)] hover:bg-[var(--surface-2)]",
                      ].join(" ")}
                    >
                      {item.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        ) : null}

        {step === 4 ? (
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-2)] p-4">
            <div className="text-base font-semibold text-[var(--text-strong)]">
              Review
            </div>

            <div className="mt-4 space-y-3 text-sm">
              <ReviewRow label="Institution name" value={name} />
              <ReviewRow
                label="Institution type"
                value={
                  INSTITUTION_TYPES.find((item) => item.value === institutionType)?.label ??
                  institutionType
                }
              />
              <ReviewRow label="Country" value={selectedCountry?.name ?? "—"} />
              <ReviewRow label="Subdivision" value={selectedSubdivision?.name ?? "—"} />
              <ReviewRow label="City" value={selectedCity?.name ?? "—"} />
              <ReviewRow label="Legal name" value={legalName || "—"} />
              <ReviewRow label="Email" value={email || "—"} />
              <ReviewRow label="Phone" value={primaryPhone || "—"} />
              <ReviewRow label="Website" value={websiteUrl || "—"} />
              <ReviewRow label="Timezone" value={timezone || "—"} />
              <ReviewRow label="Ownership" value={ownership || "—"} />
              <ReviewRow label="Level type" value={levelType || "—"} />
              <ReviewRow
                label="Admissions policy"
                value={
                  ADMISSION_POLICIES.find(
                    (item) => item.value === genderAdmissionPolicy
                  )?.label ?? "—"
                }
              />
              <ReviewRow
                label="Learning modes"
                value={
                  learningModes.length
                    ? learningModes
                        .map(
                          (mode) =>
                            LEARNING_MODES.find((item) => item.value === mode)?.label ?? mode
                        )
                        .join(", ")
                    : "—"
                }
              />
            </div>
          </div>
        ) : null}

        {error ? (
          <div className="rounded-2xl border border-[rgba(198,38,74,0.25)] bg-[rgba(198,38,74,0.10)] px-4 py-3 text-sm text-[var(--text-main)]">
            {error}
          </div>
        ) : null}
      </div>
    </OnboardingLayout>
  );
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <span className="text-[var(--text-soft)]">{label}</span>
      <span className="max-w-[60%] text-right text-[var(--text-main)]">
        {value}
      </span>
    </div>
  );
}