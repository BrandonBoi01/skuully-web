"use client";

import { cn } from "@/lib/utils";

export type HeatMapClass = {
  id: string;
  name: string;
  grade: string | null;
  rosterCount: number;
  trackedCount: number;
  present: number;
  late: number;
  absent: number;
  excused: number;
  attendanceRate: number;
  riskCount: number;
  hasSession: boolean;
  status: "healthy" | "watch" | "risk" | "pending";
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

type Props = {
  data?: HeatMapResponse;
  isLoading?: boolean;
  selectedClassId?: string | null;
  onSelectClass?: (item: HeatMapClass) => void;
};

function formatCount(value: number) {
  return new Intl.NumberFormat().format(value);
}

function formatPercent(value: number) {
  return `${value.toFixed(0)}%`;
}

function toneClass(status: HeatMapClass["status"]) {
  switch (status) {
    case "healthy":
      return "border-[rgba(54,97,225,0.24)] bg-[linear-gradient(180deg,rgba(54,97,225,0.18),rgba(54,97,225,0.08))]";
    case "watch":
      return "border-[rgba(165,94,149,0.24)] bg-[linear-gradient(180deg,rgba(165,94,149,0.18),rgba(165,94,149,0.08))]";
    case "risk":
      return "border-[rgba(198,38,74,0.26)] bg-[linear-gradient(180deg,rgba(198,38,74,0.18),rgba(198,38,74,0.08))]";
    case "pending":
      return "border-white/10 bg-white/5";
    default:
      return "border-white/10 bg-white/5";
  }
}

function statusLabel(status: HeatMapClass["status"]) {
  switch (status) {
    case "healthy":
      return "Healthy";
    case "watch":
      return "Watch";
    case "risk":
      return "Risk";
    case "pending":
      return "Pending";
    default:
      return "Unknown";
  }
}

function LegendPill({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "healthy" | "watch" | "risk" | "pending";
}) {
  return (
    <div
      className={cn(
        "rounded-full border px-3 py-1 text-xs text-white/75",
        tone === "healthy" &&
          "border-[rgba(54,97,225,0.24)] bg-[rgba(54,97,225,0.12)]",
        tone === "watch" &&
          "border-[rgba(165,94,149,0.24)] bg-[rgba(165,94,149,0.12)]",
        tone === "risk" &&
          "border-[rgba(198,38,74,0.24)] bg-[rgba(198,38,74,0.12)]",
        tone === "pending" && "border-white/10 bg-white/5"
      )}
    >
      {label}: <span className="font-semibold text-white">{formatCount(value)}</span>
    </div>
  );
}

function Stat({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2">
      <div className="text-[11px] text-white/45">{label}</div>
      <div className="mt-1 text-base font-semibold text-white">{value}</div>
    </div>
  );
}

export function ControlCenterHeatMap({
  data,
  isLoading,
  selectedClassId,
  onSelectClass,
}: Props) {
  if (isLoading) {
    return (
      <div className="grid gap-4 lg:grid-cols-2 2xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="rounded-3xl border border-white/10 bg-white/5 p-5"
          >
            <div className="h-5 w-28 rounded bg-white/10" />
            <div className="mt-2 h-4 w-20 rounded bg-white/10" />
            <div className="mt-6 h-10 w-24 rounded bg-white/10" />
            <div className="mt-6 grid grid-cols-2 gap-3">
              <div className="h-14 rounded-2xl bg-white/10" />
              <div className="h-14 rounded-2xl bg-white/10" />
              <div className="h-14 rounded-2xl bg-white/10" />
              <div className="h-14 rounded-2xl bg-white/10" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!data || data.classes.length === 0) {
    return (
      <div className="rounded-3xl border border-white/10 bg-white/5 p-5 text-sm text-white/60">
        No class heat map data available yet.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <LegendPill label="Healthy" value={data.summary.healthy} tone="healthy" />
        <LegendPill label="Watch" value={data.summary.watch} tone="watch" />
        <LegendPill label="Risk" value={data.summary.risk} tone="risk" />
        <LegendPill label="Pending" value={data.summary.pending} tone="pending" />
      </div>

      <div className="grid gap-4 lg:grid-cols-2 2xl:grid-cols-3">
        {data.classes.map((item) => {
          const selected = selectedClassId === item.id;
          const trackedText = `${formatCount(item.trackedCount)}/${formatCount(
            item.rosterCount
          )}`;

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelectClass?.(item)}
              className={cn(
                "rounded-3xl border p-5 text-left transition-all",
                "hover-lift",
                toneClass(item.status),
                selected &&
                  "ring-2 ring-[rgba(255,255,255,0.22)] shadow-[0_0_0_1px_rgba(255,255,255,0.12),0_0_24px_rgba(54,97,225,0.14)]"
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="truncate text-lg font-semibold text-white">
                    {item.name}
                  </div>
                  <div className="truncate text-sm text-white/50">
                    {item.grade ?? "No grade"}
                  </div>
                </div>

                <div className="shrink-0 rounded-full border border-white/10 bg-black/10 px-2.5 py-1 text-[10px] uppercase tracking-[0.16em] text-white/70">
                  {statusLabel(item.status)}
                </div>
              </div>

              <div className="mt-5 flex items-end justify-between gap-4">
                <div>
                  <div className="text-4xl font-semibold leading-none text-white">
                    {formatPercent(item.attendanceRate)}
                  </div>
                  <div className="mt-1 text-xs text-white/45">Attendance rate</div>
                </div>

                <div className="text-right text-xs text-white/55">
                  <div>{trackedText} tracked</div>
                  <div>{item.hasSession ? "Session active" : "No session"}</div>
                </div>
              </div>

              <div className="mt-5 grid grid-cols-2 gap-3">
                <Stat label="Present" value={formatCount(item.present)} />
                <Stat label="Late" value={formatCount(item.late)} />
                <Stat label="Absent" value={formatCount(item.absent)} />
                <Stat label="Risk" value={formatCount(item.riskCount)} />
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}