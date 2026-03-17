// src/components/effects/spotlight-card.tsx
"use client";

import { ReactNode, useRef } from "react";
import { cn } from "@/lib/utils";

type SpotlightCardProps = {
  children: ReactNode;
  className?: string;
};

export function SpotlightCard({
  children,
  className,
}: SpotlightCardProps) {
  const ref = useRef<HTMLDivElement>(null);

  function handlePointerMove(e: React.PointerEvent<HTMLDivElement>) {
    const el = ref.current;
    if (!el) return;

    const rect = el.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    el.style.setProperty("--spot-x", `${x}px`);
    el.style.setProperty("--spot-y", `${y}px`);
  }

  function handlePointerLeave() {
    const el = ref.current;
    if (!el) return;

    el.style.setProperty("--spot-x", `50%`);
    el.style.setProperty("--spot-y", `50%`);
  }

  return (
    <div
      ref={ref}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      className={cn("spotlight-card relative", className)}
    >
      {children}
    </div>
  );
}