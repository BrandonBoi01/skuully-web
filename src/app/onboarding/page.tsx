"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Building2,
  ArrowRight,
  Network,
  UserCircle2,
  GraduationCap,
  Users,
  Briefcase,
  School,
  UserRoundCheck,
} from "lucide-react";

import { getMe } from "@/lib/auth";
import {
  clearOnboardingState,
  readOnboardingState,
  writeOnboardingState,
  type OnboardingRoute,
  type BuildInstitutionType,
  type JoinRole,
  type PersonalStart,
} from "@/lib/onboarding-flow";
import { OnboardingShell } from "@/components/onboarding/onboarding-shell";
import { QuestionStep } from "@/components/onboarding/question-step";
import { ChoiceCard } from "@/components/onboarding/choice-card";

type StepKey =
  | "route"
  | "build_type"
  | "join_role"
  | "personal_start";

export default function OnboardingPage() {
  const router = useRouter();

  const [isLoading, setIsLoading] = useState(true);
  const [currentStep, setCurrentStep] = useState<StepKey>("route");
  const [route, setRoute] = useState<OnboardingRoute | null>(null);
  const [buildType, setBuildType] = useState<BuildInstitutionType | null>(null);
  const [joinRole, setJoinRole] = useState<JoinRole | null>(null);
  const [personalStart, setPersonalStart] = useState<PersonalStart | null>(null);

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
        setPersonalStart(saved.personalStart ?? null);

        if (saved.route === "build_institution") {
          setCurrentStep("build_type");
        } else if (saved.route === "join_institution") {
          setCurrentStep("join_role");
        } else if (saved.route === "start_as_me") {
          setCurrentStep("personal_start");
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
      personalStart,
    });
  }, [route, buildType, joinRole, personalStart]);

  const totalSteps = useMemo(() => {
    if (route === "build_institution") return 2;
    if (route === "join_institution") return 2;
    if (route === "start_as_me") return 2;
    return 1;
  }, [route]);

  const currentStepNumber = useMemo(() => {
    if (currentStep === "route") return 1;
    return 2;
  }, [currentStep]);

  const canContinue = useMemo(() => {
    if (currentStep === "route") return !!route;
    if (currentStep === "build_type") return !!buildType;
    if (currentStep === "join_role") return !!joinRole;
    if (currentStep === "personal_start") return !!personalStart;
    return false;
  }, [currentStep, route, buildType, joinRole, personalStart]);

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

      if (route === "start_as_me") {
        setCurrentStep("personal_start");
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

    if (currentStep === "personal_start" && personalStart) {
      router.push("/dashboard/control-center");
    }
  }

  function handleReset() {
    clearOnboardingState();
    setRoute(null);
    setBuildType(null);
    setJoinRole(null);
    setPersonalStart(null);
    setCurrentStep("route");
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#050816] text-white">
        <div className="rounded-3xl border border-white/10 bg-white/[0.04] px-6 py-5 text-sm text-white/65 backdrop-blur-xl">
          Opening onboarding...
        </div>
      </div>
    );
  }

  return (
    <OnboardingShell
      step={currentStepNumber}
      totalSteps={totalSteps}
      onBackHref={undefined}
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
      {currentStep === "route" ? (
        <QuestionStep
          title="What brings you to Skuully?"
          helper="Choose the path that fits today. You can expand later."
        >
          <div className="grid gap-4 md:grid-cols-3">
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
              title="Start as me"
              description="Begin with your personal identity, learning, or community space."
              icon={UserCircle2}
              selected={route === "start_as_me"}
              onClick={() => setRoute("start_as_me")}
            />
          </div>
        </QuestionStep>
      ) : null}

      {currentStep === "build_type" ? (
        <QuestionStep
          title="What are you building?"
          helper="Pick the institution type that matches your starting point."
        >
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
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
        </QuestionStep>
      ) : null}

      {currentStep === "join_role" ? (
        <QuestionStep
          title="How are you joining?"
          helper="We’ll shape the next step around your role."
        >
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
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
        </QuestionStep>
      ) : null}

      {currentStep === "personal_start" ? (
        <QuestionStep
          title="What do you want to begin with?"
          helper="Start where you are. Grow when you’re ready."
        >
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <ChoiceCard
              title="My profile"
              description="Set up your identity and presence."
              icon={UserCircle2}
              selected={personalStart === "profile"}
              onClick={() => setPersonalStart("profile")}
            />
            <ChoiceCard
              title="Learning"
              description="Start from your learning path."
              icon={GraduationCap}
              selected={personalStart === "learning"}
              onClick={() => setPersonalStart("learning")}
            />
            <ChoiceCard
              title="Community"
              description="Discover people, groups, and discussions."
              icon={Users}
              selected={personalStart === "community"}
              onClick={() => setPersonalStart("community")}
            />
            <ChoiceCard
              title="Marketplace"
              description="Explore opportunities, services, and tools."
              icon={Briefcase}
              selected={personalStart === "marketplace"}
              onClick={() => setPersonalStart("marketplace")}
            />
          </div>
        </QuestionStep>
      ) : null}
    </OnboardingShell>
  );
}