export function AmbientBackground() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div className="absolute inset-0 bg-[#060816]" />

      <div className="ambient-a absolute left-[-10%] top-[-12%] h-[34rem] w-[34rem] rounded-full bg-[rgba(54,97,225,0.18)]" />
      <div className="ambient-b absolute right-[-8%] top-[8%] h-[30rem] w-[30rem] rounded-full bg-[rgba(88,66,171,0.18)]" />
      <div className="ambient-c absolute bottom-[-14%] left-[18%] h-[28rem] w-[28rem] rounded-full bg-[rgba(198,38,74,0.14)]" />
      <div className="ambient-b absolute bottom-[8%] right-[12%] h-[22rem] w-[22rem] rounded-full bg-[rgba(165,94,149,0.12)]" />

      <div className="ambient-a absolute left-[20%] top-[22%] h-[10rem] w-[32rem] rotate-[-12deg] rounded-full bg-[linear-gradient(90deg,transparent,rgba(54,97,225,0.16),transparent)] blur-3xl" />
      <div className="ambient-c absolute right-[10%] top-[42%] h-[8rem] w-[24rem] rotate-[18deg] rounded-full bg-[linear-gradient(90deg,transparent,rgba(165,94,149,0.14),transparent)] blur-3xl" />

      <div className="ambient-grid absolute inset-0 opacity-[0.07] [background-image:linear-gradient(rgba(255,255,255,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.08)_1px,transparent_1px)] [background-size:56px_56px]" />

      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_35%,rgba(2,6,23,0.45)_100%)]" />
    </div>
  );
}