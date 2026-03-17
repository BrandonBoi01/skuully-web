import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { Slot } from "radix-ui";

import { cn } from "@/lib/utils";
import { Magnetic } from "@/components/effects/magnetic";

const buttonVariants = cva(
  "group/button shimmer-shell inline-flex shrink-0 items-center justify-center rounded-lg border border-transparent bg-clip-padding text-sm font-medium whitespace-nowrap transition-all outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default:
          "bg-[linear-gradient(135deg,rgba(54,97,225,0.95),rgba(88,66,171,0.92))] text-primary-foreground shadow-[0_0_20px_rgba(54,97,225,0.18)] hover:brightness-110",
        outline:
          "border-border bg-background hover:bg-muted hover:text-foreground aria-expanded:bg-muted aria-expanded:text-foreground",
        secondary:
          "bg-[rgba(255,255,255,0.07)] text-secondary-foreground hover:bg-[rgba(255,255,255,0.12)] aria-expanded:bg-[rgba(255,255,255,0.12)] aria-expanded:text-secondary-foreground",
        ghost:
          "hover:bg-[rgba(54,97,225,0.10)] hover:text-white aria-expanded:bg-[rgba(54,97,225,0.10)] aria-expanded:text-white",
        destructive:
          "bg-destructive/10 text-destructive hover:bg-destructive/20 focus-visible:border-destructive/40 focus-visible:ring-destructive/20",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default:
          "h-8 gap-1.5 px-2.5 has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2",
        xs: "h-6 gap-1 rounded-[min(var(--radius-md),10px)] px-2 text-xs has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3",
        sm: "h-7 gap-1 rounded-[min(var(--radius-md),12px)] px-2.5 text-[0.8rem] has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3.5",
        lg: "h-9 gap-1.5 px-3 has-data-[icon=inline-end]:pr-3 has-data-[icon=inline-start]:pl-3",
        icon: "size-8",
        "icon-xs": "size-6 rounded-[min(var(--radius-md),10px)] [&_svg:not([class*='size-'])]:size-3",
        "icon-sm": "size-7 rounded-[min(var(--radius-md),12px)]",
        "icon-lg": "size-9",
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
  variant = "default",
  size = "default",
  asChild = false,
  magnetic = true,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
    magnetic?: boolean;
  }) {
  const Comp = asChild ? Slot.Root : "button";

  const buttonNode = (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, magnetic, className }))}
      {...props}
    />
  );

  if (!magnetic || variant === "link") {
    return buttonNode;
  }

  return <Magnetic>{buttonNode}</Magnetic>;
}

export { Button, buttonVariants };