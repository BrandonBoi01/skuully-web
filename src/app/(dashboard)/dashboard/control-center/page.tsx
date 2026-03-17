"use client";

import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import {
  Activity,
  AlertTriangle,
  Building2,
  GraduationCap,
  LayoutGrid,
  ShieldCheck,
  Users,
} from "lucide-react";

import { MetricCard } from "@/components/dashboard/metric-card";
import { GlassCard } from "@/components/glass/glass-card";
import { useDashboardLive } from "@/hooks/use-dashboard-live";
import { apiFetch } from "@/lib/api";
import { getStoredToken, getMeWithToken } from "@/lib/auth";
import {
  ControlCenterHeatMap,
  type HeatMapClass,
} from "@/components/dashboard/control-center-heat-map";
import { ClassDrilldownPanel } from "@/components/dashboard/class-drilldown-panel";

type AttendanceCounts = {
  PRESENT: number;
  ABSENT: number;
  LATE: number;
  EXCUSED: number;
};

type ControlCenterResponse = {
  scope: string;
  schoolId: string;
  program: {
    id: string;
    name: string;
  };
  date: string;
  totals: {
    activeStudents: number;
    activeStaff: number;
    trackedStudents: number;
    trackedStaff: number;
    studentOnCampus: number;
    staffOnCampus: number;
    lockedRows: number;
  };
  operations: {
    expectedClasses: number;
    classesMarkedToday: number;
    classesPendingToday: number;
    openSessions: number;
  };
  students: {
    counts: AttendanceCounts;
    attendanceRate: number;
    untracked: number;
  };
  staff: {
    counts: AttendanceCounts;
    attendanceRate: number;
    untracked: number;
  };
  sessions: {
    total: number;
    open: number;
    closed: number;
    openItems: Array<{
      id: string;
      classId: string;
      className: string | null;
      periodName: string | null;
      createdAt: string;
    }>;
    classesWithoutSessions: Array<{
      id: string;
      name: string;
      grade: string | null;
    }>;
  };
  risks: {
    count: number;
    top: Array<{
      student: {
        id: string;
        fullName: string;
        admissionNo: string | null;
        class: {
          id: string;
          name: string;
        } | null;
      };
      totalTracked: number;
      counts: AttendanceCounts;
      attendanceRate: number;
      overrideCount: number;
      riskScore: number;
      reasons: string[];
    }>;
  };
  recentEvents: Array<{
    id: string;
    personType: string;
    personId: string;
    eventType: string;
    source: string;
    occurredAt: string;
    deviceId: string | null;
  }>;
};

type AuthMeResponse = {
  id: string;
  fullName: string;
  email: string;
  skuullyId?: string | null;
  memberships?: Array<{
    role: string;
    status: string;
    createdAt: string;
    school: {
      id: string;
      name: string;
      country?: string | null;
    };
  }>;
  context?: {
    schoolId?: string | null;
    programId?: string | null;
    role?: string | null;
    membershipId?: string | null;
  };
};

type HeatMapResponse = {
  scope: string;
  schoolId: string;
  programId: string;
  date: string;
  program: {
    id: string;
    name: string;
    template?: {
      id: string;
      code: string;
      name: string;
    } | null;
  };
  summary: {
    totalClasses: number;
    healthy: number;
    watch: number;
    risk: number;
    pending: number;
  };
  classes: HeatMapClass[];
};

function formatPercent(value: number) {
  return `${value.toFixed(1)}%`;
}

function formatCount(value: number) {
  return new Intl.NumberFormat().format(value);
}

function formatEventTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "--:--";

  return date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatNow(value: Date) {
  return value.toLocaleString([], {
    weekday: "long",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getGreeting(date: Date) {
  const hour = date.getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

function getFirstName(fullName?: string) {
  if (!fullName) return "Admin";
  return fullName.trim().split(/\s+/)[0] || "Admin";
}

function StatusPill({ label }: { label: string }) {
  return (
    <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-xs text-white/65">
      {label}
    </span>
  );
}

export default function ControlCenterPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [mounted, setMounted] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [now, setNow] = useState(new Date());
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);

  useEffect(() => {
    const run = async () => {
      const token = getStoredToken();

      if (!token) {
        router.replace("/login");
        return;
      }

      try {
        const me = await getMeWithToken(token);

        if (!me.emailVerified) {
          router.replace("/verify-email");
          return;
        }

        setAuthChecked(true);
      } catch {
        router.replace("/login");
      }
    };

    void run();
  }, [router]);

  useEffect(() => {
    setMounted(true);
    const timer = window.setInterval(() => setNow(new Date()), 30000);
    return () => window.clearInterval(timer);
  }, []);

  const {
    data,
    isLoading,
    isError,
    error,
    isFetching,
  } = useQuery<ControlCenterResponse>({
    queryKey: ["control-center"],
    queryFn: () => apiFetch<ControlCenterResponse>("/dashboard/control-center"),
    retry: false,
    enabled: authChecked,
  });

  const { data: heatMap, isLoading: heatMapLoading } = useQuery<HeatMapResponse>({
    queryKey: ["control-center-heat-map"],
    queryFn: () => apiFetch<HeatMapResponse>("/dashboard/control-center/heat-map"),
    retry: false,
    enabled: authChecked,
  });

  const { data: me } = useQuery<AuthMeResponse>({
    queryKey: ["auth-me"],
    queryFn: () => apiFetch<AuthMeResponse>("/auth/me"),
    retry: false,
    enabled: authChecked,
  });

  if (!authChecked) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <GlassCard className="px-6 py-5 text-sm text-white/70">
          Checking your account...
        </GlassCard>
      </div>
    );
  }

  useDashboardLive({
    schoolId: mounted ? data?.schoolId : undefined,
    programId: mounted ? data?.program?.id : undefined,
    onRefresh: () => {
      queryClient.invalidateQueries({ queryKey: ["control-center"] });
      queryClient.invalidateQueries({ queryKey: ["control-center-heat-map"] });
      queryClient.invalidateQueries({ queryKey: ["auth-me"] });
    },
  });

  useEffect(() => {
    if (!selectedClassId && heatMap?.classes?.length) {
      setSelectedClassId(heatMap.classes[0].id);
    }
  }, [heatMap, selectedClassId]);

  const view = useMemo(
    () => ({
      activeStudents: data?.totals.activeStudents ?? 0,
      activeStaff: data?.totals.activeStaff ?? 0,
      studentAttendanceRate: data?.students.attendanceRate ?? 0,
      openSessions: data?.sessions.open ?? 0,
      studentOnCampus: data?.totals.studentOnCampus ?? 0,
      staffOnCampus: data?.totals.staffOnCampus ?? 0,
      lockedRows: data?.totals.lockedRows ?? 0,
      pendingClasses: data?.sessions.classesWithoutSessions ?? [],
      recentEvents: data?.recentEvents ?? [],
      riskStudents: data?.risks.top ?? [],
      totalRiskStudents: data?.risks.count ?? 0,
      trackedStudents: data?.totals.trackedStudents ?? 0,
      trackedStaff: data?.totals.trackedStaff ?? 0,
      expectedClasses: data?.operations.expectedClasses ?? 0,
      classesMarkedToday: data?.operations.classesMarkedToday ?? 0,
      classesPendingToday: data?.operations.classesPendingToday ?? 0,
    }),
    [data]
  );

  const selectedHeatClass =
    heatMap?.classes.find((item) => item.id === selectedClassId) ??
    heatMap?.classes[0] ??
    null;

  const greeting = getGreeting(now);
  const firstName = getFirstName(me?.fullName ?? "Admin");
  const schoolName =
    me?.memberships?.[0]?.school?.name ?? "Skuully Demo School";
  const curriculumName = heatMap?.program?.template?.name ?? null;
  const roleName = me?.context?.role ?? me?.memberships?.[0]?.role ?? null;
  const currentTimeLabel = mounted ? formatNow(now) : "Loading time...";

  const topPills = [
    data?.program?.name ?? null,
    curriculumName ? `Curriculum: ${curriculumName}` : null,
    roleName ? `Role: ${roleName}` : null,
    currentTimeLabel,
  ].filter(Boolean) as string[];

  const visibleRecentEvents = view.recentEvents.slice(0, 8);
  const visibleRiskStudents = view.riskStudents.slice(0, 8);
  const visiblePendingClasses = view.pendingClasses.slice(0, 8);

  return (
    <div className="space-y-6 pb-6">
      <GlassCard
        glow="blue"
        className="relative overflow-hidden border border-[rgba(54,97,225,0.16)]"
      >
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(54,97,225,0.16),transparent_35%)]" />

        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <p className="text-xs uppercase tracking-[0.28em] text-[rgba(54,97,225,0.82)]">
              {schoolName}
            </p>

            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-white md:text-4xl">
              {greeting}, {firstName}
            </h1>

            <p className="mt-2 max-w-2xl text-sm text-white/55">
              Welcome back to the Skuully Control Center. Here is the live pulse
              of your school today.
            </p>

            <div className="mt-4 flex flex-wrap gap-2">
              {topPills.map((pill) => (
                <StatusPill key={pill} label={pill} />
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2 self-start rounded-2xl border border-[rgba(88,66,171,0.2)] bg-[rgba(255,255,255,0.05)] px-3 py-2 text-xs text-white/60 shadow-[0_0_20px_rgba(88,66,171,0.12)]">
            <span
              className={`inline-block h-2.5 w-2.5 rounded-full ${
                isFetching
                  ? "bg-[rgba(204,70,100,0.95)]"
                  : "bg-[rgba(54,97,225,0.95)]"
              }`}
            />
            {isFetching ? "Refreshing..." : "Live"}
          </div>
        </div>
      </GlassCard>

      {isError ? (
        <GlassCard glow="violet">
          <h2 className="text-lg font-semibold text-rose-200">
            Failed to load control center
          </h2>
          <p className="mt-2 text-sm text-white/60">
            {error instanceof Error ? error.message : "Unknown error"}
          </p>
        </GlassCard>
      ) : null}

      <section className="grid gap-4 md:grid-cols-2 2xl:grid-cols-4">
        <MetricCard
          label="Active Students"
          value={isLoading ? "..." : formatCount(view.activeStudents)}
          icon={GraduationCap}
          glow="blue"
          hint={
            isLoading
              ? "Loading..."
              : `${formatCount(data?.students.untracked ?? 0)} not yet tracked today`
          }
        />
        <MetricCard
          label="Active Staff"
          value={isLoading ? "..." : formatCount(view.activeStaff)}
          icon={Users}
          glow="violet"
          hint={
            isLoading
              ? "Loading..."
              : `${formatCount(data?.staff.untracked ?? 0)} not yet tracked today`
          }
        />
        <MetricCard
          label="Attendance Rate"
          value={isLoading ? "..." : formatPercent(view.studentAttendanceRate)}
          icon={ShieldCheck}
          glow="purple"
          hint="Students today"
        />
        <MetricCard
          label="Open Sessions"
          value={isLoading ? "..." : formatCount(view.openSessions)}
          icon={AlertTriangle}
          glow="magenta"
          hint={
            isLoading
              ? "Loading..."
              : `${formatCount(view.classesPendingToday)} classes still pending`
          }
        />
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.35fr_0.95fr]">
        <GlassCard className="overflow-hidden">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold">Live Class Heat Map</h2>
              <p className="text-sm text-white/50">
                Real-time attendance intensity across classes
              </p>
            </div>

            <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/60">
              <LayoutGrid className="h-4 w-4 text-[#9bb4ff]" />
              {heatMap?.summary?.totalClasses
                ? `${formatCount(heatMap.summary.totalClasses)} tracked classes`
                : "Live grid"}
            </div>
          </div>

          <div className="max-h-[680px] overflow-y-auto pr-1">
            <ControlCenterHeatMap
              data={heatMap}
              isLoading={heatMapLoading}
              selectedClassId={selectedClassId}
              onSelectClass={(item) => setSelectedClassId(item.id)}
            />
          </div>
        </GlassCard>

        <div className="min-h-0">
          <ClassDrilldownPanel selectedClass={selectedHeatClass} />
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-3">
        <GlassCard className="xl:col-span-2">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold">Campus Pulse</h2>
              <p className="text-sm text-white/50">
                Live movement and attendance health
              </p>
            </div>
            <Activity className="h-5 w-5 text-[#9bb4ff]" />
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-sm text-white/55">Students On Campus</p>
              <div className="mt-2 text-3xl font-semibold">
                {isLoading ? "..." : formatCount(view.studentOnCampus)}
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-sm text-white/55">Staff On Campus</p>
              <div className="mt-2 text-3xl font-semibold">
                {isLoading ? "..." : formatCount(view.staffOnCampus)}
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-sm text-white/55">Locked Rows</p>
              <div className="mt-2 text-3xl font-semibold">
                {isLoading ? "..." : formatCount(view.lockedRows)}
              </div>
            </div>
          </div>

          {!isLoading && data ? (
            <div className="mt-4 flex flex-wrap gap-2">
              <StatusPill label={`Tracked Students: ${formatCount(view.trackedStudents)}`} />
              <StatusPill label={`Tracked Staff: ${formatCount(view.trackedStaff)}`} />
              <StatusPill
                label={`Classes Marked: ${formatCount(view.classesMarkedToday)}/${formatCount(view.expectedClasses)}`}
              />
            </div>
          ) : null}
        </GlassCard>

        <GlassCard glow="violet" className="overflow-hidden">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold">Pending Classes</h2>
              <p className="text-sm text-white/50">
                Attendance not yet taken
              </p>
            </div>
            <Building2 className="h-5 w-5 text-[#f0b7df]" />
          </div>

          <div className="mb-4 flex flex-wrap gap-2">
            <StatusPill label={`Pending: ${formatCount(view.classesPendingToday)}`} />
            <StatusPill label={`Expected: ${formatCount(view.expectedClasses)}`} />
          </div>

          <div className="max-h-[380px] space-y-3 overflow-y-auto pr-1">
            {isLoading ? (
              <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/60">
                Loading pending classes...
              </div>
            ) : visiblePendingClasses.length > 0 ? (
              <>
                {visiblePendingClasses.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/80"
                  >
                    <div className="font-medium">{item.name}</div>
                    {item.grade ? (
                      <div className="mt-1 text-xs text-white/45">{item.grade}</div>
                    ) : null}
                  </div>
                ))}

                {view.pendingClasses.length > visiblePendingClasses.length ? (
                  <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white/50">
                    +{formatCount(view.pendingClasses.length - visiblePendingClasses.length)} more classes pending
                  </div>
                ) : null}
              </>
            ) : (
              <div className="rounded-2xl border border-[rgba(165,94,149,0.22)] bg-[rgba(165,94,149,0.12)] px-4 py-3 text-sm text-[#f7d7ee]">
                All classes have sessions today
              </div>
            )}
          </div>
        </GlassCard>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <GlassCard className="overflow-hidden">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold">Recent Events</h2>
              <p className="text-sm text-white/50">
                Latest gate, watch, and attendance events
              </p>
            </div>
            <StatusPill label={`Visible: ${formatCount(visibleRecentEvents.length)}`} />
          </div>

          <div className="max-h-[420px] space-y-3 overflow-y-auto pr-1">
            {isLoading ? (
              <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/60">
                Loading recent events...
              </div>
            ) : visibleRecentEvents.length > 0 ? (
              visibleRecentEvents.map((event) => (
                <div
                  key={event.id}
                  className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/75"
                >
                  <div className="font-medium">
                    {event.eventType} • {event.personType}
                  </div>
                  <div className="mt-1 text-xs text-white/50">
                    {event.source} • {mounted ? formatEventTime(event.occurredAt) : "--:--"}
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/60">
                No recent events for today
              </div>
            )}
          </div>
        </GlassCard>

        <GlassCard glow="purple" className="overflow-hidden">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold">Risk Watch</h2>
              <p className="text-sm text-white/50">
                Students needing immediate attention
              </p>
            </div>
            <StatusPill label={`Total Risk: ${formatCount(view.totalRiskStudents)}`} />
          </div>

          <div className="max-h-[420px] space-y-3 overflow-y-auto pr-1">
            {isLoading ? (
              <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/60">
                Loading risk signals...
              </div>
            ) : visibleRiskStudents.length > 0 ? (
              <>
                {visibleRiskStudents.map((risk) => (
                  <div
                    key={risk.student.id}
                    className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/80"
                  >
                    <div className="font-medium">{risk.student.fullName}</div>
                    <div className="mt-1 text-xs text-white/50">
                      {risk.student.class?.name ?? "No class"} •{" "}
                      {risk.reasons.join(" • ")}
                    </div>
                  </div>
                ))}

                {view.totalRiskStudents > visibleRiskStudents.length ? (
                  <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white/50">
                    +{formatCount(view.totalRiskStudents - visibleRiskStudents.length)} more learners with risk signals
                  </div>
                ) : null}
              </>
            ) : (
              <div className="rounded-2xl border border-[rgba(165,94,149,0.22)] bg-[rgba(165,94,149,0.12)] px-4 py-3 text-sm text-[#f7d7ee]">
                No high-risk students detected
              </div>
            )}
          </div>
        </GlassCard>
      </section>
    </div>
  );
}
