"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { OnboardingLayout } from "@/components/onboarding/onboarding-layout";
import { getCountries, getOnboardingStatus, savePersonalProfile } from "@/lib/onboarding";
import type { CountryItem } from "@/lib/onboarding-types";

type PersonalStep = 1 | 2 | 3 | 4;

function formatIntent(intent?: string | null) {
  switch (intent) {
    case "FOUNDER":
      return "Founder";
    case "STAFF":
      return "Staff";
    case "PARENT":
      return "Parent or Guardian";
    case "STUDENT":
      return "Student";
    case "PROFESSIONAL":
      return "Professional";
    case "EXPLORER":
      return "Explorer";
    case "UNSURE":
      return "Not sure yet";
    default:
      return "Personal account";
  }
}

export default function PersonalOnboardingPage() {
  const router = useRouter();

  const [step, setStep] = useState<PersonalStep>(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isBusy, setIsBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [intent, setIntent] = useState<string | null>(null);

  const [headline, setHeadline] = useState("");
  const [nationalityCode, setNationalityCode] = useState("");
  const [residenceCountryCode, setResidenceCountryCode] = useState("");

  const [countrySearch, setCountrySearch] = useState("");
  const [countries, setCountries] = useState<CountryItem[]>([]);

  useEffect(() => {
    async function load() {
      try {
        const [status, countriesResponse] = await Promise.all([
          getOnboardingStatus(),
          getCountries(),
        ]);

        if (status.onboarding?.route && status.onboarding.route !== "PERSONAL_ACCOUNT") {
          router.replace("/onboarding");
          return;
        }

        setIntent(status.onboarding?.accountIntent ?? null);
        setHeadline(status.onboarding?.headlineDraft ?? "");
        setNationalityCode(status.onboarding?.nationalityCodeDraft ?? "");
        setResidenceCountryCode(status.onboarding?.residenceCountryCodeDraft ?? "");
        setCountries(countriesResponse.items ?? []);
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

  const filteredCountries = useMemo(() => {
    const query = countrySearch.trim().toLowerCase();

    if (!query) return countries;

    return countries.filter((country) => {
      return (
        country.name.toLowerCase().includes(query) ||
        country.code.toLowerCase().includes(query) ||
        (country.region ?? "").toLowerCase().includes(query) ||
        (country.subregion ?? "").toLowerCase().includes(query)
      );
    });
  }, [countries, countrySearch]);

  const nationality = countries.find((item) => item.code === nationalityCode) ?? null;
  const residence = countries.find((item) => item.code === residenceCountryCode) ?? null;

  const canContinue =
    step === 1
      ? true
      : step === 2
      ? headline.trim().length >= 2 && headline.trim().length <= 160
      : step === 3
      ? !!nationalityCode
      : !!residenceCountryCode;

  function goBack() {
    setError(null);

    if (step === 1) {
      router.push("/onboarding");
      return;
    }

    setStep((prev) => (prev - 1) as PersonalStep);
  }

  async function goNext() {
    setError(null);

    if (step < 4) {
      setStep((prev) => (prev + 1) as PersonalStep);
      return;
    }

    setIsBusy(true);

    try {
      await savePersonalProfile({
        headline: headline.trim(),
        nationalityCode,
        residenceCountryCode,
      });

      router.push("/feed");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not save your profile."
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
      title="Set up your personal profile"
      subtitle="Build a clean identity first. You can expand it later."
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
            disabled={!canContinue || isBusy}
            className="h-11 rounded-2xl bg-[var(--primary)] px-5 text-sm font-semibold text-[var(--primary-foreground)] transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isBusy ? "Saving..." : step === 4 ? "Complete setup" : "Continue"}
          </button>
        </div>
      }
    >
      <div className="space-y-6">
        {step === 1 ? (
          <div className="space-y-4">
            <div>
              <div className="text-sm font-medium text-[var(--text-soft)]">Selected path</div>
              <div className="mt-2 rounded-2xl border border-[var(--border)] bg-[var(--surface-2)] px-4 py-4">
                <div className="text-base font-semibold text-[var(--text-strong)]">
                  {formatIntent(intent)}
                </div>
                <div className="mt-1 text-sm text-[var(--text-soft)]">
                  This path creates a personal Skuully identity.
                </div>
              </div>
            </div>
          </div>
        ) : null}

        {step === 2 ? (
          <div className="space-y-3">
            <label className="block text-sm font-medium text-[var(--text-main)]">
              Headline
            </label>
            <input
              value={headline}
              onChange={(event) => setHeadline(event.target.value)}
              placeholder="Tell people a little about your direction"
              maxLength={160}
              className="h-12 w-full rounded-2xl border border-[var(--border)] bg-[var(--input)] px-4 text-sm text-[var(--foreground)] outline-none transition focus:border-[var(--primary)] focus:ring-4 focus:ring-[var(--ring)]"
            />
            <div className="text-xs text-[var(--text-soft)]">
              2 to 160 characters.
            </div>
          </div>
        ) : null}

        {step === 3 ? (
          <div className="space-y-4">
            <label className="block text-sm font-medium text-[var(--text-main)]">
              Nationality
            </label>

            <input
              value={countrySearch}
              onChange={(event) => setCountrySearch(event.target.value)}
              placeholder="Search countries"
              className="h-12 w-full rounded-2xl border border-[var(--border)] bg-[var(--input)] px-4 text-sm text-[var(--foreground)] outline-none transition focus:border-[var(--primary)] focus:ring-4 focus:ring-[var(--ring)]"
            />

            <div className="max-h-72 space-y-2 overflow-y-auto rounded-2xl border border-[var(--border)] p-2">
              {filteredCountries.map((country) => {
                const selected = nationalityCode === country.code;

                return (
                  <button
                    key={country.code}
                    type="button"
                    onClick={() => setNationalityCode(country.code)}
                    className={[
                      "w-full rounded-xl px-3 py-3 text-left transition",
                      selected
                        ? "bg-[var(--secondary)]"
                        : "hover:bg-[var(--surface-2)]",
                    ].join(" ")}
                  >
                    <div className="text-sm font-medium text-[var(--text-strong)]">
                      {country.flagEmoji ? `${country.flagEmoji} ` : ""}
                      {country.name}
                    </div>
                    <div className="mt-1 text-xs text-[var(--text-soft)]">
                      {country.code}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ) : null}

        {step === 4 ? (
          <div className="space-y-4">
            <label className="block text-sm font-medium text-[var(--text-main)]">
              Country of residence
            </label>

            <input
              value={countrySearch}
              onChange={(event) => setCountrySearch(event.target.value)}
              placeholder="Search countries"
              className="h-12 w-full rounded-2xl border border-[var(--border)] bg-[var(--input)] px-4 text-sm text-[var(--foreground)] outline-none transition focus:border-[var(--primary)] focus:ring-4 focus:ring-[var(--ring)]"
            />

            <div className="max-h-72 space-y-2 overflow-y-auto rounded-2xl border border-[var(--border)] p-2">
              {filteredCountries.map((country) => {
                const selected = residenceCountryCode === country.code;

                return (
                  <button
                    key={country.code}
                    type="button"
                    onClick={() => setResidenceCountryCode(country.code)}
                    className={[
                      "w-full rounded-xl px-3 py-3 text-left transition",
                      selected
                        ? "bg-[var(--secondary)]"
                        : "hover:bg-[var(--surface-2)]",
                    ].join(" ")}
                  >
                    <div className="text-sm font-medium text-[var(--text-strong)]">
                      {country.flagEmoji ? `${country.flagEmoji} ` : ""}
                      {country.name}
                    </div>
                    <div className="mt-1 text-xs text-[var(--text-soft)]">
                      {country.code}
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-2)] p-4">
              <div className="text-sm font-semibold text-[var(--text-strong)]">
                Review
              </div>

              <div className="mt-3 space-y-2 text-sm">
                <div className="flex justify-between gap-4">
                  <span className="text-[var(--text-soft)]">Intent</span>
                  <span className="text-right text-[var(--text-main)]">
                    {formatIntent(intent)}
                  </span>
                </div>

                <div className="flex justify-between gap-4">
                  <span className="text-[var(--text-soft)]">Headline</span>
                  <span className="text-right text-[var(--text-main)]">
                    {headline.trim() || "—"}
                  </span>
                </div>

                <div className="flex justify-between gap-4">
                  <span className="text-[var(--text-soft)]">Nationality</span>
                  <span className="text-right text-[var(--text-main)]">
                    {nationality?.name ?? nationalityCode ?? "—"}
                  </span>
                </div>

                <div className="flex justify-between gap-4">
                  <span className="text-[var(--text-soft)]">Residence</span>
                  <span className="text-right text-[var(--text-main)]">
                    {residence?.name ?? residenceCountryCode ?? "—"}
                  </span>
                </div>
              </div>
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