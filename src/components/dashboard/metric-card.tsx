import { GlassCard } from "@/components/glass/glass-card";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

type MetricCardProps = {
  label: string;
  value: string | number;
  icon: LucideIcon;
  glow?: "blue" | "violet" | "purple" | "magenta" | "none";
  hint?: string;
};

const glowMap = {
  blue: {
    orb: "bg-[radial-gradient(circle_at_top_right,rgba(var(--skuully-blue),0.18),transparent_42%)]",
    iconWrap:
      "border-[rgba(var(--skuully-blue),0.22)] bg-[rgba(var(--skuully-blue),0.10)] shadow-[var(--glow-blue)]",
    icon: "text-[rgb(var(--skuully-blue))]",
  },
  violet: {
    orb: "bg-[radial-gradient(circle_at_top_right,rgba(var(--skuully-violet),0.18),transparent_42%)]",
    iconWrap:
      "border-[rgba(var(--skuully-violet),0.22)] bg-[rgba(var(--skuully-violet),0.10)] shadow-[var(--glow-violet)]",
    icon: "text-[rgb(var(--skuully-violet))]",
  },
  purple: {
    orb: "bg-[radial-gradient(circle_at_top_right,rgba(var(--skuully-purple),0.18),transparent_42%)]",
    iconWrap:
      "border-[rgba(var(--skuully-purple),0.22)] bg-[rgba(var(--skuully-purple),0.10)] shadow-[var(--glow-purple)]",
    icon: "text-[rgb(var(--skuully-purple))]",
  },
  magenta: {
    orb: "bg-[radial-gradient(circle_at_top_right,rgba(var(--skuully-magenta),0.18),transparent_42%)]",
    iconWrap:
      "border-[rgba(var(--skuully-magenta),0.22)] bg-[rgba(var(--skuully-magenta),0.10)] shadow-[var(--glow-magenta)]",
    icon: "text-[rgb(var(--skuully-magenta))]",
  },
  none: {
    orb: "",
    iconWrap: "border-[var(--border)] bg-[var(--surface-2)]",
    icon: "text-[var(--text-main)]",
  },
} as const;

export function MetricCard({
  label,
  value,
  icon: Icon,
  glow = "none",
  hint,
}: MetricCardProps) {
  const tone = glowMap[glow];

  return (
    <GlassCard glow="none" className="shimmer-shell relative overflow-hidden">
      <div
        className={cn("pointer-events-none absolute inset-0 opacity-80", tone.orb)}
      />

      <div className="relative flex items-start justify-between">
        <div>
          <p className="text-sm text-[var(--text-soft)]">{label}</p>
          <h3 className="mt-2 text-3xl font-semibold tracking-tight text-[var(--text-strong)]">
            {value}
          </h3>
          {hint ? <p className="mt-2 text-xs text-[var(--text-soft)]">{hint}</p> : null}
        </div>

        <div
          className={cn(
            "rounded-2xl border p-3 transition duration-300",
            tone.iconWrap
          )}
        >
          <Icon className={cn("h-5 w-5", tone.icon)} />
        </div>
      </div>
    </GlassCard>
  );
}