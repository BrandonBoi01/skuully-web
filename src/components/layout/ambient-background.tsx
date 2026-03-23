export function AmbientBackground() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div className="absolute inset-0 bg-[var(--surface-0)]" />
      <div className="absolute inset-0 bg-[var(--hero-gradient)]" />

      <div className="ambient-a absolute left-[-10%] top-[-12%] h-[34rem] w-[34rem] rounded-full bg-[rgba(var(--skuully-blue),0.14)]" />
      <div className="ambient-b absolute right-[-8%] top-[8%] h-[30rem] w-[30rem] rounded-full bg-[rgba(var(--skuully-violet),0.14)]" />
      <div className="ambient-c absolute bottom-[-14%] left-[18%] h-[28rem] w-[28rem] rounded-full bg-[rgba(var(--skuully-magenta),0.12)]" />
      <div className="ambient-b absolute bottom-[8%] right-[12%] h-[22rem] w-[22rem] rounded-full bg-[rgba(var(--skuully-purple),0.10)]" />

      <div className="ambient-a absolute left-[20%] top-[22%] h-[10rem] w-[32rem] rotate-[-12deg] rounded-full bg-[linear-gradient(90deg,transparent,rgba(54,97,225,0.12),transparent)] blur-3xl" />
      <div className="ambient-c absolute right-[10%] top-[42%] h-[8rem] w-[24rem] rotate-[18deg] rounded-full bg-[linear-gradient(90deg,transparent,rgba(165,94,149,0.11),transparent)] blur-3xl" />

      <div className="ambient-grid absolute inset-0 opacity-[0.06]" />

      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_35%,rgba(2,6,23,0.18)_100%)] dark:bg-[radial-gradient(circle_at_center,transparent_35%,rgba(2,6,23,0.45)_100%)]" />
    </div>
  );
}