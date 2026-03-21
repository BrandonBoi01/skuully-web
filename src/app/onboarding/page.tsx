"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Compass, GraduationCap, School, Users } from "lucide-react";

import { writeOnboardingState, type BuildInstitutionType, type OnboardingRoute } from "@/lib/onboarding-flow";
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

const ROUTES: RouteCard[] = [
  {
    route: "build_institution",
    title: "Build an institution",
    description: "Create your school, college, academy, or training workspace.",
    icon: <School className="h-5 w-5" />,
  },
  {
    route: "join_institution",
    title: "Join an institution",
    description: "Accept an invite and enter an existing workspace.",
    icon: <Users className="h-5 w-5" />,
  },
  {
    route: "explore_skuully",
    title: "Explore Skuully",
    description: "Look around first and understand what Skuully can do.",
    icon: <Compass className="h-5 w-5" />,
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

export default function OnboardingPage() {
  const router = useRouter();
  const [selectedRoute, setSelectedRoute] = useState<OnboardingRoute | null>(null);
  const [selectedBuildType, setSelectedBuildType] =
    useState<BuildInstitutionType | null>(null);

  const canContinue = useMemo(() => {
    if (!selectedRoute) return false;
    if (selectedRoute === "build_institution" && !selectedBuildType) return false;
    return true;
  }, [selectedRoute, selectedBuildType]);

  function handleContinue() {
    if (!selectedRoute) return;

    writeOnboardingState({
      route: selectedRoute,
      buildInstitutionType:
        selectedRoute === "build_institution" ? selectedBuildType : null,
    });

    if (selectedRoute === "build_institution") {
      router.push("/onboarding/create-school");
      return;
    }

    if (selectedRoute === "join_institution") {
      router.push("/login");
      return;
    }

    router.push("/dashboard/control-center");
  }

  return (
    <OnboardingShell
      step={1}
      totalSteps={1}
      title="How do you want to start?"
      subtitle="Choose the path that fits you best."
      align="top"
      footer={
        <div className="flex justify-end">
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
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-3">
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
                }}
                className={`skuully-glass-card rounded-[24px] p-5 text-left transition ${
                  selected
                    ? "border border-[rgba(58,109,255,0.28)] bg-[rgba(58,109,255,0.10)]"
                    : "border border-white/10"
                }`}
              >
                <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-[#b7c8ff]">
                  {item.icon}
                </div>

                <h3 className="mt-4 text-lg font-medium text-white">{item.title}</h3>
                <p className="mt-2 text-sm leading-7 text-white/55">
                  {item.description}
                </p>
              </button>
            );
          })}
        </div>

        {selectedRoute === "build_institution" ? (
          <div className="skuully-glass-card rounded-[24px] p-5">
            <div className="flex items-start gap-3">
              <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04]">
                <GraduationCap className="h-5 w-5 text-[#b7c8ff]" />
              </div>

              <div>
                <h3 className="text-lg font-medium text-white">
                  What are you building?
                </h3>
                <p className="mt-1 text-sm leading-7 text-white/55">
                  Pick the institution type so Skuully can shape the right setup flow.
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
                    className={`rounded-[20px] border px-4 py-4 text-left transition ${
                      selected
                        ? "border-[rgba(58,109,255,0.28)] bg-[rgba(58,109,255,0.10)]"
                        : "border-white/10 bg-white/[0.03] hover:bg-white/[0.05]"
                    }`}
                  >
                    <div className="text-sm font-medium text-white">{item.title}</div>
                    <div className="mt-1 text-sm text-white/52">{item.description}</div>
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