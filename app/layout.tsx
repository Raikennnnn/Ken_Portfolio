import type { Metadata, Viewport } from "next";
import "./globals.css";
import { meta } from "@/content/data";
import { themeInitScript } from "@/lib/theme";

export const metadata: Metadata = {
  title: meta.siteTitle,
  description: meta.siteDescription,
  icons: { icon: "/favicon.svg" },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0b" },
    { media: "(prefers-color-scheme: light)", color: "#f3f1ed" },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-theme="dark" suppressHydrationWarning>
      <head>
        {/* Apply the saved theme before first paint (no flash). */}
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500&family=IBM+Plex+Sans:wght@400;500;600&family=Shippori+Mincho:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        {/* CTF flag 1 of 5 lives in the page source. */}
        <div
          hidden
          dangerouslySetInnerHTML={{
            __html: "<!-- You read the source. flag{view_source_is_recon} . Four more: see #ctf -->",
          }}
        />
        <div className="grid-bg" aria-hidden />
        <div className="theme-scan theme-scan-a" aria-hidden />
        <div className="theme-scan theme-scan-b" aria-hidden />
        <div className="relative z-10">{children}</div>
      </body>
    </html>
  );
}
