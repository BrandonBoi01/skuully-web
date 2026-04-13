import { RouteGuard } from "@/components/auth/route-guard";

export default function RegisterLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RouteGuard
      mode="guest-only"
      loadingTitle="Checking sign-up state..."
      loadingSubtitle="Making sure you are in the right place."
    >
      {children}
    </RouteGuard>
  );
}