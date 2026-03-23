export function AuthBackground() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 overflow-hidden"
    >
      {/* Base */}
      <div className="absolute inset-0 bg-[var(--hero-gradient)]" />

      {/* Large ambient top wash */}
      <div className="absolute left-1/2 top-[-22rem] h-[44rem] w-[88rem] -translate-x-1/2 rounded-full bg-[radial-gradient(ellipse_at_center,rgba(88,110,255,0.26)_0%,rgba(104,83,214,0.18)_34%,rgba(165,94,149,0.10)_56%,transparent_76%)] blur-[120px]" />

      {/* Left cinematic wash */}
      <div className="absolute left-[-18rem] top-[6rem] h-[34rem] w-[46rem] rotate-[-12deg] bg-[linear-gradient(135deg,rgba(54,97,225,0.16),rgba(88,66,171,0.10),transparent_72%)] blur-[120px]" />

      {/* Right cinematic wash */}
      <div className="absolute right-[-16rem] top-[4rem] h-[30rem] w-[42rem] rotate-[14deg] bg-[linear-gradient(225deg,rgba(88,66,171,0.16),rgba(198,38,74,0.08),transparent_72%)] blur-[120px]" />

      {/* Bottom magenta field */}
      <div className="absolute bottom-[-12rem] left-[8%] h-[26rem] w-[38rem] rotate-[8deg] bg-[linear-gradient(135deg,rgba(198,38,74,0.12),rgba(165,94,149,0.10),transparent_75%)] blur-[130px]" />

      {/* Bottom-right blue/cyan lift */}
      <div className="absolute bottom-[0%] right-[2%] h-[20rem] w-[32rem] rotate-[-10deg] bg-[linear-gradient(135deg,rgba(59,180,229,0.08),rgba(54,97,225,0.10),transparent_72%)] blur-[120px]" />

      {/* Soft center veil */}
      <div className="absolute left-1/2 top-[16%] h-[22rem] w-[64rem] -translate-x-1/2 rounded-full bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.045),rgba(142,156,255,0.08),rgba(255,255,255,0.03),transparent)] blur-[90px] opacity-80" />

      {/* Fine grid */}
      <div className="absolute inset-0 opacity-[0.035] [background-image:linear-gradient(rgba(255,255,255,0.07)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.07)_1px,transparent_1px)] [background-size:56px_56px]" />

      {/* Subtle noise replacement layer */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.035),transparent_22%),radial-gradient(circle_at_80%_30%,rgba(255,255,255,0.025),transparent_18%),radial-gradient(circle_at_40%_75%,rgba(255,255,255,0.02),transparent_20%)]" />

      {/* Edge vignette */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_38%,rgba(4,7,20,0.20)_74%,rgba(2,4,12,0.42)_100%)]" />
    </div>
  );
}