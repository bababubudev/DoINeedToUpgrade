import { NextRequest, NextResponse } from "next/server";
import { igdbFetch } from "@/lib/igdb";
import { GameSource } from "@/types";

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q");
  const source = (request.nextUrl.searchParams.get("source") || "steam") as GameSource;

  if (!q) {
    return NextResponse.json({ items: [] });
  }

  if (source === "igdb") {
    return searchIGDB(q);
  }

  return searchSteam(q);
}

async function searchSteam(q: string) {
  try {
    const res = await fetch(
      `https://store.steampowered.com/api/storesearch/?term=${encodeURIComponent(q)}&l=english&cc=US`,
      { cache: "force-cache" } as RequestInit
    );

    if (!res.ok) {
      return NextResponse.json({ error: "Steam API error" }, { status: 502 });
    }

    const data = await res.json();
    const items = (data.items || []).map(
      (item: { id: number; name: string; tiny_image: string }) => ({
        id: item.id,
        name: item.name,
        tiny_image: item.tiny_image,
        source: "steam" as const,
      })
    );

    return NextResponse.json({ items });
  } catch {
    return NextResponse.json({ error: "Failed to search" }, { status: 500 });
  }
}

interface IGDBGame {
  id: number;
  name: string;
  category?: number;
  version_parent?: number;
  parent_game?: number;
  cover?: { image_id: string };
}

async function searchIGDB(q: string) {
  try {
    const res = await igdbFetch(
      "games",
      `search "${q.replace(/"/g, '\\"')}"; fields name,category,version_parent,parent_game,cover.image_id; limit 20;`
    );

    if (!res.ok) {
      return NextResponse.json({ error: "IGDB API error" }, { status: 502 });
    }

    const data: IGDBGame[] = await res.json();
    // Filter to base games only:
    // - category 0 (main game, omitted in protobuf when default)
    // - no version_parent (editions like Deluxe, Collector's, GOTY)
    // - no parent_game (DLCs, seasons, mods, expansions)
    const items = data
      .filter((game) =>
        (game.category ?? 0) === 0 &&
        !game.version_parent &&
        !game.parent_game
      )
      .slice(0, 10)
      .map((game) => ({
        id: game.id,
        name: game.name,
        tiny_image: game.cover?.image_id
          ? `https://images.igdb.com/igdb/image/upload/t_thumb/${game.cover.image_id}.png`
          : "",
        source: "igdb" as const,
      }));

    return NextResponse.json({ items });
  } catch {
    return NextResponse.json({ error: "Failed to search IGDB" }, { status: 500 });
  }
}
