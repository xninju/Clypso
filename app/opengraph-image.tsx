import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Clypso — Free YouTube, Instagram, Facebook & TikTok Video Downloader";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OgImage() {
  const imageData = await fetch("https://clypso.qzz.io/og-source.jpg");
  const arrayBuffer = await imageData.arrayBuffer();

  return new ImageResponse(
    (
      <img
        src={`data:image/jpeg;base64,${Buffer.from(arrayBuffer).toString("base64")}`}
        style={{ width: "1200px", height: "630px", objectFit: "cover" }}
      />
    ),
    { ...size }
  );
}