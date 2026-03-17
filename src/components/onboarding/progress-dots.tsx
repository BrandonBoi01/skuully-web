type ProgressDotsProps = {
  total: number;
  current: number;
};

export function ProgressDots({ total, current }: ProgressDotsProps) {
  return (
    <div className="flex items-center gap-2" aria-label={`Step ${current} of ${total}`}>
      {Array.from({ length: total }).map((_, index) => {
        const active = index + 1 === current;
        const complete = index + 1 < current;

        return (
          <span
            key={index}
            className={[
              "h-2 rounded-full transition-all",
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