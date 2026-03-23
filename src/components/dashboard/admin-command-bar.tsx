"use client";

import { Bot, Globe2, Mail, MoonStar, SunMedium } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";

type AdminCommandBarProps = {
  countryCode?: string;
  language?: string;
};

export function AdminCommandBar({
  countryCode = "KE",
  language = "English",
}: AdminCommandBarProps) {
  const [theme, setTheme] = useState<"dark" | "light">("light");

  useEffect(() => {
    const root = document.documentElement;
    const stored = localStorage.getItem("theme");

    if (stored === "light" || stored === "dark") {
      setTheme(stored);
      root.classList.toggle("dark", stored === "dark");
      return;
    }

    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const initial = prefersDark ? "dark" : "light";
    setTheme(initial);
    root.classList.toggle("dark", initial === "dark");
  }, []);

  function toggleTheme() {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    document.documentElement.classList.toggle("dark", next === "dark");
    localStorage.setItem("theme", next);
  }

  return (
    <div className="glass-strong flex min-h-[56px] flex-wrap items-center gap-2 rounded-[var(--radius-xl)] px-3 py-2 xl:px-4">
      <div className="inline-flex h-10 items-center rounded-2xl border border-[var(--border)] bg-[var(--surface-2)] px-3 text-xs font-medium text-[var(--text-main)]">
        <span className="mr-2 text-base leading-none">
          {countryCode === "KE" ? "🇰🇪" : "🌍"}
        </span>
        {countryCode}
      </div>

      <Button variant="secondary" size="sm" className="rounded-2xl">
        <Globe2 className="mr-2 h-4 w-4" />
        {language}
      </Button>

      <Button
        variant="secondary"
        size="sm"
        className="rounded-2xl"
        onClick={toggleTheme}
      >
        {theme === "dark" ? (
          <>
            <SunMedium className="mr-2 h-4 w-4" />
            Light
          </>
        ) : (
          <>
            <MoonStar className="mr-2 h-4 w-4" />
            Dark
          </>
        )}
      </Button>

      <Button variant="secondary" size="sm" className="rounded-2xl">
        <Mail className="mr-2 h-4 w-4" />
        Messaging
      </Button>

      <Button size="sm" className="rounded-2xl">
        <Bot className="mr-2 h-4 w-4" />
        Skuully AI
      </Button>
    </div>
  );
}