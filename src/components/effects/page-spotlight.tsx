"use client";

import { useEffect, useRef } from "react";

export function PageSpotlight() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    let x = window.innerWidth / 2;
    let y = window.innerHeight / 2;
    let frame = 0;

    const move = (e: MouseEvent) => {
      x = e.clientX;
      y = e.clientY;

      if (frame) cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        el.style.setProperty("--mx", `${x}px`);
        el.style.setProperty("--my", `${y}px`);
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
      ref={ref}
      className="page-spotlight pointer-events-none fixed inset-0 z-[1] hidden md:block"
      aria-hidden="true"
    />
  );
}