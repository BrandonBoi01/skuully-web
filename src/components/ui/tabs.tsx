"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { Tabs as TabsPrimitive } from "radix-ui";

import { cn } from "@/lib/utils";

function Tabs({
  className,
  orientation = "horizontal",
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Root>) {
  return (
    <TabsPrimitive.Root
      data-slot="tabs"
      data-orientation={orientation}
      className={cn(
        "group/tabs flex gap-3 data-[orientation=horizontal]:flex-col",
        className
      )}
      {...props}
    />
  );
}

const tabsListVariants = cva(
  "inline-flex w-fit items-center gap-1 rounded-[calc(var(--radius)+2px)] border border-[var(--border)] p-1",
  {
    variants: {
      variant: {
        default: "bg-[var(--surface-1)] backdrop-blur-xl",
        line: "rounded-none border-0 border-b bg-transparent p-0",
        glass: "glass",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

function TabsList({
  className,
  variant,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.List> &
  VariantProps<typeof tabsListVariants>) {
  return (
    <TabsPrimitive.List
      data-slot="tabs-list"
      className={cn(tabsListVariants({ variant }), className)}
      {...props}
    />
  );
}

function TabsTrigger({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Trigger>) {
  return (
    <TabsPrimitive.Trigger
      data-slot="tabs-trigger"
      className={cn(
        "inline-flex h-10 items-center justify-center rounded-[calc(var(--radius)-2px)] px-4 text-sm font-medium text-[var(--text-soft)] transition-all duration-200 outline-none",
        "hover:text-[var(--text-main)] focus-visible:ring-4 focus-visible:ring-ring/50",
        "data-[state=active]:bg-[var(--surface-2)] data-[state=active]:text-[var(--text-strong)] data-[state=active]:shadow-[var(--elev-shadow-xs)]",
        "data-[state=active]:border data-[state=active]:border-[var(--border)]",
        className
      )}
      {...props}
    />
  );
}

function TabsContent({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Content>) {
  return (
    <TabsPrimitive.Content
      data-slot="tabs-content"
      className={cn("outline-none", className)}
      {...props}
    />
  );
}

export { Tabs, TabsList, TabsTrigger, TabsContent, tabsListVariants };