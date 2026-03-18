"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Briefcase,
  Building2,
  GraduationCap,
  Network,
  School,
  ShoppingBag,
  UserCircle2,
  UserRoundCheck,
  Users,
} from "lucide-react";

import { getMe } from "@/lib/auth";
import {
  clearOnboardingState,
  readOnboardingState,
  writeOnboardingState,
  type BuildInstitutionType,
  type ExploreStart,
  type JoinRole,
  type OnboardingRoute,
} from "@/lib/onboarding-flow";
import { OnboardingShell } from "@/components/onboarding/onboarding-shell";
import { ChoiceCard } from "@/components/onboarding/choice-card";
import { QuestionStep } from "@/components/onboarding/question-step";

type StepKey = "route" | "build_type" | "join_role" | "explore_start";

export default function OnboardingPage() {
  const router = useRouter();

  const [isLoading, setIsLoading] = useState(true);
  const [currentStep, setCurrentStep] = useState<StepKey>("route");
  const [route, setRoute] = useState<OnboardingRoute | null>(null);
  const [buildType, setBuildType] = useState<BuildInstitutionType | null>(null);
  const [joinRole, setJoinRole] = useState<JoinRole | null>(null);
  const [exploreStart, setExploreStart] = useState<ExploreStart | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const me = await getMe();

        if (!me) {
          router.replace("/login");
          return;
        }

        if (!me.emailVerified) {
          router.replace("/verify-email");
          return;
        }

        if (me.context?.schoolId && me.context?.programId) {
          router.replace("/dashboard/control-center");
          return;
        }

        const saved = readOnboardingState();
        setRoute(saved.route ?? null);
        setBuildType(saved.buildInstitutionType ?? null);
        setJoinRole(saved.joinRole ?? null);
        setExploreStart(saved.exploreStart ?? null);

        if (saved.route === "build_institution") {
          setCurrentStep("build_type");
        } else if (saved.route === "join_institution") {
          setCurrentStep("join_role");
        } else if (saved.route === "explore_skuully") {
          setCurrentStep("explore_start");
        } else {
          setCurrentStep("route");
        }

        setIsLoading(false);
      } catch {
        router.replace("/login");
      }
    }

    void load();
  }, [router]);

  useEffect(() => {
    writeOnboardingState({
      route,
      buildInstitutionType: buildType,
      joinRole,
      exploreStart,
    });
  }, [route, buildType, joinRole, exploreStart]);

  const totalSteps = useMemo(() => {
    if (route === "build_institution") return 2;
    if (route === "join_institution") return 2;
    if (route === "explore_skuully") return 2;
    return 1;
  }, [route]);

  const currentStepNumber = useMemo(() => {
    if (currentStep === "route") return 1;
    return 2;
  }, [currentStep]);

  const title = useMemo(() => {
    if (currentStep === "route") return "What brings you to Skuully?";
    if (currentStep === "build_type") return "What are you building?";
    if (currentStep === "join_role") return "How are you joining?";
    return "What do you want to explore first?";
  }, [currentStep]);

  const subtitle = useMemo(() => {
    if (currentStep === "route") {
      return "Choose the path that fits today. You can expand later.";
    }
    if (currentStep === "build_type") {
      return "Pick the institution type that matches your starting point.";
    }
    if (currentStep === "join_role") {
      return "We’ll shape the next step around your role.";
    }
    return "Start with the part of Skuully you want to see first.";
  }, [currentStep]);

  const canContinue = useMemo(() => {
    if (currentStep === "route") return !!route;
    if (currentStep === "build_type") return !!buildType;
    if (currentStep === "join_role") return !!joinRole;
    if (currentStep === "explore_start") return !!exploreStart;
    return false;
  }, [currentStep, route, buildType, joinRole, exploreStart]);

  function handleBack() {
    if (currentStep === "route") {
      router.push("/login");
      return;
    }

    setCurrentStep("route");
  }

  function handleContinue() {
    if (currentStep === "route") {
      if (route === "build_institution") {
        setCurrentStep("build_type");
        return;
      }

      if (route === "join_institution") {
        setCurrentStep("join_role");
        return;
      }

      if (route === "explore_skuully") {
        setCurrentStep("explore_start");
        return;
      }

      return;
    }

    if (currentStep === "build_type" && buildType) {
      router.push("/onboarding/create-school");
      return;
    }

    if (currentStep === "join_role" && joinRole) {
      router.push("/onboarding/join");
      return;
    }

    if (currentStep === "explore_start" && exploreStart) {
      router.push("/explore");
    }
  }

  function handleReset() {
    clearOnboardingState();
    setRoute(null);
    setBuildType(null);
    setJoinRole(null);
    setExploreStart(null);
    setCurrentStep("route");
  }

  if (isLoading) {
    return (
      <div className="skuully-cinematic-bg flex min-h-screen items-center justify-center text-white">
        <div className="skuully-glass-card rounded-[28px] px-6 py-5 text-sm text-white/65">
          Opening onboarding...
        </div>
      </div>
    );
  }

  return (
    <OnboardingShell
      step={currentStepNumber}
      totalSteps={totalSteps}
      title={title}
      subtitle={subtitle}
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
            {currentStep !== "route" ? (
              <button
                type="button"
                onClick={handleReset}
                className="text-sm text-white/45 transition hover:text-white/70"
              >
                Start over
              </button>
            ) : null}

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
        </div>
      }
    >
      <QuestionStep>
        {currentStep === "route" ? (
          <div className="grid items-stretch gap-4 md:grid-cols-3">
            <ChoiceCard
              title="Build an institution"
              description="Open a workspace for a school, college, university, or academy."
              icon={Building2}
              selected={route === "build_institution"}
              onClick={() => setRoute("build_institution")}
            />

            <ChoiceCard
              title="Join an institution"
              description="Find your school, accept an invite, or connect your role."
              icon={Network}
              selected={route === "join_institution"}
              onClick={() => setRoute("join_institution")}
            />

            <ChoiceCard
              title="Explore Skuully"
              description="Discover communities, people, schools, and the marketplace."
              icon={UserCircle2}
              selected={route === "explore_skuully"}
              onClick={() => setRoute("explore_skuully")}
            />
          </div>
        ) : null}

        {currentStep === "build_type" ? (
          <div className="grid items-stretch gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <ChoiceCard
              title="School"
              description="Primary or secondary academic workspace."
              icon={School}
              selected={buildType === "school"}
              onClick={() => setBuildType("school")}
            />
            <ChoiceCard
              title="College"
              description="A focused college or tertiary institution."
              icon={GraduationCap}
              selected={buildType === "college"}
              onClick={() => setBuildType("college")}
            />
            <ChoiceCard
              title="University"
              description="A larger academic institution with broader programs."
              icon={Building2}
              selected={buildType === "university"}
              onClick={() => setBuildType("university")}
            />
            <ChoiceCard
              title="Polytechnic"
              description="Practical and technical learning environments."
              icon={Briefcase}
              selected={buildType === "polytechnic"}
              onClick={() => setBuildType("polytechnic")}
            />
            <ChoiceCard
              title="Vocational / TVET"
              description="Skills-first and career-ready academic structure."
              icon={Users}
              selected={buildType === "vocational"}
              onClick={() => setBuildType("vocational")}
            />
            <ChoiceCard
              title="Academy"
              description="A specialized learning institution or brand."
              icon={UserRoundCheck}
              selected={buildType === "academy"}
              onClick={() => setBuildType("academy")}
            />
          </div>
        ) : null}

        {currentStep === "join_role" ? (
          <div className="grid items-stretch gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <ChoiceCard
              title="I have an invite"
              description="Use an invite code to enter directly."
              icon={Network}
              selected={joinRole === "invite"}
              onClick={() => setJoinRole("invite")}
            />
            <ChoiceCard
              title="I’m a teacher"
              description="Join your institution as teaching staff."
              icon={GraduationCap}
              selected={joinRole === "teacher"}
              onClick={() => setJoinRole("teacher")}
            />
            <ChoiceCard
              title="I’m a student"
              description="Connect your learner account."
              icon={UserCircle2}
              selected={joinRole === "student"}
              onClick={() => setJoinRole("student")}
            />
            <ChoiceCard
              title="I’m a parent"
              description="Follow your child’s academic journey."
              icon={Users}
              selected={joinRole === "parent"}
              onClick={() => setJoinRole("parent")}
            />
            <ChoiceCard
              title="I’m staff"
              description="Join in an operational or administrative role."
              icon={Briefcase}
              selected={joinRole === "staff"}
              onClick={() => setJoinRole("staff")}
            />
          </div>
        ) : null}

        {currentStep === "explore_start" ? (
          <div className="grid items-stretch gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <ChoiceCard
              title="Communities"
              description="Join conversations, groups, and shared spaces."
              icon={Users}
              selected={exploreStart === "communities"}
              onClick={() => setExploreStart("communities")}
            />
            <ChoiceCard
              title="Schools"
              description="Discover institutions, programs, and academic spaces."
              icon={School}
              selected={exploreStart === "schools"}
              onClick={() => setExploreStart("schools")}
            />
            <ChoiceCard
              title="People"
              description="Follow learners, educators, and builders."
              icon={UserCircle2}
              selected={exploreStart === "people"}
              onClick={() => setExploreStart("people")}
            />
            <ChoiceCard
              title="Marketplace"
              description="Explore tools, services, and useful opportunities."
              icon={ShoppingBag}
              selected={exploreStart === "marketplace"}
              onClick={() => setExploreStart("marketplace")}
            />
          </div>
        ) : null}
      </QuestionStep>
    </OnboardingShell>
  );
}