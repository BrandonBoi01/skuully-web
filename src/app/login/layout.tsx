import { RouteGuard } from "@/components/auth/route-guard";

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RouteGuard
      mode="guest-only"
      loadingTitle="Checking sign-in state..."
      loadingSubtitle="Making sure you are in the right place."
    >
      {children}
    </RouteGuard>
  );
}