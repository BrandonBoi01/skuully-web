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
  const [theme, setTheme] = useState<"dark" | "light">("dark");

  useEffect(() => {
    const root = document.documentElement;
    const stored = localStorage.getItem("theme");

    if (stored === "light" || stored === "dark") {
      setTheme(stored);
      root.dataset.theme = stored;
      return;
    }

    root.dataset.theme = "dark";
  }, []);

  function toggleTheme() {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    document.documentElement.dataset.theme = next;
    localStorage.setItem("theme", next);
  }

  return (
    <div className="flex min-h-[52px] flex-wrap items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-3 py-2 backdrop-blur-xl xl:px-4">
      <div className="flex h-9 items-center rounded-xl border border-white/10 bg-white/5 px-3 text-xs text-white/70">
        <span className="mr-2 text-base leading-none">
          {countryCode === "KE" ? "🇰🇪" : "🌍"}
        </span>
        {countryCode}
      </div>

      <Button variant="secondary" size="sm" className="h-9 rounded-xl px-3">
        <Globe2 className="mr-2 h-4 w-4" />
        {language}
      </Button>

      <Button
        variant="secondary"
        size="sm"
        className="h-9 rounded-xl px-3"
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

      <Button variant="secondary" size="sm" className="h-9 rounded-xl px-3">
        <Mail className="mr-2 h-4 w-4" />
        Messaging
      </Button>

      <Button size="sm" className="h-9 rounded-xl px-3">
        <Bot className="mr-2 h-4 w-4" />
        Skuully AI
      </Button>
    </div>
  );
}