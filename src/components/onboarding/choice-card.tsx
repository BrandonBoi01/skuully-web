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
        "group flex h-full min-h-[196px] w-full flex-col rounded-[24px] border p-5 text-left transition-all duration-200",
        "bg-white/[0.03] hover:bg-white/[0.05]",
        selected
          ? "border-[rgba(58,109,255,0.55)] bg-[rgba(58,109,255,0.10)] shadow-[0_0_0_1px_rgba(58,109,255,0.28),0_0_30px_rgba(58,109,255,0.10)]"
          : "border-white/10",
      ].join(" ")}
    >
      <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] transition-all duration-200 group-hover:border-white/15">
        <Icon className="h-5 w-5 text-white" />
      </div>

      <div className="mt-5 flex min-h-0 flex-1 flex-col">
        <div className="text-base font-medium text-white">{title}</div>

        <div className="mt-2 min-h-[56px] text-sm leading-7 text-white/52">
          {description ?? ""}
        </div>
      </div>
    </button>
  );
}