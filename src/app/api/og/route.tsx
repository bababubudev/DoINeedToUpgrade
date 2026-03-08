import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";
import { fetchGameDetails } from "@/lib/fetchGameDetails";

export const runtime = "edge";

export async function GET(request: NextRequest) {
  const appid = request.nextUrl.searchParams.get("appid");
  if (!appid) return new Response("Missing appid", { status: 400 });

  const game = await fetchGameDetails(appid);
  if (!game) return new Response("Game not found", { status: 404 });

  const reqs = game.requirements.recommended ?? game.requirements.minimum;

  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          width: "100%",
          height: "100%",
          backgroundColor: "#1d232a",
          color: "#a6adbb",
          fontFamily: "sans-serif",
          padding: "60px",
        }}
      >
        <div
          style={{
            display: "flex",
            fontSize: "28px",
            color: "#888",
            marginBottom: "16px",
          }}
        >
          Do I Need An Upgrade?
        </div>
        <div
          style={{
            display: "flex",
            fontSize: "52px",
            fontWeight: "bold",
            color: "#fff",
            textAlign: "center",
            lineHeight: 1.2,
            marginBottom: "40px",
          }}
        >
          Can I Run {game.name}?
        </div>
        {reqs && (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "12px",
              fontSize: "24px",
              color: "#a6adbb",
            }}
          >
            {reqs.gpu && <div style={{ display: "flex" }}>GPU: {reqs.gpu}</div>}
            {reqs.cpu && <div style={{ display: "flex" }}>CPU: {reqs.cpu}</div>}
            {reqs.ram && <div style={{ display: "flex" }}>RAM: {reqs.ram}</div>}
          </div>
        )}
      </div>
    ),
    { width: 1200, height: 630 }
  );
}
