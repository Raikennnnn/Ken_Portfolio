import type { Metadata } from "next";
import "./globals.css";
import { meta } from "@/content/data";
import { CursorProvider } from "@/components/CursorProvider";

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
    <html lang="en" className="dark">
      <head>
        <link
          rel="preconnect"
          href="https://fonts.googleapis.com"
        />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Chakra+Petch:ital,wght@0,300;0,400;0,500;0,600;0,700;1,400&family=JetBrains+Mono:ital,wght@0,300;0,400;0,500;0,600;1,400&family=Manrope:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <CursorProvider>
          {/* Ambient grid background */}
          <div className="grid-bg" aria-hidden />
          {/* Cursor-following glow */}
          <div className="cursor-glow" aria-hidden />
          {/* Main content */}
          <div className="relative z-10">{children}</div>
        </CursorProvider>
      </body>
    </html>
  );
}
