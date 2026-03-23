"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Briefcase,
  Compass,
  GraduationCap,
  School,
  Sparkles,
} from "lucide-react";

import {
  writeOnboardingState,
  type AccountIntent,
  type BuildInstitutionType,
  type OnboardingRoute,
} from "@/lib/onboarding-flow";
import { OnboardingShell } from "@/components/onboarding/onboarding-shell";

type RouteCard = {
  route: OnboardingRoute;
  title: string;
  description: string;
  icon: React.ReactNode;
};

type InstitutionCard = {
  type: BuildInstitutionType;
  title: string;
  description: string;
};

type IntentCard = {
  intent: AccountIntent;
  title: string;
  description: string;
};

const ROUTES: RouteCard[] = [
  {
    route: "build_institution",
    title: "Build an institution",
    description: "Create your school, academy, college, or training workspace.",
    icon: <School className="h-5 w-5" />,
  },
  {
    route: "personal_account",
    title: "Start as yourself",
    description: "Begin with your identity and grow into learning, work, or community.",
    icon: <Sparkles className="h-5 w-5" />,
  },
];

const BUILD_TYPES: InstitutionCard[] = [
  {
    type: "school",
    title: "School",
    description: "Primary, secondary, or combined schools.",
  },
  {
    type: "college",
    title: "College",
    description: "Diploma, certificate, and higher learning colleges.",
  },
  {
    type: "university",
    title: "University",
    description: "Undergraduate and postgraduate institutions.",
  },
  {
    type: "polytechnic",
    title: "Polytechnic",
    description: "Technical and practical learning institutions.",
  },
  {
    type: "vocational",
    title: "Vocational / TVET",
    description: "Skills and trade-based learning institutions.",
  },
  {
    type: "academy",
    title: "Academy",
    description: "Independent or specialized academies.",
  },
  {
    type: "training_center",
    title: "Training Center",
    description: "Professional and certification training hubs.",
  },
];

const PERSONAL_INTENTS: IntentCard[] = [
  {
    intent: "founder",
    title: "Founder / Builder",
    description: "You are shaping a school, institution, or education initiative.",
  },
  {
    intent: "staff",
    title: "Staff / Educator",
    description: "You work in teaching, administration, operations, or support.",
  },
  {
    intent: "student",
    title: "Student",
    description: "You want to learn, grow, and manage your academic life.",
  },
  {
    intent: "parent",
    title: "Parent / Guardian",
    description: "You want visibility, communication, and progress tracking.",
  },
  {
    intent: "professional",
    title: "Professional",
    description: "You are here for skills, credentials, or structured growth.",
  },
  {
    intent: "explorer",
    title: "Explorer",
    description: "You want to look around and understand what Skuully offers.",
  },
  {
    intent: "unsure",
    title: "Not sure yet",
    description: "Start simple and choose your direction later.",
  },
];

export default function OnboardingPage() {
  const router = useRouter();

  const [selectedRoute, setSelectedRoute] = useState<OnboardingRoute | null>(null);
  const [selectedBuildType, setSelectedBuildType] =
    useState<BuildInstitutionType | null>(null);
  const [selectedIntent, setSelectedIntent] = useState<AccountIntent | null>(null);

  const canContinue = useMemo(() => {
    if (!selectedRoute) return false;
    if (selectedRoute === "build_institution" && !selectedBuildType) return false;
    if (selectedRoute === "personal_account" && !selectedIntent) return false;
    return true;
  }, [selectedRoute, selectedBuildType, selectedIntent]);

  function handleContinue() {
    if (!selectedRoute) return;

    writeOnboardingState({
      route: selectedRoute,
      buildInstitutionType:
        selectedRoute === "build_institution" ? selectedBuildType : null,
      accountIntent: selectedRoute === "personal_account" ? selectedIntent : null,
    });

    if (selectedRoute === "build_institution") {
      router.push("/onboarding/create-school");
      return;
    }

    router.push("/onboarding/personal-setup");
  }

  return (
    <OnboardingShell
      step={1}
      totalSteps={1}
      title="Choose how you want to begin"
      subtitle="Start with the path that fits your role today."
      align="top"
      footer={
        <div className="flex justify-end">
          <button
            type="button"
            onClick={handleContinue}
            disabled={!canContinue}
            className="skuully-cta inline-flex h-12 items-center gap-2 rounded-2xl px-5 text-sm font-semibold tracking-[-0.01em] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <span>Continue</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      }
    >
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2">
          {ROUTES.map((item) => {
            const selected = selectedRoute === item.route;

            return (
              <button
                key={item.route}
                type="button"
                onClick={() => {
                  setSelectedRoute(item.route);

                  if (item.route !== "build_institution") {
                    setSelectedBuildType(null);
                  }

                  if (item.route !== "personal_account") {
                    setSelectedIntent(null);
                  }
                }}
                className={[
                  "spotlight-card skuully-glass-card hover-lift relative rounded-[24px] p-5 text-left transition",
                  selected
                    ? "border border-[rgba(74,115,235,0.36)] bg-[rgba(74,115,235,0.10)] shadow-[0_0_0_1px_rgba(74,115,235,0.14),0_18px_42px_rgba(54,97,225,0.14)]"
                    : "border border-[var(--border)]",
                ].join(" ")}
              >
                <div className="choice-card-glow" />

                <div className="relative inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-[var(--border)] bg-[var(--surface-1)] text-[rgb(var(--skuully-cyan))] shadow-[var(--elev-shadow-xs)]">
                  {item.icon}
                </div>

                <h3 className="relative mt-4 text-lg font-semibold text-[var(--text-strong)]">
                  {item.title}
                </h3>

                <p className="relative mt-2 text-sm leading-7 text-[var(--text-soft)]">
                  {item.description}
                </p>
              </button>
            );
          })}
        </div>

        {selectedRoute === "build_institution" ? (
          <div className="skuully-glass-card rounded-[24px] p-5">
            <div className="flex items-start gap-3">
              <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-[var(--border)] bg-[var(--surface-1)]">
                <GraduationCap className="h-5 w-5 text-[rgb(var(--skuully-cyan))]" />
              </div>

              <div>
                <h3 className="text-lg font-semibold text-[var(--text-strong)]">
                  What are you building?
                </h3>
                <p className="mt-1 text-sm leading-7 text-[var(--text-soft)]">
                  Choose the institution type so Skuully can shape the right setup flow.
                </p>
              </div>
            </div>

            <div className="mt-5 grid gap-3 md:grid-cols-2">
              {BUILD_TYPES.map((item) => {
                const selected = selectedBuildType === item.type;

                return (
                  <button
                    key={item.type}
                    type="button"
                    onClick={() => setSelectedBuildType(item.type)}
                    className={[
                      "rounded-[20px] border px-4 py-4 text-left transition",
                      selected
                        ? "border-[rgba(74,115,235,0.34)] bg-[rgba(74,115,235,0.10)] shadow-[0_0_0_1px_rgba(74,115,235,0.12)]"
                        : "border-[var(--border)] bg-[var(--surface-1)] hover:bg-[var(--surface-2)]",
                    ].join(" ")}
                  >
                    <div className="text-sm font-semibold text-[var(--text-strong)]">
                      {item.title}
                    </div>
                    <div className="mt-1 text-sm text-[var(--text-soft)]">
                      {item.description}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ) : null}

        {selectedRoute === "personal_account" ? (
          <div className="skuully-glass-card rounded-[24px] p-5">
            <div className="flex items-start gap-3">
              <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-[var(--border)] bg-[var(--surface-1)]">
                <Briefcase className="h-5 w-5 text-[rgb(var(--skuully-cyan))]" />
              </div>

              <div>
                <h3 className="text-lg font-semibold text-[var(--text-strong)]">
                  What best describes you?
                </h3>
                <p className="mt-1 text-sm leading-7 text-[var(--text-soft)]">
                  This helps tailor your personal Skuully setup from the start.
                </p>
              </div>
            </div>

            <div className="mt-5 grid gap-3 md:grid-cols-2">
              {PERSONAL_INTENTS.map((item) => {
                const selected = selectedIntent === item.intent;

                return (
                  <button
                    key={item.intent}
                    type="button"
                    onClick={() => setSelectedIntent(item.intent)}
                    className={[
                      "rounded-[20px] border px-4 py-4 text-left transition",
                      selected
                        ? "border-[rgba(74,115,235,0.34)] bg-[rgba(74,115,235,0.10)] shadow-[0_0_0_1px_rgba(74,115,235,0.12)]"
                        : "border-[var(--border)] bg-[var(--surface-1)] hover:bg-[var(--surface-2)]",
                    ].join(" ")}
                  >
                    <div className="flex items-center gap-2">
                      <Compass className="h-4 w-4 text-[rgb(var(--skuully-cyan))]" />
                      <div className="text-sm font-semibold text-[var(--text-strong)]">
                        {item.title}
                      </div>
                    </div>
                    <div className="mt-1 text-sm text-[var(--text-soft)]">
                      {item.description}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ) : null}
      </div>
    </OnboardingShell>
  );
}