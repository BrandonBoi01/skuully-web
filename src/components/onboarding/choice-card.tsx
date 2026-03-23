"use client";

import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type ChoiceCardProps = {
  title: string;
  description?: string;
  icon: LucideIcon;
  selected?: boolean;
  onClick?: () => void;
};

export function ChoiceCard({
  title,
  description,
  icon: Icon,
  selected = false,
  onClick,
}: ChoiceCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "spotlight-card group relative flex h-full min-h-[196px] w-full flex-col overflow-hidden rounded-[28px] border p-5 text-left transition-all duration-200",
        "bg-[var(--surface-1)] hover:bg-[var(--surface-2)] backdrop-blur-xl",
        selected
          ? "border-[rgba(var(--skuully-purple),0.42)] bg-[rgba(var(--skuully-purple),0.08)] shadow-[0_0_0_1px_rgba(165,94,149,0.14),0_20px_44px_rgba(165,94,149,0.16)]"
          : "border-[var(--border)]"
      )}
    >
      <div className="choice-card-glow" />

      <div
        className={cn(
          "relative flex h-12 w-12 items-center justify-center rounded-2xl border transition-all duration-200",
          selected
            ? "border-[rgba(var(--skuully-magenta),0.24)] bg-[rgba(var(--skuully-purple),0.12)] shadow-[var(--glow-purple)]"
            : "border-[var(--border)] bg-[var(--surface-2)] group-hover:border-[rgba(var(--skuully-purple),0.22)]"
        )}
      >
        <Icon className="h-5 w-5 text-[var(--text-strong)]" />
      </div>

      <div className="relative mt-5 flex min-h-0 flex-1 flex-col">
        <div className="text-base font-semibold text-[var(--text-strong)]">
          {title}
        </div>

        <div className="mt-2 min-h-[56px] text-sm leading-7 text-[var(--text-soft)]">
          {description ?? ""}
        </div>
      </div>
    </button>
  );
}