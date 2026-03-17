"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { GraduationCap, Network, ArrowRight } from "lucide-react";
import { OnboardingShell } from "@/components/onboarding/onboarding-shell";
import { ChoiceCard } from "@/components/onboarding/choice-card";
import { ProgressDots } from "@/components/onboarding/progress-dots";
import { getMe } from "@/lib/auth";

type PathChoice = "institution" | "social" | null;

export default function OnboardingPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [choice, setChoice] = useState<PathChoice>(null);

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

        setIsLoading(false);
      } catch {
        router.replace("/login");
      }
    }

    void load();
  }, [router]);

  const canContinue = useMemo(() => !!choice, [choice]);

  function handleContinue() {
    if (choice === "institution") {
      router.push("/onboarding/create-school");
      return;
    }

    if (choice === "social") {
      router.push("/dashboard/control-center");
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#060816] text-white">
        <div className="relative isolate min-h-screen overflow-hidden">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(54,97,225,0.18),transparent_30%),radial-gradient(circle_at_82%_18%,rgba(165,94,149,0.10),transparent_28%),linear-gradient(180deg,#050816_0%,#070b1d_48%,#050816_100%)]" />
          <div className="relative flex min-h-screen items-center justify-center px-4">
            <div className="rounded-3xl border border-white/10 bg-white/[0.05] px-6 py-5 text-sm text-white/70 backdrop-blur-xl">
              Preparing your onboarding...
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <OnboardingShell
      eyebrow="Welcome to Skuully"
      title="What do you want Skuully to help you do first?"
      subtitle="Pick the path that fits you best. You can expand later."
      footer={
        <div className="flex items-center justify-between gap-4">
          <ProgressDots total={1} current={1} />
          <button
            type="button"
            onClick={handleContinue}
            disabled={!canContinue}
            className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-medium text-black transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Continue
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      }
    >
      <div className="grid gap-4 md:grid-cols-2">
        <ChoiceCard
          title="Run an institution"
          description="Set up a school, college, academy, or university workspace."
          icon={GraduationCap}
          selected={choice === "institution"}
          onClick={() => setChoice("institution")}
        />

        <ChoiceCard
          title="Start with social"
          description="Begin with the social and community side, then grow from there."
          icon={Network}
          selected={choice === "social"}
          onClick={() => setChoice("social")}
        />
      </div>
    </OnboardingShell>
  );
}