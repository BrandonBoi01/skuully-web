import { cn } from "@/lib/utils";

function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      className={cn(
        "rounded-[calc(var(--radius)-2px)] bg-[linear-gradient(90deg,var(--surface-2),var(--surface-3),var(--surface-2))] bg-[length:200%_100%] animate-[shimmerSweep_1.8s_ease-in-out_infinite]",
        className
      )}
      {...props}
    />
  );
}

export { Skeleton };