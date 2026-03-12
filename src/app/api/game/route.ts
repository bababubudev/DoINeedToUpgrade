import { NextRequest, NextResponse } from "next/server";
import { igdbFetch } from "@/lib/igdb";
import { fetchGameDetails } from "@/lib/fetchGameDetails";
import { fetchPCGWRequirements } from "@/lib/pcgamingwiki";
import { GameSource } from "@/types";

export async function GET(request: NextRequest) {
  const id = request.nextUrl.searchParams.get("appid") || request.nextUrl.searchParams.get("id");
  const source = (request.nextUrl.searchParams.get("source") || "steam") as GameSource;

  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  if (source === "igdb") {
    return fetchIGDBGame(id);
  }

  return fetchSteamGame(id);
}

async function fetchSteamGame(appid: string) {
  try {
    const game = await fetchGameDetails(appid);
    if (!game) {
      return NextResponse.json({ error: "Game not found" }, { status: 404 });
    }
    return NextResponse.json(game);
  } catch {
    return NextResponse.json({ error: "Failed to fetch game" }, { status: 500 });
  }
}

async function fetchIGDBGame(id: string) {
  try {
    // 1. Get game details from IGDB
    const igdbRes = await igdbFetch(
      "games",
      `fields name,cover.image_id,slug; where id = ${id};`
    );

    if (!igdbRes.ok) {
      return NextResponse.json({ error: "IGDB API error" }, { status: 502 });
    }

    const igdbData = await igdbRes.json();
    if (!igdbData.length) {
      return NextResponse.json({ error: "Game not found" }, { status: 404 });
    }

    const igdbGame = igdbData[0] as { id: number; name: string; cover?: { image_id: string }; slug?: string };

    // 2. Fetch requirements from PCGamingWiki
    const pcgwResult = await fetchPCGWRequirements(igdbGame.name);

    const platformRequirements = pcgwResult?.platformRequirements ?? {};
    const availablePlatforms = pcgwResult?.availablePlatforms ?? [];

    const requirements = platformRequirements.windows
      ?? platformRequirements[availablePlatforms[0]]
      ?? { minimum: null, recommended: null };

    const headerImage = igdbGame.cover?.image_id
      ? `https://images.igdb.com/igdb/image/upload/t_cover_big/${igdbGame.cover.image_id}.png`
      : "";

    return NextResponse.json({
      appid: igdbGame.id,
      name: igdbGame.name,
      headerImage,
      requirements,
      platformRequirements,
      availablePlatforms,
      source: "igdb" as const,
    });
  } catch {
    return NextResponse.json({ error: "Failed to fetch game" }, { status: 500 });
  }
}
