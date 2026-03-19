"use client";

import type { LucideIcon } from "lucide-react";

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
      className={[
        "group relative flex h-full min-h-[196px] w-full flex-col overflow-hidden rounded-[24px] border p-5 text-left transition-all duration-200",
        "bg-white/[0.03] hover:bg-white/[0.05]",
        selected
          ? "border-[rgba(58,109,255,0.55)] bg-[rgba(58,109,255,0.10)] shadow-[0_0_0_1px_rgba(58,109,255,0.28),0_0_30px_rgba(58,109,255,0.10)]"
          : "border-white/10",
      ].join(" ")}
    >
      <div className="choice-card-glow" />

      <div
        className={[
          "relative flex h-11 w-11 items-center justify-center rounded-2xl border bg-white/[0.04] transition-all duration-200",
          selected
            ? "border-[rgba(118,142,255,0.30)] shadow-[0_0_18px_rgba(126,87,255,0.14)]"
            : "border-white/10 group-hover:border-white/15",
        ].join(" ")}
      >
        <Icon className="h-5 w-5 text-white" />
      </div>

      <div className="relative mt-5 flex min-h-0 flex-1 flex-col">
        <div className="text-base font-medium text-white">{title}</div>

        <div className="mt-2 min-h-[56px] text-sm leading-7 text-white/52">
          {description ?? ""}
        </div>
      </div>
    </button>
  );
}