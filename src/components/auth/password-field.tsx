"use client";

import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";

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
      <label className="mb-2 block text-sm text-white/70">{label}</label>

      <div className="relative">
        <input
          className={`w-full rounded-2xl border bg-white/[0.03] px-4 py-3.5 pr-12 text-white outline-none transition placeholder:text-white/25 focus:bg-white/[0.05] ${
            invalid
              ? "border-rose-400/45 focus:border-rose-400/60"
              : "border-white/10 focus:border-white/20"
          }`}
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
          className="absolute right-3 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-white/40 transition hover:bg-white/[0.06] hover:text-white/80"
          aria-label={revealed ? "Hide password" : "Show password"}
        >
          {revealed ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>

      {hint ? <p className="mt-2 text-xs text-white/40">{hint}</p> : null}
    </div>
  );
}