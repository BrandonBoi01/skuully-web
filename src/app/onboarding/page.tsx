"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";
import { getMe, logoutSession } from "@/lib/auth";

type ProgramDetails = {
  id: string;
  name: string;
  template?: {
    code: string;
    name: string;
  } | null;
  grades: Array<{
    id: string;
    name: string;
    order: number;
    stage: string;
  }>;
  subjects: Array<{
    id: string;
    name: string;
    code: string | null;
  }>;
};

type ProgramClass = {
  id: string;
  name: string;
  createdAt: string;
  grade: {
    id: string;
    name: string;
    order: number;
    stage: string;
  };
};

export default function OnboardingPage() {
  const router = useRouter();

  const [isLoading, setIsLoading] = useState(true);
  const [authChecked, setAuthChecked] = useState(false);
  const [isBusy, setIsBusy] = useState<"seed" | "classes" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [me, setMe] = useState<any>(null);
  const [program, setProgram] = useState<ProgramDetails | null>(null);
  const [classes, setClasses] = useState<ProgramClass[]>([]);

  async function load() {
    setError(null);

    try {
      const meResponse = await getMe();

      if (!meResponse.emailVerified) {
        router.replace("/verify-email");
        return;
      }

      setMe(meResponse);
      setAuthChecked(true);

      const programId = meResponse.context?.programId;
      const schoolId = meResponse.context?.schoolId;

      if (!schoolId || !programId) {
        setProgram(null);
        setClasses([]);
        return;
      }

      const [programResponse, classesResponse] = await Promise.all([
        apiFetch<ProgramDetails>(`/schools/programs/${programId}`),
        apiFetch<ProgramClass[]>(`/programs/classes`),
      ]);

      setProgram(programResponse);
      setClasses(classesResponse);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load onboarding");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  const hasProgram = !!me?.context?.programId;
  const hasGrades = (program?.grades?.length ?? 0) > 0;
  const hasClasses = classes.length > 0;

  const steps = useMemo(
    () => [
      { label: "Account created", done: !!me?.id },
      { label: "Email verified", done: !!me?.emailVerified },
      { label: "School connected", done: !!me?.context?.schoolId },
      { label: "Program active", done: hasProgram },
      { label: "Curriculum seeded", done: hasGrades },
      { label: "Classes generated", done: hasClasses },
    ],
    [hasClasses, hasGrades, hasProgram, me]
  );

  async function seedProgram() {
    if (!me?.context?.programId) return;

    setIsBusy("seed");
    setError(null);

    try {
      await apiFetch(`/schools/programs/${me.context.programId}/seed`, {
        method: "POST",
      });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to seed program");
    } finally {
      setIsBusy(null);
    }
  }

  async function generateClasses() {
    if (!me?.context?.programId) return;

    setIsBusy("classes");
    setError(null);

    try {
      await apiFetch(`/schools/programs/${me.context.programId}/generate-classes`, {
        method: "POST",
      });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate classes");
    } finally {
      setIsBusy(null);
    }
  }

  async function logout() {
    try {
      await logoutSession();
    } catch {
      // ignore
    } finally {
      router.replace("/login");
    }
  }

  if (isLoading || !authChecked) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,rgba(54,97,225,0.18),transparent_35%),linear-gradient(180deg,#050816_0%,#070b1d_45%,#040611_100%)] text-white">
        <div className="rounded-3xl border border-white/10 bg-white/5 px-6 py-5 text-sm text-white/70 backdrop-blur-xl">
          Preparing your workspace...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(54,97,225,0.18),transparent_35%),linear-gradient(180deg,#050816_0%,#070b1d_45%,#040611_100%)] px-4 py-10 text-white">
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="flex flex-col gap-4 rounded-[28px] border border-white/10 bg-white/5 p-7 backdrop-blur-xl lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.28em] text-[rgba(54,97,225,0.82)]">
              Onboarding
            </p>
            <h1 className="mt-3 text-4xl font-semibold tracking-tight">
              Shape your school command center
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-white/55">
              Start clean. Activate your academic structure. Let the system grow
              with real school life.
            </p>
          </div>

          <button
            onClick={logout}
            className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/70 transition hover:bg-white/10 hover:text-white"
          >
            Logout
          </button>
        </div>

        {error ? (
          <div className="rounded-3xl border border-rose-400/20 bg-rose-400/10 px-5 py-4 text-sm text-rose-100">
            {error}
          </div>
        ) : null}

        <section className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-[28px] border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
            <h2 className="text-xl font-semibold">Setup progress</h2>
            <div className="mt-5 space-y-3">
              {steps.map((step) => (
                <div
                  key={step.label}
                  className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3"
                >
                  <span className="text-sm text-white/80">{step.label}</span>
                  <span
                    className={`rounded-full px-3 py-1 text-xs ${
                      step.done
                        ? "bg-emerald-400/15 text-emerald-100"
                        : "bg-white/5 text-white/55"
                    }`}
                  >
                    {step.done ? "Done" : "Pending"}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[28px] border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
            <h2 className="text-xl font-semibold">Current context</h2>
            <div className="mt-5 space-y-3 text-sm text-white/70">
              <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                <div className="text-white/45">User</div>
                <div className="mt-1 font-medium text-white">
                  {me?.fullName ?? "Unknown user"}
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                <div className="text-white/45">Email status</div>
                <div className="mt-1 font-medium text-white">
                  {me?.emailVerified ? "Verified" : "Not verified"}
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                <div className="text-white/45">Role</div>
                <div className="mt-1 font-medium text-white">
                  {me?.context?.role ?? "Not assigned"}
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                <div className="text-white/45">Program</div>
                <div className="mt-1 font-medium text-white">
                  {program?.name ?? "No active program"}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-4 lg:grid-cols-3">
          <div className="rounded-[28px] border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
            <div className="text-sm text-white/50">Grades</div>
            <div className="mt-2 text-4xl font-semibold">
              {program?.grades?.length ?? 0}
            </div>
          </div>

          <div className="rounded-[28px] border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
            <div className="text-sm text-white/50">Subjects</div>
            <div className="mt-2 text-4xl font-semibold">
              {program?.subjects?.length ?? 0}
            </div>
          </div>

          <div className="rounded-[28px] border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
            <div className="text-sm text-white/50">Classes</div>
            <div className="mt-2 text-4xl font-semibold">{classes.length}</div>
          </div>
        </section>

        <section className="rounded-[28px] border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
          <h2 className="text-xl font-semibold">Next actions</h2>
          <p className="mt-2 text-sm text-white/55">
            Build the academic core first. Intelligence and operations grow from
            there.
          </p>

          <div className="mt-5 flex flex-wrap gap-3">
            <button
              onClick={seedProgram}
              disabled={isBusy !== null || !hasProgram || hasGrades}
              className="rounded-2xl bg-[linear-gradient(135deg,rgba(54,97,225,1),rgba(88,66,171,0.95))] px-4 py-3 text-sm font-medium text-white transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isBusy === "seed"
                ? "Seeding curriculum..."
                : hasGrades
                ? "Curriculum seeded"
                : "Seed curriculum"}
            </button>

            <button
              onClick={generateClasses}
              disabled={isBusy !== null || !hasGrades || hasClasses}
              className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isBusy === "classes"
                ? "Generating classes..."
                : hasClasses
                ? "Classes generated"
                : "Generate classes"}
            </button>

            <Link
              href="/dashboard/control-center"
              className={`rounded-2xl border px-4 py-3 text-sm font-medium transition ${
                hasClasses
                  ? "border-white/10 bg-white/5 text-white hover:bg-white/10"
                  : "pointer-events-none border-white/10 bg-white/5 text-white/35"
              }`}
            >
              Continue to dashboard
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}