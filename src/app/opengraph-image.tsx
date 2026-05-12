import { ImageResponse } from "next/og";
import {
  Constellation,
  GridBg,
  Glow,
  Logo,
  IconCheck,
  IconCPU,
  IconGPU,
  IconRAM,
  IconDisk,
  getOgFonts,
} from "@/lib/og";

export const alt = "Do I Need To Upgrade. Check if your PC can run any Steam game.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const SPEC_ROWS = [
  { Icon: IconCPU, label: "CPU", value: "i7-12700K" },
  { Icon: IconGPU, label: "GPU", value: "RTX 4070" },
  { Icon: IconRAM, label: "RAM", value: "32 GB" },
  { Icon: IconDisk, label: "Disk", value: "70 GB free" },
];

export default async function Image() {
  const fonts = await getOgFonts();
  return new ImageResponse(
    (
      <div
        style={{
          background: "#1A1F26",
          width: "100%",
          height: "100%",
          position: "relative",
          display: "flex",
          fontFamily: "Montserrat, sans-serif",
          color: "#E5E7EB",
        }}
      >
        <Constellation lineAlpha={0.13} particleAlpha={0.4} />
        <GridBg />
        <Glow
          width={520}
          height={520}
          top={-260}
          left={-300}
          color="rgba(96,165,250,0.12)"
        />
        <Glow
          width={380}
          height={380}
          bottom={-200}
          right={-180}
          color="rgba(74,222,128,0.10)"
        />

        <div
          style={{
            position: "relative",
            width: "100%",
            height: "100%",
            padding: "56px 60px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
          }}
        >
          <Logo />

          <div style={{ display: "flex", alignItems: "center", gap: 48 }}>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                flex: 1,
              }}
            >
              <div
                style={{
                  fontSize: 22,
                  color: "#94a3b8",
                  fontWeight: 500,
                  marginBottom: 12,
                  letterSpacing: 0.4,
                  display: "flex",
                }}
              >
                Before you buy that GPU…
              </div>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  fontSize: 76,
                  fontWeight: 900,
                  lineHeight: 1.02,
                  letterSpacing: "-0.025em",
                  color: "#F1F5F9",
                }}
              >
                <div style={{ display: "flex" }}>Do I Need</div>
                <div style={{ display: "flex" }}>
                  <span style={{ display: "flex" }}>To&nbsp;</span>
                  <span
                    style={{
                      display: "flex",
                      background:
                        "linear-gradient(90deg, #60A5FA, #38BDF8 60%, #4ADE80)",
                      backgroundClip: "text",
                      color: "transparent",
                    }}
                  >
                    Upgrade?
                  </span>
                </div>
              </div>
              <div
                style={{
                  fontSize: 22,
                  color: "#cbd5e1",
                  marginTop: 18,
                  lineHeight: 1.4,
                  maxWidth: 460,
                  display: "flex",
                }}
              >
                Compare your PC against any Steam game&apos;s requirements,
                instantly.
              </div>
            </div>

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                flex: 1,
                background: "rgba(36, 43, 51, 0.85)",
                border: "1px solid rgba(148,163,184,0.22)",
                borderRadius: 16,
                padding: "20px 22px",
                boxShadow:
                  "0 30px 80px -20px rgba(0,0,0,0.55), 0 0 0 1px rgba(56,189,248,0.05)",
                transform: "rotate(-1.5deg)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  marginBottom: 14,
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="https://cdn.cloudflare.steamstatic.com/steam/apps/1091500/header.jpg"
                  alt="Cyberpunk 2077"
                  width={46}
                  height={46}
                  style={{
                    width: 46,
                    height: 46,
                    borderRadius: 8,
                    objectFit: "cover",
                    border: "1px solid rgba(148,163,184,0.25)",
                  }}
                />
                <div style={{ display: "flex", flexDirection: "column" }}>
                  <div
                    style={{
                      fontSize: 13,
                      color: "#94a3b8",
                      fontWeight: 500,
                      display: "flex",
                    }}
                  >
                    Checking
                  </div>
                  <div
                    style={{
                      fontSize: 19,
                      fontWeight: 700,
                      color: "#E5E7EB",
                      display: "flex",
                    }}
                  >
                    Cyberpunk 2077
                  </div>
                </div>
              </div>

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  background: "rgba(74,222,128,0.18)",
                  border: "1px solid rgba(74,222,128,0.45)",
                  borderRadius: 10,
                  padding: "12px 14px",
                  marginBottom: 14,
                }}
              >
                <IconCheck size={22} color="#4ADE80" />
                <div
                  style={{
                    fontWeight: 700,
                    fontSize: 17,
                    color: "#bbf7d0",
                    display: "flex",
                  }}
                >
                  You&apos;re good to go: meets recommended
                </div>
              </div>

              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 8,
                }}
              >
                {SPEC_ROWS.map(({ Icon, label, value }) => (
                  <div
                    key={label}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 14,
                      fontSize: 15,
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        color: "#94a3b8",
                        fontWeight: 600,
                        width: 80,
                      }}
                    >
                      <Icon size={18} color="#94a3b8" />
                      <div style={{ display: "flex" }}>{label}</div>
                    </div>
                    <div
                      style={{
                        display: "flex",
                        color: "#E5E7EB",
                        fontWeight: 500,
                        flex: 1,
                      }}
                    >
                      {value}
                    </div>
                    <IconCheck size={18} color="#4ADE80" />
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div
            style={{
              fontFamily: "monospace",
              fontSize: 18,
              color: "#64748b",
              letterSpacing: 0.6,
              display: "flex",
            }}
          >
            doineedtoupgrade.com
          </div>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: fonts.length > 0 ? fonts : undefined,
    }
  );
}
