type ProgressDotsProps = {
  total: number;
  current: number;
};

export function ProgressDots({ total, current }: ProgressDotsProps) {
  return (
    <div
      className="flex items-center gap-2"
      aria-label={`Step ${current} of ${total}`}
    >
      {Array.from({ length: total }).map((_, index) => {
        const step = index + 1;
        const active = step === current;
        const complete = step < current;

        return (
          <span
            key={step}
            className={[
              "h-2 rounded-full transition-all duration-200",
              active
                ? "w-8 bg-white"
                : complete
                ? "w-2 bg-white/60"
                : "w-2 bg-white/20",
            ].join(" ")}
          />
        );
      })}
    </div>
  );
}