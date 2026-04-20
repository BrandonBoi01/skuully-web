import { OnboardingGuard } from "@/components/auth/guards/onboarding-guard";

export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <OnboardingGuard>{children}</OnboardingGuard>;
}