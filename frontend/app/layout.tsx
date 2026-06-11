import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Clypso — Download YouTube & Instagram",
  description: "Clypso lets you download YouTube videos, Shorts, Playlists and Instagram Reels, Posts, Carousels for free. No login, no watermark.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} bg-[#0f0f0f] text-[#f1f1f1] min-h-screen`}>
        {children}
      </body>
    </html>
  );
}
