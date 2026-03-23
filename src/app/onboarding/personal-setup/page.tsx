"use client";

export default function PersonalSetupPage() {
  return (
    <div className="min-h-screen bg-[var(--surface-0)] text-[var(--foreground)]">
      <div className="mx-auto flex min-h-screen max-w-3xl items-center justify-center px-4">
        <div className="glass-strong w-full rounded-[28px] border border-[var(--border)] p-8">
          <h1 className="text-2xl font-semibold text-[var(--text-strong)]">
            Personal setup
          </h1>
          <p className="mt-2 text-sm text-[var(--text-soft)]">
            This page is ready. Next we can build the full personal onboarding flow.
          </p>
        </div>
      </div>
    </div>
  );
}