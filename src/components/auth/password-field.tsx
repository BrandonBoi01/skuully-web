"use client";

import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

type PasswordFieldProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  autoComplete?: string;
  required?: boolean;
  invalid?: boolean;
  hint?: string;
};

export function PasswordField({
  label,
  value,
  onChange,
  placeholder,
  autoComplete,
  required = false,
  invalid = false,
  hint,
}: PasswordFieldProps) {
  const [revealed, setRevealed] = useState(false);

  return (
    <div>
      {label ? (
        <label className="mb-2 block text-sm font-medium text-[var(--text-main)]">
          {label}
        </label>
      ) : null}

      <div className="relative">
        <input
          className={cn(
            "h-12 w-full rounded-2xl border bg-[var(--surface-1)] px-4 pr-12 text-[15px] text-[var(--foreground)] outline-none transition",
            "placeholder:text-[var(--text-faint)]",
            "focus:border-[rgba(54,97,225,0.36)] focus:bg-[var(--surface-2)] focus:ring-4 focus:ring-[var(--ring)]",
            invalid
              ? "border-[rgba(198,38,74,0.45)]"
              : "border-[var(--border)]"
          )}
          type={revealed ? "text" : "password"}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          autoComplete={autoComplete}
          required={required}
        />

        <button
          type="button"
          onClick={() => setRevealed((prev) => !prev)}
          className="absolute right-2 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-[var(--text-soft)] transition hover:bg-[var(--secondary)] hover:text-[var(--text-main)]"
          aria-label={revealed ? "Hide password" : "Show password"}
        >
          {revealed ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>

      {hint ? (
        <p className="mt-2 text-xs text-[var(--text-soft)]">{hint}</p>
      ) : null}
    </div>
  );
}