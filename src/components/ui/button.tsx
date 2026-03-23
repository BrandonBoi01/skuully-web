import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { Slot } from "radix-ui";

import { cn } from "@/lib/utils";
import { Magnetic } from "@/components/effects/magnetic";

const buttonVariants = cva(
  "group/button shimmer-shell relative inline-flex shrink-0 items-center justify-center gap-2 overflow-hidden rounded-[calc(var(--radius)+2px)] border text-sm font-semibold whitespace-nowrap transition-all duration-200 outline-none select-none disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 focus-visible:ring-4 focus-visible:ring-ring/50",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-[var(--brand-gradient)] text-white shadow-[var(--elev-shadow-sm)] hover:brightness-110 hover:shadow-[var(--elev-shadow-md)]",
        secondary:
          "border-[var(--border)] bg-[var(--surface-2)] text-[var(--text-main)] backdrop-blur-xl hover:bg-[var(--surface-3)] hover:shadow-[var(--elev-shadow-sm)]",
        outline:
          "border-[var(--border)] bg-transparent text-[var(--text-main)] hover:bg-[var(--muted)] hover:border-[rgba(var(--skuully-blue),0.22)]",
        ghost:
          "border-transparent bg-transparent text-[var(--text-soft)] hover:bg-[var(--brand-gradient-soft)] hover:text-[var(--text-strong)]",
        destructive:
          "border-transparent bg-[linear-gradient(135deg,rgba(198,38,74,0.95),rgba(204,70,100,0.92))] text-white shadow-[0_10px_30px_rgba(198,38,74,0.2)] hover:brightness-110",
        link: "h-auto rounded-none border-transparent bg-transparent px-0 py-0 text-[var(--primary)] underline-offset-4 hover:underline",
        glass:
          "border-[var(--border)] bg-[var(--surface-1)] text-[var(--text-main)] backdrop-blur-xl shadow-[var(--elev-shadow-sm)] hover:bg-[var(--surface-2)]",
      },
      size: {
        xs: "h-8 px-3 text-xs",
        sm: "h-9 px-4 text-sm",
        default: "h-10 px-4.5 text-sm",
        lg: "h-11 px-5 text-sm",
        xl: "h-12 px-6 text-base",
        icon: "size-10",
        "icon-sm": "size-9",
        "icon-lg": "size-11",
      },
      magnetic: {
        true: "",
        false: "",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
      magnetic: true,
    },
  }
);

function Button({
  className,
  variant,
  size,
  asChild = false,
  magnetic = true,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
    magnetic?: boolean;
  }) {
  const Comp = asChild ? Slot.Root : "button";

  const node = (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, magnetic }), className)}
      {...props}
    />
  );

  if (!magnetic || variant === "link") return node;

  return <Magnetic>{node}</Magnetic>;
}

export { Button, buttonVariants };