import "./globals.css";
import { QueryProvider } from "@/components/providers/query-provider";
import { CursorOrb } from "@/components/effects/cursor-orb";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Skuully",
  description: "Skuully Command Center",
  icons: {
    icon: "/logo.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <CursorOrb />
        <QueryProvider>{children}</QueryProvider>
      </body>
    </html>
  );
}