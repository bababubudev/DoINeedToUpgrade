import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";
import { fetchGameDetails } from "@/lib/fetchGameDetails";
import { GameRequirements } from "@/types";
import {
  Constellation,
  GridBg,
  Glow,
  Logo,
  IconCPU,
  IconGPU,
  IconRAM,
  IconDisk,
  getOgFonts,
} from "@/lib/og";

const ICON_FOR: Record<
  string,
  (p: { size?: number; color?: string }) => JSX.Element
> = {
  CPU: IconCPU,
  GPU: IconGPU,
  RAM: IconRAM,
  Disk: IconDisk,
};

function shortenSpec(s: string | null | undefined, max = 32) {
  if (!s) return "Not specified";
  const t = s.replace(/\s+/g, " ").trim();
  return t.length > max ? t.slice(0, max - 1) + "…" : t;
}

function rowsFor(reqs: GameRequirements | null) {
  return [
    { label: "CPU", value: shortenSpec(reqs?.cpu) },
    { label: "GPU", value: shortenSpec(reqs?.gpu) },
    { label: "RAM", value: shortenSpec(reqs?.ram, 22) },
    { label: "Disk", value: shortenSpec(reqs?.storage, 22) },
  ];
}

export async function GET(request: NextRequest) {
  const appid = request.nextUrl.searchParams.get("appid");
  if (!appid) return new Response("Missing appid", { status: 400 });

  const game = await fetchGameDetails(appid);
  if (!game) return new Response("Game not found", { status: 404 });

  const minRows = rowsFor(game.requirements.minimum);
  const recRows = rowsFor(game.requirements.recommended);
  const gameLabel =
    game.name.length > 32 ? game.name.slice(0, 30) + "…" : game.name;
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
        <GridBg tight />
        <Glow
          width={500}
          height={500}
          top={-260}
          right={-280}
          color="rgba(248,113,113,0.09)"
        />
        <Glow
          width={460}
          height={460}
          bottom={-220}
          left={-240}
          color="rgba(96,165,250,0.10)"
        />

        <div
          style={{
            position: "relative",
            width: "100%",
            height: "100%",
            padding: "44px 60px",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 22,
            }}
          >
            <Logo />
            <div
              style={{
                fontFamily: "monospace",
                fontSize: 14,
                color: "#94a3b8",
                letterSpacing: 1.2,
                display: "flex",
              }}
            >
              COMPARISON · {gameLabel.toUpperCase()}
            </div>
          </div>

          <div
            style={{
              display: "flex",
              fontSize: 56,
              fontWeight: 900,
              letterSpacing: "-0.025em",
              lineHeight: 1.05,
              color: "#F1F5F9",
              marginBottom: 22,
            }}
          >
            Can your PC run {gameLabel}?
          </div>

          <div
            style={{
              flex: 1,
              display: "flex",
              alignItems: "stretch",
              gap: 24,
            }}
          >
            <div
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                background: "rgba(36,43,51,0.7)",
                border: "1px solid rgba(96,165,250,0.3)",
                borderRadius: 14,
                padding: "18px 22px",
              }}
            >
              <div
                style={{
                  fontFamily: "monospace",
                  fontSize: 13,
                  color: "#60A5FA",
                  letterSpacing: 1.4,
                  marginBottom: 10,
                  display: "flex",
                }}
              >
                MINIMUM
              </div>
              {minRows.map((r) => {
                const Icon = ICON_FOR[r.label];
                return (
                  <div
                    key={r.label}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      padding: "8px 0",
                      borderBottom: "1px solid rgba(148,163,184,0.1)",
                    }}
                  >
                    <Icon size={18} color="#94a3b8" />
                    <div
                      style={{
                        display: "flex",
                        fontSize: 14,
                        color: "#94a3b8",
                        fontWeight: 600,
                        width: 46,
                      }}
                    >
                      {r.label}
                    </div>
                    <div
                      style={{
                        display: "flex",
                        fontSize: 16,
                        color: "#F1F5F9",
                        fontWeight: 600,
                        flex: 1,
                      }}
                    >
                      {r.value}
                    </div>
                  </div>
                );
              })}
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <div
                style={{
                  fontFamily: "monospace",
                  width: 48,
                  height: 48,
                  borderRadius: 9999,
                  background: "rgba(15,20,28,0.9)",
                  border: "1px solid rgba(148,163,184,0.3)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 14,
                  fontWeight: 700,
                  color: "#94a3b8",
                  letterSpacing: 1,
                }}
              >
                VS
              </div>
            </div>

            <div
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                background: "rgba(36,43,51,0.7)",
                border: "1px solid rgba(251,191,36,0.32)",
                borderRadius: 14,
                padding: "18px 22px",
              }}
            >
              <div
                style={{
                  fontFamily: "monospace",
                  fontSize: 13,
                  color: "#FBBF24",
                  letterSpacing: 1.4,
                  marginBottom: 10,
                  display: "flex",
                }}
              >
                RECOMMENDED
              </div>
              {recRows.map((r) => {
                const Icon = ICON_FOR[r.label];
                return (
                  <div
                    key={r.label}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      padding: "8px 0",
                      borderBottom: "1px solid rgba(148,163,184,0.1)",
                    }}
                  >
                    <Icon size={18} color="#94a3b8" />
                    <div
                      style={{
                        display: "flex",
                        fontSize: 14,
                        color: "#94a3b8",
                        fontWeight: 600,
                        width: 46,
                      }}
                    >
                      {r.label}
                    </div>
                    <div
                      style={{
                        display: "flex",
                        fontSize: 16,
                        color: "#F1F5F9",
                        fontWeight: 600,
                        flex: 1,
                      }}
                    >
                      {r.value}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginTop: 18,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                background: "rgba(56,189,248,0.14)",
                border: "1px solid rgba(56,189,248,0.4)",
                color: "#bae6fd",
                fontWeight: 700,
                fontSize: 17,
                padding: "10px 18px",
                borderRadius: 999,
              }}
            >
              <div
                style={{
                  display: "flex",
                  width: 8,
                  height: 8,
                  borderRadius: 4,
                  background: "#38BDF8",
                  boxShadow: "0 0 12px #38BDF8",
                }}
              />
              <div style={{ display: "flex" }}>
                Check yours at doineedtoupgrade.com
              </div>
            </div>
            <div
              style={{
                fontFamily: "monospace",
                fontSize: 15,
                color: "#64748b",
                display: "flex",
              }}
            >
              doineedtoupgrade.com
            </div>
          </div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
      fonts: fonts.length > 0 ? fonts : undefined,
    }
  );
}
