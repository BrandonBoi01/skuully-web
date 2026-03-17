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
        "group w-full rounded-[24px] border p-5 text-left transition-all duration-200",
        "bg-white/[0.03] hover:bg-white/[0.05]",
        selected
          ? "border-[rgba(58,109,255,0.55)] bg-[rgba(58,109,255,0.10)] shadow-[0_0_0_1px_rgba(58,109,255,0.28),0_0_30px_rgba(58,109,255,0.10)]"
          : "border-white/10",
      ].join(" ")}
    >
      <div className="flex items-start gap-4">
        <div
          className={[
            "inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border transition-all duration-200",
            selected
              ? "border-[rgba(58,109,255,0.38)] bg-[rgba(58,109,255,0.16)]"
              : "border-white/10 bg-white/[0.04] group-hover:border-white/15",
          ].join(" ")}
        >
          <Icon className="h-5 w-5 text-white" />
        </div>

        <div className="min-w-0">
          <div className="text-base font-medium text-white">{title}</div>
          {description ? (
            <p className="mt-1 text-sm leading-7 text-white/52">
              {description}
            </p>
          ) : null}
        </div>
      </div>
    </button>
  );
}