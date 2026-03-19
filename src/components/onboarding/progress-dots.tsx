type ProgressDotsProps = {
  total: number;
  current: number;
};

export function ProgressDots({ total, current }: ProgressDotsProps) {
  const safeTotal = Math.max(1, total);
  const safeCurrent = Math.min(Math.max(1, current), safeTotal);

  return (
    <div
      className="flex items-center gap-2"
      aria-label={`Step ${safeCurrent} of ${safeTotal}`}
      role="progressbar"
      aria-valuemin={1}
      aria-valuemax={safeTotal}
      aria-valuenow={safeCurrent}
    >
      {Array.from({ length: safeTotal }).map((_, index) => {
        const step = index + 1;
        const active = step === safeCurrent;
        const complete = step < safeCurrent;

        return (
          <span
            key={step}
            className={[
              "h-2 rounded-full transition-all duration-200",
              active
                ? "w-8 bg-white"
                : complete
                ? "w-3 bg-white/60"
                : "w-3 bg-white/20",
            ].join(" ")}
          />
        );
      })}
    </div>
  );
}