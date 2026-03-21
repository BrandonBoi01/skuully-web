"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Building2,
  Briefcase,
  GraduationCap,
  Hash,
  School,
  Search,
  Users,
  LockKeyhole,
  Check,
} from "lucide-react";

import { getMe } from "@/lib/auth";
import {
  clearOnboardingState,
  readOnboardingState,
  type JoinRole,
} from "@/lib/onboarding-flow";
import { OnboardingShell } from "@/components/onboarding/onboarding-shell";
import { ChoiceCard } from "@/components/onboarding/choice-card";
import { getPhoneCountries } from "@/lib/geo";
import {
  searchJoinInstitutions,
  submitJoinInviteCode,
  selectJoinInstitution,
  sendPhoneCode,
  verifyPhoneCode,
  skipPhoneStep,
} from "@/lib/onboarding";

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

type JoinStep =
  | "method"
  | "invite_code"
  | "institution_search"
  | "institution_results"
  | "security";

type InstitutionResult = {
  id: string;
  name: string;
  country?: string | null;
  countryCode?: string | null;
  institutionType?: string | null;
  skuullyId?: string | null;
};

type PhoneCountry = {
  code: string;
  name: string;
  flagEmoji?: string | null;
  phoneCode?: string | null;
  phoneMinLength?: number | null;
  phoneMaxLength?: number | null;
};

function joinRoleLabel(role: JoinRole | null) {
  const labels: Record<JoinRole, string> = {
    invite: "Invite",
    teacher: "Teacher",
    student: "Student",
    parent: "Parent",
    staff: "Staff",
  };

  return role ? labels[role] : "Join";
}

function joinRoleIcon(role: JoinRole | null) {
  if (role === "teacher") return GraduationCap;
  if (role === "student") return School;
  if (role === "parent") return Users;
  if (role === "staff") return Briefcase;
  return Hash;
}

function formatInstitutionType(value?: string | null) {
  if (!value) return "Institution";

  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
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

export default function JoinInstitutionPage() {
  const router = useRouter();

  const [isLoading, setIsLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const [isBusy, setIsBusy] = useState(false);
  const [me, setMe] = useState<MeResponse | null>(null);
  const [joinRole, setJoinRole] = useState<JoinRole | null>(null);
  const [step, setStep] = useState<JoinStep>("method");

  const [inviteCode, setInviteCode] = useState("");
  const [searchMode, setSearchMode] = useState<"name" | "skuully_id">("name");
  const [searchQuery, setSearchQuery] = useState("");
  const [institutions, setInstitutions] = useState<InstitutionResult[]>([]);
  const [selectedInstitutionId, setSelectedInstitutionId] = useState<string | null>(null);

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
        const [meResponse, phoneCountriesResponse] = await Promise.all([
          getMe(),
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

        if (meResponse.context?.schoolId && meResponse.context?.programId) {
          router.replace("/dashboard/control-center");
          return;
        }

        const saved = readOnboardingState();

        if (!saved.route || saved.route !== "join_institution" || !saved.joinRole) {
          router.replace("/onboarding");
          return;
        }

        const mappedPhoneCountries = phoneCountriesResponse.items.map((item) => ({
          code: item.code,
          name: item.name,
          flagEmoji: item.flagEmoji,
          phoneCode: item.phoneCode,
          phoneMinLength: item.phoneMinLength,
          phoneMaxLength: item.phoneMaxLength,
        }));

        setPhoneCountries(mappedPhoneCountries);

        const defaultPhoneCountry =
          mappedPhoneCountries.find((item) => item.code === "KE") ??
          mappedPhoneCountries[0] ??
          null;

        if (defaultPhoneCountry) {
          setPhoneCountryCode(defaultPhoneCountry.code);
        }

        if (meResponse.phoneVerified) {
          setPhoneVerified(true);
        }

        setMe(meResponse);
        setJoinRole(saved.joinRole);
        setStep(saved.joinRole === "invite" ? "invite_code" : "method");
        setIsLoading(false);
      } catch {
        router.replace("/login");
      }
    }

    void load();
  }, [router]);

  const filteredInstitutions = useMemo(() => {
    if (!searchQuery.trim()) return institutions;

    const query = searchQuery.trim().toLowerCase();

    return institutions.filter((institution) => {
      if (searchMode === "name") {
        return institution.name.toLowerCase().includes(query);
      }

      return (institution.skuullyId ?? "")
        .toLowerCase()
        .replace(/^@/, "")
        .includes(query.replace(/^@/, ""));
    });
  }, [institutions, searchMode, searchQuery]);

  const selectedInstitution =
    institutions.find((institution) => institution.id === selectedInstitutionId) ?? null;

  const normalizedNationalPhone = normalizeNationalPhone(
    currentPhoneCountry,
    phoneNumber
  );

  const normalizedPhone =
    currentPhoneCountry?.phoneCode && normalizedNationalPhone
      ? `${currentPhoneCountry.phoneCode}${normalizedNationalPhone}`
      : "";

  function handleBack() {
    setError(null);

    if (step === "method") {
      router.push("/onboarding");
      return;
    }

    if (step === "invite_code") {
      if (joinRole === "invite") {
        router.push("/onboarding");
        return;
      }
      setStep("method");
      return;
    }

    if (step === "institution_search") {
      setStep("method");
      return;
    }

    if (step === "institution_results") {
      setStep("institution_search");
      return;
    }

    if (step === "security") {
      if (joinRole === "invite") {
        setStep("invite_code");
      } else {
        setStep("institution_results");
      }
    }
  }

  function handleSkipToExplore() {
    clearOnboardingState();
    router.push("/explore");
  }

  function handleContinueFromMethod() {
    setError(null);

    if (joinRole === "invite") {
      setStep("invite_code");
      return;
    }

    setStep("institution_search");
  }

  async function handleInviteSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!joinRole) {
      setError("Choose how you want to join first.");
      return;
    }

    if (inviteCode.trim().length < 4) {
      setError("Enter a valid invite code.");
      return;
    }

    setStep("security");
  }

  async function handleInstitutionSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!searchQuery.trim()) {
      setError("Enter a school name or Skuully ID to continue.");
      return;
    }

    if (!joinRole) {
      setError("Choose how you want to join first.");
      return;
    }

    setIsSearching(true);

    try {
      const result = await searchJoinInstitutions({
        query: searchQuery.trim(),
        mode: searchMode,
        role: joinRole,
      });

      setInstitutions(result.items ?? []);
      setSelectedInstitutionId(null);
      setStep("institution_results");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "We couldn’t search institutions right now."
      );
    } finally {
      setIsSearching(false);
    }
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

  async function handleFinalContinue() {
    setError(null);

    if (!joinRole) {
      setError("Choose how you want to join first.");
      return;
    }

    setIsBusy(true);

    try {
      if (addPhoneLater) {
        await skipPhoneStep();
      } else {
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
      }

      if (joinRole === "invite") {
        await submitJoinInviteCode({
          code: inviteCode.trim(),
          role: joinRole,
        });
      } else {
        if (!selectedInstitutionId) {
          setError("Select an institution to continue.");
          return;
        }

        await selectJoinInstitution({
          schoolId: selectedInstitutionId,
          role: joinRole,
        });
      }

      clearOnboardingState();
      router.push("/explore");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "We couldn’t complete your join request."
      );
    } finally {
      setIsBusy(false);
    }
  }

  if (isLoading) {
    return (
      <div className="skuully-cinematic-bg flex min-h-screen items-center justify-center text-white">
        <div className="skuully-glass-card rounded-[28px] px-6 py-5 text-sm text-white/65">
          Preparing your join flow...
        </div>
      </div>
    );
  }

  if (step === "method") {
    return (
      <OnboardingShell
        step={1}
        totalSteps={3}
        title={`Join as ${joinRoleLabel(joinRole)}`}
        subtitle="Choose how Skuully should find your institution."
        footer={
          <div className="flex flex-wrap items-center justify-between gap-4">
            <button
              type="button"
              onClick={handleBack}
              className="text-sm text-white/55 transition hover:text-white"
            >
              Back
            </button>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleSkipToExplore}
                className="text-sm text-white/45 transition hover:text-white/70"
              >
                Skip for now
              </button>

              <button
                type="button"
                onClick={handleContinueFromMethod}
                className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-medium text-black transition hover:opacity-95"
              >
                Continue
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        }
      >
        <div className="grid items-stretch gap-4 md:grid-cols-3">
          <ChoiceCard
            title="Search by name"
            description="Find your institution using its public name."
            icon={Search}
            selected={searchMode === "name"}
            onClick={() => setSearchMode("name")}
          />
          <ChoiceCard
            title="Search by Skuully ID"
            description="Use a school or institution Skuully identity."
            icon={Hash}
            selected={searchMode === "skuully_id"}
            onClick={() => setSearchMode("skuully_id")}
          />
          <ChoiceCard
            title="Use an invite instead"
            description="Switch to an invite code if you already have one."
            icon={Building2}
            selected={joinRole === "invite"}
            onClick={() => {
              setJoinRole("invite");
              setStep("invite_code");
            }}
          />
        </div>
      </OnboardingShell>
    );
  }

  if (step === "invite_code") {
    return (
      <OnboardingShell
        step={2}
        totalSteps={3}
        title="Enter your invite code"
        subtitle="Use the code you received from your institution."
        footer={
          <div className="flex flex-wrap items-center justify-between gap-4">
            <button
              type="button"
              onClick={handleBack}
              className="text-sm text-white/55 transition hover:text-white"
            >
              Back
            </button>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleSkipToExplore}
                className="text-sm text-white/45 transition hover:text-white/70"
              >
                Skip for now
              </button>

              <button
                type="submit"
                form="invite-form"
                className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-medium text-black transition hover:opacity-95"
              >
                Continue
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        }
      >
        <form id="invite-form" onSubmit={handleInviteSubmit} className="space-y-6">
          <div className="skuully-glass-card rounded-[24px] p-5">
            <label className="mb-3 block text-sm text-white/70">Invite code</label>
            <input
              value={inviteCode}
              onChange={(event) => setInviteCode(event.target.value.toUpperCase())}
              placeholder="SKU-1234-ABCD"
              className="skuully-focus-ring w-full rounded-[20px] border border-white/10 bg-white/[0.03] px-4 py-4 text-white outline-none placeholder:text-white/25"
              autoComplete="off"
            />
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

  if (step === "institution_search") {
    const Icon = joinRoleIcon(joinRole);

    return (
      <OnboardingShell
        step={2}
        totalSteps={3}
        title="Find your institution"
        subtitle={`Search as ${joinRoleLabel(joinRole).toLowerCase()} and continue into the right space.`}
        footer={
          <div className="flex flex-wrap items-center justify-between gap-4">
            <button
              type="button"
              onClick={handleBack}
              className="text-sm text-white/55 transition hover:text-white"
            >
              Back
            </button>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleSkipToExplore}
                className="text-sm text-white/45 transition hover:text-white/70"
              >
                Skip for now
              </button>

              <button
                type="submit"
                form="institution-search-form"
                disabled={isSearching}
                className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-medium text-black transition hover:opacity-95 disabled:opacity-50"
              >
                {isSearching ? "Searching..." : "Search"}
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        }
      >
        <form
          id="institution-search-form"
          onSubmit={handleInstitutionSearch}
          className="space-y-6"
        >
          <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="skuully-glass-card rounded-[24px] p-5">
              <div className="mb-4 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => setSearchMode("name")}
                  className={`rounded-full px-4 py-2 text-sm transition ${
                    searchMode === "name"
                      ? "bg-white text-black"
                      : "border border-white/10 bg-white/[0.03] text-white/70 hover:bg-white/[0.06]"
                  }`}
                >
                  Search by name
                </button>

                <button
                  type="button"
                  onClick={() => setSearchMode("skuully_id")}
                  className={`rounded-full px-4 py-2 text-sm transition ${
                    searchMode === "skuully_id"
                      ? "bg-white text-black"
                      : "border border-white/10 bg-white/[0.03] text-white/70 hover:bg-white/[0.06]"
                  }`}
                >
                  Search by Skuully ID
                </button>
              </div>

              <label className="mb-3 block text-sm text-white/70">
                {searchMode === "name" ? "Institution name" : "Institution Skuully ID"}
              </label>

              <div className="flex items-center gap-3 rounded-[20px] border border-white/10 bg-white/[0.03] px-4 py-4">
                <Search className="h-5 w-5 text-white/45" />
                <input
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder={
                    searchMode === "name"
                      ? "Search for your institution"
                      : "@greenfieldacademy"
                  }
                  className="skuully-focus-ring w-full border-0 bg-transparent text-white outline-none placeholder:text-white/25"
                />
              </div>
            </div>

            <div className="skuully-glass-card rounded-[24px] p-5">
              <div className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04]">
                <Icon className="h-4 w-4 text-white/72" />
              </div>

              <h3 className="mt-4 text-lg font-medium text-white">
                Join with context
              </h3>

              <p className="mt-2 text-sm leading-7 text-white/55">
                Skuully will use your role to shape the next access step once you select an institution.
              </p>
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

  if (step === "institution_results") {
    return (
      <OnboardingShell
        step={2}
        totalSteps={3}
        title="Select your institution"
        subtitle="Choose the institution that matches your role and continue."
        footer={
          <div className="flex flex-wrap items-center justify-between gap-4">
            <button
              type="button"
              onClick={handleBack}
              className="text-sm text-white/55 transition hover:text-white"
            >
              Back
            </button>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleSkipToExplore}
                className="text-sm text-white/45 transition hover:text-white/70"
              >
                Skip for now
              </button>

              <button
                type="button"
                onClick={() => {
                  if (!selectedInstitutionId) {
                    setError("Select an institution to continue.");
                    return;
                  }
                  setError(null);
                  setStep("security");
                }}
                className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-medium text-black transition hover:opacity-95"
              >
                Continue
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        }
      >
        <div className="grid gap-4">
          {filteredInstitutions.length > 0 ? (
            filteredInstitutions.map((institution) => {
              const selected = selectedInstitutionId === institution.id;

              return (
                <button
                  key={institution.id}
                  type="button"
                  onClick={() => setSelectedInstitutionId(institution.id)}
                  className={`w-full rounded-[24px] border p-5 text-left transition ${
                    selected
                      ? "border-[rgba(58,109,255,0.55)] bg-[rgba(58,109,255,0.10)] shadow-[0_0_0_1px_rgba(58,109,255,0.28),0_0_30px_rgba(58,109,255,0.10)]"
                      : "border-white/10 bg-white/[0.03] hover:bg-white/[0.05]"
                  }`}
                >
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <div className="text-base font-medium text-white">
                        {institution.name}
                      </div>
                      <div className="mt-2 text-sm text-white/55">
                        {formatInstitutionType(institution.institutionType)}
                        {institution.country ? ` • ${institution.country}` : ""}
                      </div>
                      {institution.skuullyId ? (
                        <div className="mt-1 text-xs text-white/40">
                          @{institution.skuullyId.replace(/^@/, "")}
                        </div>
                      ) : null}
                    </div>

                    <div className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs text-white/60">
                      Select
                    </div>
                  </div>
                </button>
              );
            })
          ) : (
            <div className="skuully-glass-card rounded-[24px] p-6 text-sm text-white/55">
              No institutions matched your search.
            </div>
          )}

          {error ? (
            <div className="rounded-2xl border border-rose-400/20 bg-rose-400/10 px-4 py-3 text-sm text-rose-100">
              {error}
            </div>
          ) : null}

          {selectedInstitution ? (
            <div className="skuully-glass-card rounded-[24px] p-5 text-sm text-white/55">
              <span className="text-white">Selected:</span> {selectedInstitution.name}
            </div>
          ) : null}
        </div>
      </OnboardingShell>
    );
  }

  return (
    <OnboardingShell
      step={3}
      totalSteps={3}
      title="Add a verification number"
      subtitle="Before entering Skuully, add a phone number now or skip it for later."
      footer={
        <div className="flex flex-wrap items-center justify-between gap-4">
          <button
            type="button"
            onClick={handleBack}
            className="text-sm text-white/55 transition hover:text-white"
          >
            Back
          </button>

          <button
            type="button"
            onClick={handleFinalContinue}
            disabled={isBusy || (!addPhoneLater && !phoneVerified)}
            className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-medium text-black transition hover:opacity-95 disabled:opacity-50"
          >
            {isBusy ? "Finishing..." : "Continue"}
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      }
    >
      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="skuully-glass-card rounded-[24px] p-5">
          <div className="flex items-start gap-3">
            <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04]">
              <LockKeyhole className="h-4 w-4 text-[#b7c8ff]" />
            </div>

            <div className="min-w-0">
              <h3 className="text-lg font-medium text-white">
                Verify your phone
              </h3>
              <p className="mt-1 text-sm leading-7 text-white/55">
                Add a recovery and verification number now, or skip and continue.
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
                    Continue without phone verification for now
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
                        onChange={(event) => handlePhoneChange(event.target.value)}
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

        <div className="space-y-6">
          <div className="skuully-glass-card rounded-[24px] p-5">
            <div className="text-xs uppercase tracking-[0.16em] text-white/35">
              Joining as
            </div>
            <div className="mt-2 text-base font-medium text-white">
              {joinRoleLabel(joinRole)}
            </div>
          </div>

          <div className="skuully-glass-card rounded-[24px] p-5">
            <div className="text-xs uppercase tracking-[0.16em] text-white/35">
              Account
            </div>
            <div className="mt-2 text-base font-medium text-white">
              {me?.fullName ?? "Ready"}
            </div>
            <div className="mt-1 text-sm text-white/55">{me?.email}</div>
          </div>

          {selectedInstitution ? (
            <div className="skuully-glass-card rounded-[24px] p-5">
              <div className="text-xs uppercase tracking-[0.16em] text-white/35">
                Institution
              </div>
              <div className="mt-2 text-base font-medium text-white">
                {selectedInstitution.name}
              </div>
              <div className="mt-1 text-sm text-white/55">
                {formatInstitutionType(selectedInstitution.institutionType)}
                {selectedInstitution.country ? ` • ${selectedInstitution.country}` : ""}
              </div>
            </div>
          ) : null}
        </div>
      </div>

      {error ? (
        <div className="mt-6 rounded-2xl border border-rose-400/20 bg-rose-400/10 px-4 py-3 text-sm text-rose-100">
          {error}
        </div>
      ) : null}
    </OnboardingShell>
  );
}