import "./globals.css";
import type { Metadata } from "next";
import Script from "next/script";
import { QueryProvider } from "@/components/providers/query-provider";
import { CursorOrb } from "@/components/effects/cursor-orb";

export const metadata: Metadata = {
  title: {
    default: "Skuully",
    template: "%s | Skuully",
  },
  description: "Skuully command center for modern education.",
  applicationName: "Skuully",
  icons: {
    icon: [
      { url: "/favicon_io/favicon.ico" },
      { url: "/favicon_io/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon_io/favicon-16x16.png", sizes: "16x16", type: "image/png" },
    ],
    apple: [
      { url: "/favicon_io/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
    shortcut: ["/favicon_io/favicon.ico"],
  },
  manifest: "/favicon_io/site.webmanifest",
  openGraph: {
    title: "Skuully",
    description: "Skuully command center for modern education.",
    images: ["/logo.png"],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <Script id="skuully-theme-init" strategy="beforeInteractive">
          {`
            (function () {
              try {
                var stored = localStorage.getItem("theme");
                var systemDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
                var theme =
                  stored === "light" || stored === "dark"
                    ? stored
                    : (systemDark ? "dark" : "light");

                document.documentElement.classList.remove("light", "dark");
                document.documentElement.classList.add(theme);
              } catch (e) {
                document.documentElement.classList.remove("light");
                document.documentElement.classList.add("dark");
              }
            })();
          `}
        </Script>
      </head>
      <body suppressHydrationWarning>
        <CursorOrb />
        <QueryProvider>{children}</QueryProvider>
      </body>
    </html>
  );
}