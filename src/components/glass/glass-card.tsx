import { cn } from "@/lib/utils";
import { HTMLAttributes } from "react";

type GlassCardProps = HTMLAttributes<HTMLDivElement> & {
  glow?: "blue" | "violet" | "purple" | "magenta" | "none";
};

export function GlassCard({
  className,
  glow = "none",
  ...props
}: GlassCardProps) {
  return (
    <div
      className={cn(
        "glass hover-lift rounded-[var(--radius-xl)] p-5 transition-all duration-300",
        glow === "blue" && "glow-blue",
        glow === "violet" && "glow-violet",
        glow === "purple" && "glow-purple",
        glow === "magenta" && "glow-magenta",
        className
      )}
      {...props}
    />
  );
}