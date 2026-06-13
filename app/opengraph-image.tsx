import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Clypso — Free YouTube, Instagram, Facebook & TikTok Video Downloader";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OgImage() {
  const base = process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : "http://localhost:3000";

  const imageData = await fetch(`${base}/og-source.jpg`);
  const arrayBuffer = await imageData.arrayBuffer();

  return new ImageResponse(
    (
      <div
        style={{
          width: "1200px",
          height: "630px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "sans-serif",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Background image */}
        <img
          src={`data:image/jpeg;base64,${Buffer.from(arrayBuffer).toString("base64")}`}
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "1200px",
            height: "630px",
            objectFit: "cover",
          }}
        />

        {/* Dark overlay */}
        <div
          style={{
            position: "absolute",
            top: 0, left: 0, right: 0, bottom: 0,
            background: "rgba(0,0,0,0.72)",
            display: "flex",
          }}
        />

        {/* Top accent line */}
        <div
          style={{
            position: "absolute",
            top: 0, left: 0, right: 0,
            height: "4px",
            background: "linear-gradient(90deg, #ff0000, #e1306c, #ff1744, #0062ff)",
            display: "flex",
          }}
        />

        {/* Badge */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            background: "rgba(255,255,255,0.06)",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: "100px",
            padding: "8px 20px",
            marginBottom: "32px",
            zIndex: 1,
          }}
        >
          <div
            style={{
              width: "8px", height: "8px",
              borderRadius: "50%",
              background: "#22c55e",
              display: "flex",
            }}
          />
          <span style={{ color: "#aaa", fontSize: "18px", letterSpacing: "0.08em" }}>
            FREE · NO LOGIN · NO WATERMARK
          </span>
        </div>

        {/* Main headline */}
        <div
          style={{
            display: "flex",
            flexDirection: "row",
            alignItems: "baseline",
            gap: "20px",
            marginBottom: "20px",
            zIndex: 1,
          }}
        >
          <span
            style={{
              fontSize: "80px",
              fontWeight: 800,
              color: "#f1f1f1",
              lineHeight: 1.1,
              letterSpacing: "-0.02em",
            }}
          >
            Save any video.
          </span>
          <span
            style={{
              fontSize: "80px",
              fontWeight: 800,
              color: "#ff0000",
              lineHeight: 1.1,
              letterSpacing: "-0.02em",
            }}
          >
            Free.
          </span>
        </div>

        {/* Sub-headline */}
        <div
          style={{
            fontSize: "26px",
            color: "#aaaaaa",
            textAlign: "center",
            maxWidth: "800px",
            lineHeight: 1.5,
            marginBottom: "48px",
            display: "flex",
            zIndex: 1,
          }}
        >
          Download YouTube, Instagram, Facebook & TikTok videos in HD. No app, no account needed.
        </div>

        {/* Platform pills */}
        <div style={{ display: "flex", gap: "14px", zIndex: 1 }}>

          {/* YouTube */}
          <div
            style={{
              display: "flex", alignItems: "center", gap: "10px",
              background: "rgba(255,0,0,0.12)",
              border: "1px solid rgba(255,0,0,0.3)",
              borderRadius: "100px", padding: "12px 24px",
            }}
          >
            <div style={{ width: "20px", height: "20px", background: "#ff0000", borderRadius: "4px", display: "flex" }} />
            <span style={{ color: "#ff6b6b", fontSize: "20px", fontWeight: 600 }}>YouTube</span>
          </div>

          {/* Instagram */}
          <div
            style={{
              display: "flex", alignItems: "center", gap: "10px",
              background: "rgba(225,48,108,0.12)",
              border: "1px solid rgba(225,48,108,0.3)",
              borderRadius: "100px", padding: "12px 24px",
            }}
          >
            <div style={{ width: "20px", height: "20px", background: "#e1306c", borderRadius: "4px", display: "flex" }} />
            <span style={{ color: "#e1306c", fontSize: "20px", fontWeight: 600 }}>Instagram</span>
          </div>

          {/* Facebook */}
          <div
            style={{
              display: "flex", alignItems: "center", gap: "10px",
              background: "rgba(24,119,242,0.12)",
              border: "1px solid rgba(24,119,242,0.3)",
              borderRadius: "100px", padding: "12px 24px",
            }}
          >
            <div style={{ width: "20px", height: "20px", background: "#1877f2", borderRadius: "4px", display: "flex" }} />
            <span style={{ color: "#4d9ff5", fontSize: "20px", fontWeight: 600 }}>Facebook</span>
          </div>

          {/* TikTok */}
          <div
            style={{
              display: "flex", alignItems: "center", gap: "10px",
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.15)",
              borderRadius: "100px", padding: "12px 24px",
            }}
          >
            <div style={{ width: "20px", height: "20px", background: "#ffffff", borderRadius: "4px", display: "flex" }} />
            <span style={{ color: "#ffffff", fontSize: "20px", fontWeight: 600 }}>TikTok</span>
          </div>

        </div>

        {/* Bottom domain */}
        <div
          style={{
            position: "absolute",
            bottom: "32px",
            display: "flex",
            color: "#555",
            fontSize: "18px",
            letterSpacing: "0.05em",
            zIndex: 1,
          }}
        >
          clypso.qzz.io
        </div>

      </div>
    ),
    { ...size }
  );
}