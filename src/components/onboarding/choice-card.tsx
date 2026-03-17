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
        "group w-full rounded-3xl border p-5 text-left transition",
        "bg-white/[0.03] hover:bg-white/[0.05]",
        selected
          ? "border-[rgba(54,97,225,0.45)] bg-[rgba(54,97,225,0.10)]"
          : "border-white/10",
      ].join(" ")}
    >
      <div className="flex items-start gap-4">
        <div
          className={[
            "inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border transition",
            selected
              ? "border-[rgba(54,97,225,0.35)] bg-[rgba(54,97,225,0.16)]"
              : "border-white/10 bg-white/[0.04]",
          ].join(" ")}
        >
          <Icon className="h-5 w-5 text-white" />
        </div>

        <div className="min-w-0">
          <div className="text-base font-medium text-white">{title}</div>
          {description ? (
            <p className="mt-1 text-sm leading-6 text-white/50">{description}</p>
          ) : null}
        </div>
      </div>
    </button>
  );
}