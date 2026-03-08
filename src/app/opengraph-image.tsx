import { ImageResponse } from "next/og";

export const runtime = "edge";

export const alt = "Do I Need An Upgrade - Check if your PC can run any Steam game";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: "#1d232a",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "sans-serif",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Grid pattern background */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            backgroundImage:
              "linear-gradient(rgba(148,163,184,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(148,163,184,0.06) 1px, transparent 1px)",
            backgroundSize: "45px 45px",
          }}
        />

        {/* Accent glow */}
        <div
          style={{
            position: "absolute",
            width: 500,
            height: 500,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(56,189,248,0.12) 0%, transparent 70%)",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            display: "flex",
          }}
        />

        {/* Title */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 20,
            position: "relative",
          }}
        >
          <div
            style={{
              fontSize: 64,
              fontWeight: 800,
              color: "#e2e8f0",
              letterSpacing: "-0.02em",
              display: "flex",
            }}
          >
            Do I Need An Upgrade
          </div>
          <div
            style={{
              fontSize: 28,
              color: "#94a3b8",
              display: "flex",
            }}
          >
            Check if your PC can run any Steam game
          </div>

          {/* Feature pills */}
          <div
            style={{
              display: "flex",
              gap: 16,
              marginTop: 24,
            }}
          >
            {["CPU", "GPU", "RAM", "Storage"].map((item) => (
              <div
                key={item}
                style={{
                  background: "rgba(56,189,248,0.1)",
                  border: "1px solid rgba(56,189,248,0.25)",
                  borderRadius: 999,
                  padding: "10px 28px",
                  fontSize: 22,
                  color: "#38bdf8",
                  display: "flex",
                }}
              >
                {item}
              </div>
            ))}
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
