import * as React from "react";

import { cn } from "@/lib/utils";

function Input({
  className,
  type,
  ...props
}: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "h-11 w-full min-w-0 rounded-[calc(var(--radius)+2px)] border border-[var(--border)] bg-[var(--input)] px-3.5 py-2 text-sm text-[var(--foreground)] shadow-[var(--elev-shadow-xs)] transition-all duration-200 outline-none placeholder:text-[var(--text-faint)]",
        "backdrop-blur-xl hover:border-[rgba(var(--skuully-blue),0.18)] focus-visible:border-[rgba(var(--skuully-blue),0.4)] focus-visible:ring-4 focus-visible:ring-ring/50",
        "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
        "aria-invalid:border-[var(--destructive)] aria-invalid:ring-4 aria-invalid:ring-[rgba(198,38,74,0.15)]",
        className
      )}
      {...props}
    />
  );
}

export { Input };