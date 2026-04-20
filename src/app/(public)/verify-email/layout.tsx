import { RouteGuard } from "@/components/auth/guards/route-guard";

export default function VerifyEmailLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RouteGuard
      mode="verify-email-only"
      loadingTitle="Checking verification state..."
      loadingSubtitle="Making sure email verification is still required."
    >
      {children}
    </RouteGuard>
  );
}