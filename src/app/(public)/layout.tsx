import { PublicOnlyGuard } from "@/components/auth/guards/public-guard";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <PublicOnlyGuard>{children}</PublicOnlyGuard>;
}