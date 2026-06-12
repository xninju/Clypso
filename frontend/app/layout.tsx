import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://clypso.qzz.io";

export const viewport: Viewport = {
  themeColor: "#ff0000",
  colorScheme: "dark",
};

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Clypso — Download YouTube Videos, Shorts, Playlists & Instagram Reels Free",
    template: "%s | Clypso",
  },
  description:
    "Clypso is a free online downloader for YouTube videos, Shorts, Playlists and Instagram Reels, Posts and Carousels. No login required, no watermark, HD quality.",
  keywords: [
    "youtube downloader",
    "download youtube video",
    "download youtube shorts",
    "download youtube playlist",
    "instagram reel downloader",
    "instagram video downloader",
    "download instagram reels",
    "download instagram posts",
    "free video downloader",
    "online video downloader",
    "HD video downloader",
    "no watermark downloader",
    "clypso",
  ],
  authors: [{ name: "Clypso" }],
  creator: "Clypso",
  publisher: "Clypso",
  category: "Technology",
  applicationName: "Clypso",
  generator: "Next.js",
  referrer: "origin-when-cross-origin",
  robots: {
    index: true,
    follow: true,
    nocache: false,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  alternates: {
    canonical: SITE_URL,
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: SITE_URL,
    siteName: "Clypso",
    title: "Clypso — Free YouTube & Instagram Downloader",
    description:
      "Download YouTube videos, Shorts, Playlists and Instagram Reels for free. No login, no watermark, high quality.",
    images: [
      {
        url: `${SITE_URL}/og-image.png`,
        width: 1200,
        height: 630,
        alt: "Clypso — Free YouTube & Instagram Downloader",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Clypso — Free YouTube & Instagram Downloader",
    description:
      "Download YouTube videos, Shorts, Playlists and Instagram Reels for free. No login, no watermark.",
    images: [`${SITE_URL}/og-image.png`],
    creator: "@clypso",
  },
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
  manifest: "/site.webmanifest",
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_VERIFICATION || "",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="dns-prefetch" href="https://img.youtube.com" />
        <link rel="dns-prefetch" href="https://www.instagram.com" />
      </head>
      <body className={`${inter.className} bg-[#0f0f0f] text-[#f1f1f1] min-h-screen`}>
        {children}
      </body>
    </html>
  );
}
