"use client";

import * as React from "react";
import { Dialog as SheetPrimitive } from "radix-ui";
import { XIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

function Sheet(props: React.ComponentProps<typeof SheetPrimitive.Root>) {
  return <SheetPrimitive.Root data-slot="sheet" {...props} />;
}

function SheetTrigger(props: React.ComponentProps<typeof SheetPrimitive.Trigger>) {
  return <SheetPrimitive.Trigger data-slot="sheet-trigger" {...props} />;
}

function SheetClose(props: React.ComponentProps<typeof SheetPrimitive.Close>) {
  return <SheetPrimitive.Close data-slot="sheet-close" {...props} />;
}

function SheetPortal(props: React.ComponentProps<typeof SheetPrimitive.Portal>) {
  return <SheetPrimitive.Portal data-slot="sheet-portal" {...props} />;
}

function SheetOverlay({
  className,
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Overlay>) {
  return (
    <SheetPrimitive.Overlay
      data-slot="sheet-overlay"
      className={cn(
        "fixed inset-0 z-50 bg-black/30 backdrop-blur-md transition-all duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
        className
      )}
      {...props}
    />
  );
}

function SheetContent({
  className,
  children,
  side = "right",
  showCloseButton = true,
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Content> & {
  side?: "top" | "right" | "bottom" | "left";
  showCloseButton?: boolean;
}) {
  return (
    <SheetPortal>
      <SheetOverlay />
      <SheetPrimitive.Content
        data-slot="sheet-content"
        data-side={side}
        className={cn(
          "glass-strong fixed z-50 flex flex-col border-[var(--border)] text-[var(--foreground)] shadow-[var(--elev-shadow-lg)]",
          "data-[side=top]:inset-x-4 data-[side=top]:top-4 data-[side=top]:rounded-[var(--radius-xl)] data-[side=top]:border",
          "data-[side=bottom]:inset-x-4 data-[side=bottom]:bottom-4 data-[side=bottom]:rounded-[var(--radius-xl)] data-[side=bottom]:border",
          "data-[side=left]:inset-y-4 data-[side=left]:left-4 data-[side=left]:w-[92vw] data-[side=left]:max-w-md data-[side=left]:rounded-[var(--radius-xl)] data-[side=left]:border",
          "data-[side=right]:inset-y-4 data-[side=right]:right-4 data-[side=right]:w-[92vw] data-[side=right]:max-w-md data-[side=right]:rounded-[var(--radius-xl)] data-[side=right]:border",
          "transition duration-200 ease-out data-[state=open]:animate-in data-[state=closed]:animate-out",
          "data-[side=right]:data-[state=open]:slide-in-from-right-6 data-[side=right]:data-[state=closed]:slide-out-to-right-6",
          "data-[side=left]:data-[state=open]:slide-in-from-left-6 data-[side=left]:data-[state=closed]:slide-out-to-left-6",
          "data-[side=top]:data-[state=open]:slide-in-from-top-6 data-[side=top]:data-[state=closed]:slide-out-to-top-6",
          "data-[side=bottom]:data-[state=open]:slide-in-from-bottom-6 data-[side=bottom]:data-[state=closed]:slide-out-to-bottom-6",
          className
        )}
        {...props}
      >
        {children}

        {showCloseButton && (
          <SheetPrimitive.Close asChild>
            <Button
              variant="ghost"
              size="icon-sm"
              className="absolute right-3 top-3"
            >
              <XIcon />
              <span className="sr-only">Close</span>
            </Button>
          </SheetPrimitive.Close>
        )}
      </SheetPrimitive.Content>
    </SheetPortal>
  );
}

function SheetHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sheet-header"
      className={cn("flex flex-col gap-1 px-5 py-4", className)}
      {...props}
    />
  );
}

function SheetFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sheet-footer"
      className={cn("mt-auto flex flex-col gap-3 px-5 py-4", className)}
      {...props}
    />
  );
}

function SheetTitle(
  props: React.ComponentProps<typeof SheetPrimitive.Title>
) {
  return (
    <SheetPrimitive.Title
      data-slot="sheet-title"
      className={cn("text-lg font-semibold text-[var(--text-strong)]", props.className)}
      {...props}
    />
  );
}

function SheetDescription(
  props: React.ComponentProps<typeof SheetPrimitive.Description>
) {
  return (
    <SheetPrimitive.Description
      data-slot="sheet-description"
      className={cn("text-sm leading-6 text-[var(--text-soft)]", props.className)}
      {...props}
    />
  );
}

export {
  Sheet,
  SheetTrigger,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetFooter,
  SheetTitle,
  SheetDescription,
};