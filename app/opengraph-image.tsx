import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Clypso — Free YouTube & Instagram Video Downloader";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "1200px",
          height: "630px",
          background: "#0f0f0f",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "sans-serif",
          position: "relative",
        }}
      >
        {/* Top red accent line */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: "4px",
            background: "linear-gradient(90deg, #ff0000, #e1306c, #ff0000)",
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
          }}
        >
          <div
            style={{
              width: "8px",
              height: "8px",
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
            color: "#717171",
            textAlign: "center",
            maxWidth: "700px",
            lineHeight: 1.5,
            marginBottom: "48px",
            display: "flex",
          }}
        >
          Download YouTube & Instagram videos in HD. No app, no account needed.
        </div>

        {/* Platform pills */}
        <div style={{ display: "flex", gap: "16px" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              background: "rgba(255,0,0,0.12)",
              border: "1px solid rgba(255,0,0,0.3)",
              borderRadius: "100px",
              padding: "12px 28px",
            }}
          >
            <div
              style={{
                width: "20px",
                height: "20px",
                background: "#ff0000",
                borderRadius: "4px",
                display: "flex",
              }}
            />
            <span style={{ color: "#ff6b6b", fontSize: "22px", fontWeight: 600 }}>YouTube</span>
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              background: "rgba(225,48,108,0.12)",
              border: "1px solid rgba(225,48,108,0.3)",
              borderRadius: "100px",
              padding: "12px 28px",
            }}
          >
            <div
              style={{
                width: "20px",
                height: "20px",
                background: "#e1306c",
                borderRadius: "4px",
                display: "flex",
              }}
            />
            <span style={{ color: "#e1306c", fontSize: "22px", fontWeight: 600 }}>Instagram</span>
          </div>
        </div>

        {/* Bottom domain */}
        <div
          style={{
            position: "absolute",
            bottom: "32px",
            display: "flex",
            color: "#3a3a3a",
            fontSize: "18px",
            letterSpacing: "0.05em",
          }}
        >
          clypso.qzz.io
        </div>
      </div>
    ),
    { ...size }
  );
}
