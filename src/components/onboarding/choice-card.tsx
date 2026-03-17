import { LucideIcon, Check } from "lucide-react";

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
      className={`group relative w-full rounded-3xl border p-5 text-left transition-all duration-200 ${
        selected
          ? "border-white/30 bg-white/[0.08] shadow-[0_0_0_1px_rgba(255,255,255,0.05)]"
          : "border-white/10 bg-white/[0.03] hover:border-white/20 hover:bg-white/[0.05]"
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 items-start gap-4">
          <div
            className={`mt-0.5 inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border ${
              selected
                ? "border-white/20 bg-white/[0.08]"
                : "border-white/10 bg-white/[0.04]"
            }`}
          >
            <Icon className="h-5 w-5 text-white/85" />
          </div>

          <div className="min-w-0">
            <div className="text-base font-medium text-white">{title}</div>
            {description ? (
              <div className="mt-1 text-sm leading-6 text-white/48">
                {description}
              </div>
            ) : null}
          </div>
        </div>

        <div
          className={`inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full border transition ${
            selected
              ? "border-white/25 bg-white text-black"
              : "border-white/12 bg-transparent text-transparent"
          }`}
        >
          <Check className="h-3.5 w-3.5" />
        </div>
      </div>
    </button>
  );
}