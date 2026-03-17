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
    orb: "bg-[radial-gradient(circle_at_top_right,rgba(54,97,225,0.22),transparent_38%)]",
    iconWrap:
      "border-[rgba(54,97,225,0.24)] bg-[rgba(54,97,225,0.10)] shadow-[0_0_20px_rgba(54,97,225,0.14)]",
    icon: "text-[#9bb4ff]",
  },
  violet: {
    orb: "bg-[radial-gradient(circle_at_top_right,rgba(88,66,171,0.24),transparent_38%)]",
    iconWrap:
      "border-[rgba(88,66,171,0.24)] bg-[rgba(88,66,171,0.10)] shadow-[0_0_20px_rgba(88,66,171,0.14)]",
    icon: "text-[#c1b4ff]",
  },
  purple: {
    orb: "bg-[radial-gradient(circle_at_top_right,rgba(165,94,149,0.24),transparent_38%)]",
    iconWrap:
      "border-[rgba(165,94,149,0.24)] bg-[rgba(165,94,149,0.10)] shadow-[0_0_20px_rgba(165,94,149,0.14)]",
    icon: "text-[#f0b7df]",
  },
  magenta: {
    orb: "bg-[radial-gradient(circle_at_top_right,rgba(198,38,74,0.22),transparent_38%)]",
    iconWrap:
      "border-[rgba(198,38,74,0.24)] bg-[rgba(198,38,74,0.10)] shadow-[0_0_20px_rgba(198,38,74,0.14)]",
    icon: "text-[#ff9fba]",
  },
  none: {
    orb: "",
    iconWrap: "border-white/10 bg-white/5",
    icon: "text-white/80",
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
    <GlassCard glow="none" className="relative overflow-hidden shimmer-shell">
      <div
        className={cn("pointer-events-none absolute inset-0 opacity-70", tone.orb)}
      />

      <div className="relative flex items-start justify-between">
        <div>
          <p className="text-sm text-white/60">{label}</p>
          <h3 className="mt-2 text-3xl font-semibold tracking-tight text-white">
            {value}
          </h3>
          {hint ? <p className="mt-2 text-xs text-white/50">{hint}</p> : null}
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