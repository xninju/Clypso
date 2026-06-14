import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://clypso.qzz.io";

export const viewport: Viewport = {
  themeColor: "#ff0000",
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Clypso — Free Video Downloader | YouTube, Instagram, TikTok & Facebook",
    template: "%s | Clypso",
  },
  description:
    "Download YouTube videos, Instagram Reels, TikTok videos and Facebook videos in HD for free. No login, no watermark, no app install needed. Works on iPhone, Android & PC.",
  keywords: [
    "youtube downloader",
    "youtube video downloader",
    "download youtube video",
    "download youtube video free",
    "youtube shorts downloader",
    "download youtube shorts",
    "youtube playlist downloader",
    "download youtube playlist",
    "instagram downloader",
    "instagram reel downloader",
    "download instagram reels",
    "instagram video downloader",
    "tiktok downloader",
    "tiktok video downloader",
    "download tiktok videos",
    "tiktok no watermark",
    "facebook video downloader",
    "download facebook videos",
    "facebook reel downloader",
    "free video downloader",
    "online video downloader",
    "hd video downloader",
    "no watermark video downloader",
    "no login video downloader",
    "video downloader online",
    "save youtube video",
    "save instagram reel",
    "yt downloader",
    "ig downloader",
    "clypso",
    "clypso downloader",
  ],
  authors: [{ name: "Clypso", url: SITE_URL }],
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
    title: "Clypso — Free Video Downloader | YouTube, Instagram, TikTok & Facebook",
    description:
      "Download YouTube videos, Instagram Reels, TikTok videos and Facebook videos in HD for free. No login required, no watermark. Works on any device.",
    images: [
      {
        url: `/og-source.jpg`,
        width: 1362,
        height: 687,
        alt: "Clypso — Free Video Downloader for YouTube, Instagram, TikTok and Facebook",
        type: "image/jpeg",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Clypso — Free Video Downloader | YouTube, Instagram, TikTok & Facebook",
    description:
      "Download YouTube, Instagram, TikTok and Facebook videos in HD. Free, no login, no watermark.",
    images: [`/og-source.jpg`],
    creator: "@clypso",
    site: "@clypso",
  },
  icons: {
    icon: [{ url: "/logo.svg", type: "image/svg+xml" }],
    apple: "/logo.svg",
    shortcut: "/logo.svg",
  },
  manifest: "/site.webmanifest",
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_VERIFICATION || "",
  },
  other: {
    "mobile-web-app-capable": "yes",
    "apple-mobile-web-app-capable": "yes",
    "apple-mobile-web-app-status-bar-style": "black-translucent",
    "apple-mobile-web-app-title": "Clypso",
    "format-detection": "telephone=no",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://img.youtube.com" />
        <link rel="dns-prefetch" href="https://i.ytimg.com" />
        <link rel="dns-prefetch" href="https://www.instagram.com" />
        <link rel="dns-prefetch" href="https://api.microlink.io" />
      </head>
      <body className={`${inter.className} bg-[#0f0f0f] text-[#f1f1f1] min-h-screen`}>
        {children}
      </body>
    </html>
  );
}
