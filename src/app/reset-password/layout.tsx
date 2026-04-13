import { RouteGuard } from "@/components/auth/route-guard";

export default function ResetPasswordLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RouteGuard
      mode="guest-only"
      loadingTitle="Checking reset session..."
      loadingSubtitle="Making sure password reset is available."
    >
      {children}
    </RouteGuard>
  );
}