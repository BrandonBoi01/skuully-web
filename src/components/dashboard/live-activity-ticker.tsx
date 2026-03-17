"use client";

import { useEffect, useMemo, useState } from "react";

const FALLBACK_ITEMS = [
  "Attendance stream connected",
  "Control center live",
  "Skuully sync active",
  "Real-time monitoring enabled",
];

type LiveActivityTickerProps = {
  items?: string[];
};

export function LiveActivityTicker({
  items = FALLBACK_ITEMS,
}: LiveActivityTickerProps) {
  const safeItems = useMemo(
    () => (items.length > 0 ? items : FALLBACK_ITEMS),
    [items]
  );

  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setIndex((prev) => (prev + 1) % safeItems.length);
    }, 2800);

    return () => window.clearInterval(timer);
  }, [safeItems]);

  return (
    <div className="relative flex min-h-[52px] items-center overflow-hidden rounded-2xl border border-white/10 bg-white/5 px-4 py-2 backdrop-blur-xl xl:px-5">
      <div className="pointer-events-none absolute inset-y-0 left-0 w-12 bg-gradient-to-r from-[#060816] to-transparent opacity-60" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-12 bg-gradient-to-l from-[#060816] to-transparent opacity-60" />

      <div className="flex items-center gap-3 text-xs text-white/65">
        <span className="inline-flex h-2.5 w-2.5 rounded-full bg-[rgba(54,97,225,0.95)] shadow-[0_0_16px_rgba(54,97,225,0.55)]" />
        <span className="uppercase tracking-[0.22em] text-white/40">
          Live Feed
        </span>

        <div className="relative h-4 min-w-[220px] overflow-hidden">
          <div
            key={index}
            className="ticker-slide absolute inset-0 whitespace-nowrap text-white/72"
          >
            {safeItems[index]}
          </div>
        </div>
      </div>
    </div>
  );
}