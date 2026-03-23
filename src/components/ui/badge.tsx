import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { Slot } from "radix-ui";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "group/badge inline-flex h-6 w-fit shrink-0 items-center justify-center gap-1 overflow-hidden rounded-full border px-2.5 py-0.5 text-[11px] font-semibold tracking-[0.01em] whitespace-nowrap transition-all duration-200 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring/50 [&>svg]:pointer-events-none [&>svg]:size-3.5 [&>svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-[var(--brand-gradient)] text-white shadow-[var(--glow-blue)]",
        secondary:
          "border-[var(--border)] bg-[var(--surface-2)] text-[var(--text-main)] backdrop-blur-xl",
        outline:
          "border-[var(--border)] bg-transparent text-[var(--text-main)] hover:bg-[var(--muted)]",
        muted:
          "border-transparent bg-[var(--muted)] text-[var(--muted-foreground)]",
        success:
          "border-emerald-500/20 bg-emerald-500/12 text-emerald-700 dark:text-emerald-300",
        destructive:
          "border-rose-500/20 bg-rose-500/12 text-rose-700 dark:text-rose-300",
        glow:
          "border-[rgba(var(--skuully-blue),0.18)] bg-[var(--brand-gradient-soft)] text-[var(--text-main)] shadow-[var(--glow-violet)]",
        link: "border-transparent bg-transparent px-0 text-[var(--primary)] hover:underline",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

function Badge({
  className,
  variant,
  asChild = false,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & {
    asChild?: boolean;
  }) {
  const Comp = asChild ? Slot.Root : "span";

  return (
    <Comp
      data-slot="badge"
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  );
}

export { Badge, badgeVariants };