import "./globals.css";
import type { Metadata } from "next";
import { QueryProvider } from "@/components/providers/query-provider";
import { CursorOrb } from "@/components/effects/cursor-orb";

export const metadata: Metadata = {
  title: {
    default: "Skuully",
    template: "%s | Skuully",
  },
  description: "Skuully command center for modern education.",
  icons: {
    icon: [
      { url: "/favicon_io/favicon.ico" },
      { url: "/favicon_io/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon_io/favicon-32x32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: [
      { url: "/favicon_io/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
    shortcut: ["/favicon_io/favicon.ico"],
  },
  manifest: "/favicon_io/site.webmanifest",
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