import type { Metadata } from "next";
import "./globals.css";

/**
 * Root layout carries only the document shell and fonts. The storefront
 * chrome lives in (site) and the admin chrome in admin/(protected), so
 * neither leaks into the other.
 */
export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: {
    default: "Mello Studio — original visionary artwork",
    template: "%s — Mello Studio",
  },
  description:
    "Original psychedelic and visionary artwork by Mello, printed on cloth and paper in small runs.",
  openGraph: {
    type: "website",
    siteName: "Mello Studio",
    images: [{ url: "/brand/og-default.png", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    images: ["/brand/og-default.png"],
  },
  icons: {
    icon: [{ url: "/brand/icon-32.png", sizes: "32x32", type: "image/png" }],
    apple: [{ url: "/brand/icon-180.png", sizes: "180x180" }],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600&family=Karla:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-void">{children}</body>
    </html>
  );
}
