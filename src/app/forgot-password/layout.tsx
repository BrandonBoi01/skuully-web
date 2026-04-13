import { RouteGuard } from "@/components/auth/route-guard";

export default function ForgotPasswordLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RouteGuard
      mode="guest-only"
      loadingTitle="Checking account state..."
      loadingSubtitle="Making sure password recovery is available."
    >
      {children}
    </RouteGuard>
  );
}