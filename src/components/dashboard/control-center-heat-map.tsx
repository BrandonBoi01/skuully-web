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
      return "border-[rgba(var(--skuully-blue),0.22)] bg-[linear-gradient(180deg,rgba(var(--skuully-blue),0.14),rgba(var(--skuully-blue),0.06))]";
    case "watch":
      return "border-[rgba(var(--skuully-purple),0.22)] bg-[linear-gradient(180deg,rgba(var(--skuully-purple),0.14),rgba(var(--skuully-purple),0.06))]";
    case "risk":
      return "border-[rgba(var(--skuully-magenta),0.24)] bg-[linear-gradient(180deg,rgba(var(--skuully-magenta),0.15),rgba(var(--skuully-magenta),0.06))]";
    case "pending":
      return "border-[var(--border)] bg-[var(--surface-2)]";
    default:
      return "border-[var(--border)] bg-[var(--surface-2)]";
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
        "rounded-full border px-3 py-1 text-xs text-[var(--text-soft)]",
        tone === "healthy" &&
          "border-[rgba(var(--skuully-blue),0.22)] bg-[rgba(var(--skuully-blue),0.10)]",
        tone === "watch" &&
          "border-[rgba(var(--skuully-purple),0.22)] bg-[rgba(var(--skuully-purple),0.10)]",
        tone === "risk" &&
          "border-[rgba(var(--skuully-magenta),0.22)] bg-[rgba(var(--skuully-magenta),0.10)]",
        tone === "pending" && "border-[var(--border)] bg-[var(--surface-2)]"
      )}
    >
      {label}:{" "}
      <span className="font-semibold text-[var(--text-strong)]">
        {formatCount(value)}
      </span>
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
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-1)] px-3 py-2">
      <div className="text-[11px] text-[var(--text-soft)]">{label}</div>
      <div className="mt-1 text-base font-semibold text-[var(--text-strong)]">
        {value}
      </div>
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
            className="glass rounded-3xl p-5"
          >
            <div className="h-5 w-28 rounded bg-[var(--muted)]" />
            <div className="mt-2 h-4 w-20 rounded bg-[var(--muted)]" />
            <div className="mt-6 h-10 w-24 rounded bg-[var(--muted)]" />
            <div className="mt-6 grid grid-cols-2 gap-3">
              <div className="h-14 rounded-2xl bg-[var(--muted)]" />
              <div className="h-14 rounded-2xl bg-[var(--muted)]" />
              <div className="h-14 rounded-2xl bg-[var(--muted)]" />
              <div className="h-14 rounded-2xl bg-[var(--muted)]" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!data || data.classes.length === 0) {
    return (
      <div className="glass rounded-3xl p-5 text-sm text-[var(--text-soft)]">
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
                "spotlight-card relative rounded-3xl border p-5 text-left transition-all duration-200",
                "hover-lift overflow-hidden",
                toneClass(item.status),
                selected &&
                  "ring-2 ring-[rgba(var(--skuully-blue),0.28)] shadow-[var(--elev-shadow-md)]"
              )}
            >
              <div className="relative flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="truncate text-lg font-semibold text-[var(--text-strong)]">
                    {item.name}
                  </div>
                  <div className="truncate text-sm text-[var(--text-soft)]">
                    {item.grade ?? "No grade"}
                  </div>
                </div>

                <div className="shrink-0 rounded-full border border-[var(--border)] bg-[rgba(0,0,0,0.06)] px-2.5 py-1 text-[10px] uppercase tracking-[0.16em] text-[var(--text-soft)] dark:bg-black/10">
                  {statusLabel(item.status)}
                </div>
              </div>

              <div className="relative mt-5 flex items-end justify-between gap-4">
                <div>
                  <div className="brand-text text-4xl font-semibold leading-none">
                    {formatPercent(item.attendanceRate)}
                  </div>
                  <div className="mt-1 text-xs text-[var(--text-soft)]">
                    Attendance rate
                  </div>
                </div>

                <div className="text-right text-xs text-[var(--text-soft)]">
                  <div>{trackedText} tracked</div>
                  <div>{item.hasSession ? "Session active" : "No session"}</div>
                </div>
              </div>

              <div className="relative mt-5 grid grid-cols-2 gap-3">
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