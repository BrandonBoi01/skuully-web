"use client";

import { useEffect, useRef } from "react";

export function CursorOrb() {
  const orbRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const orb = orbRef.current;
    if (!orb) return;

    let x = 0;
    let y = 0;

    const move = (e: MouseEvent) => {
      x = e.clientX;
      y = e.clientY;

      requestAnimationFrame(() => {
        orb.style.transform = `translate3d(${x}px, ${y}px, 0)`;
      });
    };

    window.addEventListener("mousemove", move);

    return () => {
      window.removeEventListener("mousemove", move);
    };
  }, []);

    return (
    <div
        ref={orbRef}
        className="pointer-events-none fixed left-0 top-0 z-[9999] hidden md:block h-[260px] w-[260px] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-40 blur-[90px]"
        style={{
        background:
            "radial-gradient(circle, rgba(54,97,225,0.35), rgba(88,66,171,0.25), transparent 70%)",
        }}
    />
    );
}