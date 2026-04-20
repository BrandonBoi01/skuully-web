"use client";

import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  GraduationCap,
  ShieldCheck,
  Users,
} from "lucide-react";

import { MetricCard } from "@/components/dashboard/metric-card";
import { GlassCard } from "@/components/glass/glass-card";
import { useDashboardLive } from "@/hooks/use-dashboard-live";
import { apiFetch } from "@/lib/api";
import {
  ControlCenterHeatMap,
  type HeatMapResponse,
} from "@/components/dashboard/control-center-heat-map";
import { ClassDrilldownPanel } from "@/components/dashboard/class-drilldown-panel";
import { useAuthSession } from "@/hooks/use-auth-session";

type AttendanceCounts = {
  PRESENT: number;
  ABSENT: number;
  LATE: number;
  EXCUSED: number;
};

type ControlCenterResponse = {
  institutionId: string;
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
  };
  students: {
    attendanceRate: number;
    untracked: number;
    counts?: AttendanceCounts;
  };
  staff: {
    untracked: number;
    counts?: AttendanceCounts;
  };
  sessions: {
    open: number;
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
        class: {
          name: string;
        } | null;
      };
      reasons: string[];
    }>;
  };
  recentEvents: Array<{
    id: string;
    personType: string;
    eventType: string;
    source: string;
    occurredAt: string;
  }>;
};

function formatCount(value: number) {
  return new Intl.NumberFormat().format(value);
}

function formatPercent(value: number) {
  return `${value.toFixed(1)}%`;
}

function getGreeting(date: Date) {
  const hour = date.getHours();

  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

export default function ControlCenterPage() {
  const queryClient = useQueryClient();
  const { data: me } = useAuthSession();

  const [now, setNow] = useState(new Date());
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 30_000);
    return () => window.clearInterval(timer);
  }, []);

  const {
    data,
    isLoading: isControlCenterLoading,
    isError,
  } = useQuery<ControlCenterResponse>({
    queryKey: ["control-center"],
    queryFn: () => apiFetch<ControlCenterResponse>("/dashboard/control-center"),
    enabled: !!me?.context?.institutionId,
    retry: false,
  });

  const {
    data: heatMap,
    isLoading: isHeatMapLoading,
  } = useQuery<HeatMapResponse>({
    queryKey: ["control-center-heat-map"],
    queryFn: () => apiFetch<HeatMapResponse>("/dashboard/control-center/heat-map"),
    enabled: !!me?.context?.institutionId,
    retry: false,
  });

  useDashboardLive({
    institutionId: data?.institutionId,
    onRefresh: () => {
      queryClient.invalidateQueries({ queryKey: ["control-center"] });
      queryClient.invalidateQueries({ queryKey: ["control-center-heat-map"] });
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
      attendanceRate: data?.students.attendanceRate ?? 0,
      openSessions: data?.sessions.open ?? 0,
      studentOnCampus: data?.totals.studentOnCampus ?? 0,
      staffOnCampus: data?.totals.staffOnCampus ?? 0,
      lockedRows: data?.totals.lockedRows ?? 0,
      pendingClasses: data?.sessions.classesWithoutSessions ?? [],
      recentEvents: data?.recentEvents ?? [],
      riskStudents: data?.risks.top ?? [],
      totalRiskStudents: data?.risks.count ?? 0,
    }),
    [data]
  );

  const selectedHeatClass =
    heatMap?.classes.find((item) => item.id === selectedClassId) ??
    heatMap?.classes[0] ??
    null;

  const firstName = me?.fullName?.trim().split(/\s+/)[0] || "User";
  const institutionName =
    me?.memberships?.[0]?.institution?.name ?? "Skuully Workspace";
  const membershipType =
    me?.context?.membershipType ?? me?.memberships?.[0]?.membershipType ?? null;

  return (
    <div className="space-y-6 pb-6">
      <GlassCard>
        <h1 className="text-2xl font-semibold">
          {getGreeting(now)}, {firstName}
        </h1>
        <p className="mt-1 text-sm text-white/60">
          {institutionName}
          {membershipType ? ` • ${membershipType}` : ""}
        </p>
      </GlassCard>

      {isError ? (
        <GlassCard>
          <p className="text-red-400">Failed to load dashboard.</p>
        </GlassCard>
      ) : null}

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Students"
          value={isControlCenterLoading ? "..." : formatCount(view.activeStudents)}
          icon={GraduationCap}
        />
        <MetricCard
          label="Staff"
          value={isControlCenterLoading ? "..." : formatCount(view.activeStaff)}
          icon={Users}
        />
        <MetricCard
          label="Attendance"
          value={isControlCenterLoading ? "..." : formatPercent(view.attendanceRate)}
          icon={ShieldCheck}
        />
        <MetricCard
          label="Open Sessions"
          value={isControlCenterLoading ? "..." : formatCount(view.openSessions)}
          icon={AlertTriangle}
        />
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <GlassCard>
          <ControlCenterHeatMap
            data={heatMap}
            isLoading={isHeatMapLoading}
            selectedClassId={selectedClassId}
            onSelectClass={(item) => setSelectedClassId(item.id)}
          />
        </GlassCard>

        <ClassDrilldownPanel selectedClass={selectedHeatClass} />
      </section>

      <GlassCard>
        <div className="grid gap-4 md:grid-cols-3">
          <div>Students On Campus: {formatCount(view.studentOnCampus)}</div>
          <div>Staff On Campus: {formatCount(view.staffOnCampus)}</div>
          <div>Locked Rows: {formatCount(view.lockedRows)}</div>
        </div>
      </GlassCard>

      <GlassCard>
        <h2 className="mb-2">Recent Events</h2>
        <div className="space-y-2">
          {view.recentEvents.length > 0 ? (
            view.recentEvents.map((event) => (
              <div key={event.id} className="text-sm">
                {event.eventType} • {event.personType}
              </div>
            ))
          ) : (
            <p className="text-sm text-white/60">No recent events.</p>
          )}
        </div>
      </GlassCard>

      <GlassCard>
        <h2 className="mb-2">Risk Watch</h2>
        <div className="space-y-2">
          {view.riskStudents.length > 0 ? (
            view.riskStudents.map((risk) => (
              <div key={risk.student.id} className="text-sm">
                {risk.student.fullName} • {risk.reasons.join(", ")}
              </div>
            ))
          ) : (
            <p className="text-sm text-white/60">No risk items.</p>
          )}
        </div>
      </GlassCard>
    </div>
  );
}