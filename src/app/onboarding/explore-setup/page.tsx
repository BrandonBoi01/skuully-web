"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, AtSign, Globe2, UserRound } from "lucide-react";

import { getMe } from "@/lib/auth";
import { OnboardingShell } from "@/components/onboarding/onboarding-shell";
import { clearOnboardingState } from "@/lib/onboarding-flow";

type SetupStep = "skuully_id" | "profile";

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

function normalizeSkuullyId(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/^@+/, "")
    .replace(/[^a-z0-9._]/g, "")
    .replace(/\.\.+/g, ".")
    .replace(/__+/g, "_")
    .slice(0, 24);
}

function makeSuggestedSkuullyId(fullName?: string, email?: string) {
  const baseFromName = (fullName ?? "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s._]/g, "")
    .replace(/\s+/g, "")
    .replace(/^@+/, "");

  const baseFromEmail = (email ?? "")
    .split("@")[0]
    ?.toLowerCase()
    .replace(/[^a-z0-9._]/g, "");

  return normalizeSkuullyId(baseFromName || baseFromEmail || "skuullyuser");
}

export default function ExploreSetupPage() {
  const router = useRouter();

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [step, setStep] = useState<SetupStep>("skuully_id");
  const [me, setMe] = useState<MeResponse | null>(null);

  const [skuullyId, setSkuullyId] = useState("");
  const [fullName, setFullName] = useState("");
  const [headline, setHeadline] = useState("");
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

        setMe(meResponse);
        setFullName(meResponse.fullName ?? "");
        setSkuullyId(
          normalizeSkuullyId(
            meResponse.skuullyId || makeSuggestedSkuullyId(meResponse.fullName, meResponse.email)
          )
        );

        setIsLoading(false);
      } catch {
        router.replace("/login");
      }
    }

    void load();
  }, [router]);

  const normalizedId = useMemo(() => normalizeSkuullyId(skuullyId), [skuullyId]);

  const canContinueId = normalizedId.length >= 3;
  const canContinueProfile = fullName.trim().length >= 2;

  async function handleContinueFromId(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!canContinueId) {
      setError("Choose a Skuully ID with at least 3 characters.");
      return;
    }

    setStep("profile");
  }

  async function handleFinish(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSaving(true);

    try {
      // For now we complete the flow client-side.
      // Later this is where you'll persist skuullyId + profile details to backend.
      clearOnboardingState();
      router.push("/explore");
    } catch {
      setError("We couldn’t finish your setup.");
    } finally {
      setIsSaving(false);
    }
  }

  function handleSkip() {
    clearOnboardingState();
    router.push("/explore");
  }

  function handleBack() {
    if (step === "profile") {
      setStep("skuully_id");
      return;
    }

    router.push("/onboarding");
  }

  if (isLoading) {
    return (
      <div className="skuully-cinematic-bg flex min-h-screen items-center justify-center text-white">
        <div className="skuully-glass-card rounded-[28px] px-6 py-5 text-sm text-white/65">
          Preparing your explore setup...
        </div>
      </div>
    );
  }

  if (step === "skuully_id") {
    return (
      <OnboardingShell
        step={1}
        totalSteps={2}
        title="Choose your Skuully ID"
        subtitle="This is how people, schools, and communities find you on Skuully."
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
                onClick={handleSkip}
                className="text-sm text-white/45 transition hover:text-white/70"
              >
                Skip for now
              </button>

              <button
                type="submit"
                form="skuully-id-form"
                disabled={!canContinueId}
                className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-medium text-black transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Continue
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        }
      >
        <form id="skuully-id-form" onSubmit={handleContinueFromId} className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
            <div className="skuully-glass-card rounded-[24px] p-5">
              <label className="mb-3 block text-sm text-white/70">
                Skuully ID
              </label>

              <div className="flex items-center gap-3 rounded-[20px] border border-white/10 bg-white/[0.03] px-4 py-4">
                <AtSign className="h-5 w-5 text-white/45" />
                <input
                  value={skuullyId}
                  onChange={(event) => setSkuullyId(event.target.value)}
                  placeholder="brandonboi"
                  className="skuully-focus-ring w-full border-0 bg-transparent text-base text-white outline-none placeholder:text-white/25"
                  autoComplete="off"
                  spellCheck={false}
                />
              </div>

              <p className="mt-3 text-sm text-white/50">
                Your public Skuully identity will look like{" "}
                <span className="text-white">@{normalizedId || "yourname"}</span>
              </p>
            </div>

            <div className="skuully-glass-card rounded-[24px] p-5">
              <div className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04]">
                <Globe2 className="h-4 w-4 text-white/72" />
              </div>

              <h3 className="mt-4 text-lg font-medium text-white">
                Your identity starts here
              </h3>

              <p className="mt-2 text-sm leading-7 text-white/52">
                Keep it simple, memorable, and easy to find. You can refine your
                profile later.
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
      title="Complete your profile"
      subtitle="Add just enough to make your Skuully presence feel real. You can skip and update it later."
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
              onClick={handleSkip}
              className="text-sm text-white/45 transition hover:text-white/70"
            >
              Skip for now
            </button>

            <button
              type="submit"
              form="profile-form"
              disabled={!canContinueProfile || isSaving}
              className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-medium text-black transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSaving ? "Finishing..." : "Enter Skuully"}
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      }
    >
      <form id="profile-form" onSubmit={handleFinish} className="space-y-6">
        <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="space-y-4">
            <div className="skuully-glass-card rounded-[24px] p-5">
              <label className="mb-3 block text-sm text-white/70">
                Full name
              </label>
              <input
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
                placeholder="Brandon Boi"
                className="skuully-focus-ring w-full rounded-[20px] border border-white/10 bg-white/[0.03] px-4 py-4 text-base text-white outline-none placeholder:text-white/25"
                autoComplete="name"
              />
            </div>

            <div className="skuully-glass-card rounded-[24px] p-5">
              <label className="mb-3 block text-sm text-white/70">
                Headline
              </label>
              <input
                value={headline}
                onChange={(event) => setHeadline(event.target.value)}
                placeholder="Learner, educator, builder, or explorer"
                className="skuully-focus-ring w-full rounded-[20px] border border-white/10 bg-white/[0.03] px-4 py-4 text-base text-white outline-none placeholder:text-white/25"
                autoComplete="off"
              />
            </div>
          </div>

          <div className="skuully-glass-card rounded-[24px] p-5">
            <div className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04]">
              <UserRound className="h-4 w-4 text-white/72" />
            </div>

            <h3 className="mt-4 text-lg font-medium text-white">
              Your first Skuully profile
            </h3>

            <div className="mt-4 space-y-3 text-sm text-white/55">
              <p>
                <span className="text-white">Name:</span>{" "}
                {fullName.trim() || me?.fullName || "Not set"}
              </p>
              <p>
                <span className="text-white">Skuully ID:</span> @{normalizedId}
              </p>
              <p>
                <span className="text-white">Headline:</span>{" "}
                {headline.trim() || "Not set yet"}
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