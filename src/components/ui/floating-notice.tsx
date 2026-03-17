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
      ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-100"
      : tone === "error"
      ? "border-rose-400/20 bg-rose-400/10 text-rose-100"
      : "border-white/10 bg-white/[0.06] text-white/85";

  const positionClass =
    position === "top-right"
      ? "right-4 top-4 sm:right-6 sm:top-6"
      : "bottom-4 left-4 sm:bottom-6 sm:left-6";

  return (
    <div
      className={`fixed z-[100] max-w-sm rounded-2xl border px-4 py-3 text-sm shadow-[0_16px_50px_rgba(0,0,0,0.35)] backdrop-blur-xl ${toneClass} ${positionClass}`}
    >
      {message}
    </div>
  );
}