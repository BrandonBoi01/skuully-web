"use client";

import { useEffect, useRef } from "react";

export function CursorOrb() {
  const orbRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const orb = orbRef.current;
    if (!orb) return;

    let x = 0;
    let y = 0;
    let frame = 0;

    const move = (e: MouseEvent) => {
      x = e.clientX;
      y = e.clientY;

      if (frame) cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        orb.style.transform = `translate3d(${x}px, ${y}px, 0)`;
      });
    };

    window.addEventListener("mousemove", move, { passive: true });

    return () => {
      window.removeEventListener("mousemove", move);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <div
      ref={orbRef}
      className="pointer-events-none fixed left-0 top-0 z-[9999] hidden h-[260px] w-[260px] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-30 blur-[90px] md:block dark:opacity-40"
      style={{
        background:
          "radial-gradient(circle, rgba(54,97,225,0.28), rgba(88,66,171,0.18), rgba(198,38,74,0.10), transparent 72%)",
      }}
    />
  );
}