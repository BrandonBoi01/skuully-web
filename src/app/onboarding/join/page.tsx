"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Building2,
  GraduationCap,
  Hash,
  School,
  Search,
  Users,
  Briefcase,
} from "lucide-react";

import { getMe } from "@/lib/auth";
import {
  clearOnboardingState,
  readOnboardingState,
  type JoinRole,
} from "@/lib/onboarding-flow";
import { OnboardingShell } from "@/components/onboarding/onboarding-shell";
import { ChoiceCard } from "@/components/onboarding/choice-card";

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

type JoinStep = "method" | "invite_code" | "institution_search" | "institution_results";

type InstitutionResult = {
  id: string;
  name: string;
  country: string;
  type: string;
};

const MOCK_INSTITUTIONS: InstitutionResult[] = [
  { id: "1", name: "Greenfield Academy", country: "Kenya", type: "School" },
  { id: "2", name: "Sunrise International School", country: "Uganda", type: "School" },
  { id: "3", name: "Nile Technical Institute", country: "Rwanda", type: "College" },
  { id: "4", name: "Atlas Learning University", country: "Nigeria", type: "University" },
];

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

export default function JoinInstitutionPage() {
  const router = useRouter();

  const [isLoading, setIsLoading] = useState(true);
  const [me, setMe] = useState<MeResponse | null>(null);
  const [joinRole, setJoinRole] = useState<JoinRole | null>(null);
  const [step, setStep] = useState<JoinStep>("method");

  const [inviteCode, setInviteCode] = useState("");
  const [searchMode, setSearchMode] = useState<"name" | "skuully_id">("name");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedInstitutionId, setSelectedInstitutionId] = useState<string | null>(null);
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

        if (!saved.route || saved.route !== "join_institution" || !saved.joinRole) {
          router.replace("/onboarding");
          return;
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
    const query = searchQuery.trim().toLowerCase();
    if (!query) return MOCK_INSTITUTIONS;

    return MOCK_INSTITUTIONS.filter((institution) => {
      if (searchMode === "name") {
        return institution.name.toLowerCase().includes(query);
      }

      return institution.name.toLowerCase().replace(/\s+/g, "").includes(query.replace(/^@/, ""));
    });
  }, [searchMode, searchQuery]);

  const selectedInstitution =
    filteredInstitutions.find((institution) => institution.id === selectedInstitutionId) ?? null;

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

  function handleInviteSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (inviteCode.trim().length < 4) {
      setError("Enter a valid invite code.");
      return;
    }

    clearOnboardingState();
    router.push("/explore");
  }

  function handleInstitutionSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!searchQuery.trim()) {
      setError("Enter a school name or Skuully ID to continue.");
      return;
    }

    setSelectedInstitutionId(null);
    setStep("institution_results");
  }

  function handleSelectInstitutionContinue() {
    setError(null);

    if (!selectedInstitutionId) {
      setError("Select an institution to continue.");
      return;
    }

    clearOnboardingState();
    router.push("/explore");
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
        step={2}
        totalSteps={2}
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
            selected={false}
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
        totalSteps={2}
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
        totalSteps={2}
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
                className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-medium text-black transition hover:opacity-95"
              >
                Search
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        }
      >
        <form id="institution-search-form" onSubmit={handleInstitutionSearch} className="space-y-6">
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

  return (
    <OnboardingShell
      step={2}
      totalSteps={2}
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
              onClick={handleSelectInstitutionContinue}
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
                      {institution.type} • {institution.country}
                    </div>
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