type FloatingNoticeProps = {
  show: boolean;
  message: string;
  tone?: "default" | "success" | "error";
  position?: "bottom-left" | "top-right";
};

export function FloatingNotice({
  show,
  message,
  tone = "default",
  position = "bottom-left",
}: FloatingNoticeProps) {
  if (!show || !message) return null;

  const toneClass =
    tone === "success"
      ? "border-emerald-500/20 bg-emerald-500/12 text-emerald-700 dark:text-emerald-300"
      : tone === "error"
      ? "border-rose-500/20 bg-rose-500/12 text-rose-700 dark:text-rose-300"
      : "border-[var(--border)] bg-[var(--surface-1)] text-[var(--text-main)]";

  const positionClass =
    position === "top-right"
      ? "right-4 top-4 sm:right-6 sm:top-6"
      : "bottom-4 left-4 sm:bottom-6 sm:left-6";

  return (
    <div
      className={[
        "glass-strong ticker-slide fixed z-[100] max-w-sm rounded-[var(--radius-xl)] px-4 py-3 text-sm shadow-[var(--elev-shadow-lg)]",
        positionClass,
        toneClass,
      ].join(" ")}
    >
      {message}
    </div>
  );
}