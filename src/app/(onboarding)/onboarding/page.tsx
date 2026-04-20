"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { OnboardingLayout } from "@/components/onboarding/onboarding-layout";
import { startOnboarding } from "@/lib/onboarding";
import type { AccountIntent } from "@/lib/onboarding-types";

type IntentCard = {
  intent: AccountIntent;
  title: string;
  description: string;
};

const INTENTS: IntentCard[] = [
  {
    intent: "FOUNDER",
    title: "Founder",
    description: "Create and operate an institution workspace on Skuully.",
  },
  {
    intent: "STAFF",
    title: "Staff",
    description: "Set up your professional identity and prepare to join an institution.",
  },
  {
    intent: "PARENT",
    title: "Parent or Guardian",
    description: "Set up your identity to track and support learners.",
  },
  {
    intent: "STUDENT",
    title: "Student",
    description: "Create your identity and prepare to connect with your institution.",
  },
  {
    intent: "PROFESSIONAL",
    title: "Professional",
    description: "Start with a clean personal profile for learning and growth.",
  },
  {
    intent: "EXPLORER",
    title: "Explorer",
    description: "Get into Skuully and understand the platform first.",
  },
  {
    intent: "UNSURE",
    title: "Not sure yet",
    description: "Start simple and refine your path later.",
  },
];

export default function OnboardingGatewayPage() {
  const router = useRouter();
  const [selectedIntent, setSelectedIntent] = useState<AccountIntent | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isBusy, setIsBusy] = useState(false);

  const canContinue = useMemo(() => !!selectedIntent, [selectedIntent]);

  async function handleContinue() {
    if (!selectedIntent) return;

    setError(null);
    setIsBusy(true);

    try {
      await startOnboarding({ accountIntent: selectedIntent });

      if (selectedIntent === "FOUNDER") {
        router.push("/onboarding/institution");
        return;
      }

      router.push("/onboarding/personal");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not start onboarding."
      );
    } finally {
      setIsBusy(false);
    }
  }

  return (
    <OnboardingLayout
      title="Choose how you want to begin"
      subtitle="Start with the path that best matches your role today."
      footer={
        <div className="flex items-center justify-end">
          <button
            type="button"
            onClick={handleContinue}
            disabled={!canContinue || isBusy}
            className="h-11 rounded-2xl bg-[var(--primary)] px-5 text-sm font-semibold text-[var(--primary-foreground)] transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isBusy ? "Starting..." : "Continue"}
          </button>
        </div>
      }
    >
      <div className="space-y-5">
        <div className="grid gap-3 sm:grid-cols-2">
          {INTENTS.map((item) => {
            const selected = selectedIntent === item.intent;

            return (
              <button
                key={item.intent}
                type="button"
                onClick={() => setSelectedIntent(item.intent)}
                className={[
                  "rounded-2xl border p-4 text-left transition",
                  selected
                    ? "border-[var(--primary)] bg-[var(--secondary)]"
                    : "border-[var(--border)] bg-transparent hover:bg-[var(--surface-2)]",
                ].join(" ")}
              >
                <div className="text-base font-semibold text-[var(--text-strong)]">
                  {item.title}
                </div>
                <div className="mt-2 text-sm leading-6 text-[var(--text-soft)]">
                  {item.description}
                </div>
              </button>
            );
          })}
        </div>

        {error ? (
          <div className="rounded-2xl border border-[rgba(198,38,74,0.25)] bg-[rgba(198,38,74,0.10)] px-4 py-3 text-sm text-[var(--text-main)]">
            {error}
          </div>
        ) : null}
      </div>
    </OnboardingLayout>
  );
}