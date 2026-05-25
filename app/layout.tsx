import type { Metadata } from "next";
import "./globals.css";
import { meta } from "@/content/data";
import { ThemeProvider } from "@/components/ThemeProvider";

export const metadata: Metadata = {
  title: meta.siteTitle,
  description: meta.siteDescription,
  icons: { icon: "/favicon.svg" },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider>
          <div className="spotlight" aria-hidden />
          <div className="relative z-10">{children}</div>
        </ThemeProvider>
      </body>
    </html>
  );
}
