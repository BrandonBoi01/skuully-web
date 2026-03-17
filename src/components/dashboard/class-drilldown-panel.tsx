"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import { GlassCard } from "@/components/glass/glass-card";
import { HeatMapClass } from "@/components/dashboard/control-center-heat-map";

type DrilldownLearner = {
  id: string;
  fullName: string;
  admissionNo: string | null;
};

type DrilldownResponse = {
  scope: string;
  date: string;
  class: {
    id: string;
    name: string;
    grade: {
      id: string;
      name: string;
      order: number;
      stage: string;
    } | null;
  };
  session: {
    id: string;
    status: string;
    periodName: string | null;
    createdAt: string;
    closedAt: string | null;
  } | null;
  summary: {
    rosterCount: number;
    trackedCount: number;
    untrackedCount: number;
    attendanceRate: number;
    counts: {
      PRESENT: number;
      ABSENT: number;
      LATE: number;
      EXCUSED: number;
    };
  };
  groups: {
    absent: DrilldownLearner[];
    late: DrilldownLearner[];
    present: DrilldownLearner[];
    excused: DrilldownLearner[];
    untracked: DrilldownLearner[];
  };
};

type Props = {
  selectedClass: HeatMapClass | null;
};

function formatCount(value: number) {
  return new Intl.NumberFormat().format(value);
}

function formatPercent(value: number) {
  return `${value.toFixed(0)}%`;
}

function CompactStat({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 px-3 py-3">
      <div className="text-[11px] text-white/45">{label}</div>
      <div className="mt-1 text-lg font-semibold text-white">{value}</div>
    </div>
  );
}

function MetricPill({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white/70">
      {label}: <span className="font-semibold text-white">{value}</span>
    </div>
  );
}

function GroupList({
  title,
  items,
  maxVisible = 4,
}: {
  title: string;
  items: DrilldownLearner[];
  maxVisible?: number;
}) {
  const visibleItems = items.slice(0, maxVisible);
  const remaining = Math.max(0, items.length - visibleItems.length);

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="text-sm font-medium text-white">{title}</div>
        <div className="text-xs text-white/45">{formatCount(items.length)}</div>
      </div>

      {items.length > 0 ? (
        <div className="space-y-2">
          {visibleItems.map((item) => (
            <div
              key={item.id}
              className="rounded-xl border border-white/8 bg-white/5 px-3 py-2"
            >
              <div className="truncate text-sm text-white">{item.fullName}</div>
              {item.admissionNo ? (
                <div className="text-xs text-white/40">{item.admissionNo}</div>
              ) : null}
            </div>
          ))}

          {remaining > 0 ? (
            <div className="rounded-xl border border-dashed border-white/10 bg-white/[0.03] px-3 py-2 text-xs text-white/45">
              +{formatCount(remaining)} more learners
            </div>
          ) : null}
        </div>
      ) : (
        <div className="text-sm text-white/45">None</div>
      )}
    </div>
  );
}

export function ClassDrilldownPanel({ selectedClass }: Props) {
  const { data, isLoading, isFetching } = useQuery<DrilldownResponse>({
    queryKey: ["class-drilldown", selectedClass?.id],
    queryFn: () =>
      apiFetch<DrilldownResponse>(
        `/dashboard/control-center/class/${selectedClass?.id}`
      ),
    enabled: !!selectedClass?.id,
    retry: false,
  });

  const signalCount = useMemo(() => {
    if (!data) return 0;
    return (
      data.groups.absent.length +
      data.groups.late.length +
      data.groups.untracked.length
    );
  }, [data]);

  if (!selectedClass) {
    return (
      <GlassCard className="h-full">
        <h2 className="text-xl font-semibold">Class Drilldown</h2>
        <p className="mt-2 text-sm text-white/55">
          Select a class tile from the heat map to inspect the live roster state.
        </p>
      </GlassCard>
    );
  }

  if (isLoading || !data) {
    return (
      <GlassCard glow="violet" className="h-full">
        <h2 className="text-xl font-semibold">Loading class details...</h2>
        <p className="mt-2 text-sm text-white/55">
          Fetching daily roster, statuses, and session details.
        </p>
      </GlassCard>
    );
  }

  return (
    <GlassCard glow="violet" className="flex h-full flex-col overflow-hidden">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h2 className="truncate text-2xl font-semibold text-white">
            {data.class.name}
          </h2>
          <p className="mt-1 truncate text-sm text-white/50">
            {data.class.grade?.name ?? "No grade"}
          </p>
        </div>

        <div className="shrink-0 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs uppercase tracking-[0.16em] text-white/70">
          {data.session?.status ?? "No session"}
        </div>
      </div>

      <div className="mt-4">
        <div className="text-5xl font-semibold leading-none text-white">
          {formatPercent(data.summary.attendanceRate)}
        </div>
        <div className="mt-2 text-sm text-white/45">Attendance rate</div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <MetricPill label="Roster" value={formatCount(data.summary.rosterCount)} />
        <MetricPill label="Tracked" value={formatCount(data.summary.trackedCount)} />
        <MetricPill label="Untracked" value={formatCount(data.summary.untrackedCount)} />
        <MetricPill label="Signals" value={formatCount(signalCount)} />
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 xl:grid-cols-4">
        <CompactStat label="Present" value={formatCount(data.summary.counts.PRESENT)} />
        <CompactStat label="Late" value={formatCount(data.summary.counts.LATE)} />
        <CompactStat label="Absent" value={formatCount(data.summary.counts.ABSENT)} />
        <CompactStat label="Excused" value={formatCount(data.summary.counts.EXCUSED)} />
      </div>

      <div className="mt-5 min-h-0 flex-1 overflow-hidden">
        <div className="grid gap-3 xl:grid-cols-1">
          <GroupList title="Absent Learners" items={data.groups.absent} />
          <GroupList title="Late Learners" items={data.groups.late} />
          <GroupList title="Untracked Learners" items={data.groups.untracked} />
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-white/45">
        <span>Session: {data.session?.periodName ?? "Not opened"}</span>
        {isFetching ? <span>• Refreshing...</span> : null}
      </div>
    </GlassCard>
  );
}