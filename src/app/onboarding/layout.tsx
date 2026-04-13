import { RouteGuard } from "@/components/auth/route-guard";

export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RouteGuard
      mode="onboarding-only"
      loadingTitle="Preparing onboarding..."
      loadingSubtitle="Checking your session and setup progress."
    >
      {children}
    </RouteGuard>
  );
}