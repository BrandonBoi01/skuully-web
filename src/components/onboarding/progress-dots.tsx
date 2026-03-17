type ProgressDotsProps = {
  total: number;
  current: number;
};

export function ProgressDots({ total, current }: ProgressDotsProps) {
  return (
    <div className="flex items-center gap-2">
      {Array.from({ length: total }).map((_, index) => {
        const active = index === current;
        const complete = index < current;

        return (
          <span
            key={index}
            className={`h-2 rounded-full transition-all duration-200 ${
              active
                ? "w-8 bg-white"
                : complete
                ? "w-2 bg-white/65"
                : "w-2 bg-white/20"
            }`}
          />
        );
      })}
    </div>
  );
}