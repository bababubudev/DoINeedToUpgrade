import { NextRequest, NextResponse } from "next/server";
import { parseRequirements } from "@/lib/parseRequirements";
import { igdbFetch } from "@/lib/igdb";
import { Platform, ParsedGameRequirements, PlatformRequirements, GameRequirements, GameSource } from "@/types";

function hasContent(reqs: GameRequirements | null): boolean {
  if (!reqs) return false;
  return Object.values(reqs).some((v) => v && v.trim() !== "");
}

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
    const res = await fetch(
      `https://store.steampowered.com/api/appdetails?appids=${encodeURIComponent(appid)}`,
      { cache: "force-cache" } as RequestInit
    );

    if (!res.ok) {
      return NextResponse.json({ error: "Steam API error" }, { status: 502 });
    }

    const data = await res.json();
    const appData = data[appid];

    if (!appData?.success) {
      return NextResponse.json({ error: "Game not found" }, { status: 404 });
    }

    const info = appData.data;

    const platformMap: Record<Platform, Record<string, string>> = {
      windows: info.pc_requirements || {},
      macos: info.mac_requirements || {},
      linux: info.linux_requirements || {},
    };

    const platformRequirements: PlatformRequirements = {};
    const availablePlatforms: Platform[] = [];

    for (const [platform, reqs] of Object.entries(platformMap) as [Platform, Record<string, string>][]) {
      if (reqs.minimum || reqs.recommended) {
        const parsed: ParsedGameRequirements = parseRequirements(reqs.minimum, reqs.recommended);
        if (hasContent(parsed.minimum) || hasContent(parsed.recommended)) {
          platformRequirements[platform] = parsed;
          availablePlatforms.push(platform);
        }
      }
    }

    const requirements = platformRequirements.windows ?? platformRequirements[availablePlatforms[0]] ?? { minimum: null, recommended: null };

    return NextResponse.json({
      appid: Number(appid),
      name: info.name,
      headerImage: info.header_image,
      requirements,
      platformRequirements,
      availablePlatforms,
      source: "steam",
    });
  } catch {
    return NextResponse.json({ error: "Failed to fetch game" }, { status: 500 });
  }
}

interface RAWGPlatformReq {
  platform: { id: number; name: string; slug: string };
  requirements?: { minimum?: string; recommended?: string } | null;
}

interface RAWGGameDetail {
  id: number;
  name: string;
  background_image?: string;
  platforms?: RAWGPlatformReq[];
}

const RAWG_PLATFORM_MAP: Record<string, Platform> = {
  pc: "windows",
  macos: "macos",
  "apple-macintosh": "macos",
  linux: "linux",
};

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

    // 2. Search RAWG for requirements using game name
    const rawgKey = process.env.RAWG_API_KEY;
    if (!rawgKey) {
      // No RAWG key — return game info without requirements
      return returnGameWithoutRequirements(igdbGame);
    }

    const searchName = igdbGame.name;
    const rawgSearchRes = await fetch(
      `https://api.rawg.io/api/games?key=${rawgKey}&search=${encodeURIComponent(searchName)}&search_precise=true&page_size=5`
    );

    if (!rawgSearchRes.ok) {
      return returnGameWithoutRequirements(igdbGame);
    }

    const rawgSearchData = await rawgSearchRes.json();
    const rawgResults = rawgSearchData.results || [];

    if (rawgResults.length === 0) {
      return returnGameWithoutRequirements(igdbGame);
    }

    // Find best match by name similarity
    const rawgMatch = rawgResults.find(
      (r: { name: string }) => r.name.toLowerCase() === searchName.toLowerCase()
    ) || rawgResults[0];

    // 3. Fetch full RAWG game details
    const rawgDetailRes = await fetch(
      `https://api.rawg.io/api/games/${rawgMatch.id}?key=${rawgKey}`
    );

    if (!rawgDetailRes.ok) {
      return returnGameWithoutRequirements(igdbGame);
    }

    const rawgDetail: RAWGGameDetail = await rawgDetailRes.json();

    // 4. Extract and parse requirements from RAWG platforms
    const platformRequirements: PlatformRequirements = {};
    const availablePlatforms: Platform[] = [];

    if (rawgDetail.platforms) {
      for (const p of rawgDetail.platforms) {
        const platformKey = RAWG_PLATFORM_MAP[p.platform.slug];
        if (!platformKey) continue;

        const reqs = p.requirements;
        if (reqs && (reqs.minimum || reqs.recommended)) {
          const parsed = parseRequirements(reqs.minimum, reqs.recommended);
          if (hasContent(parsed.minimum) || hasContent(parsed.recommended)) {
            platformRequirements[platformKey] = parsed;
            availablePlatforms.push(platformKey);
          }
        }
      }
    }

    const requirements = platformRequirements.windows
      ?? platformRequirements[availablePlatforms[0]]
      ?? { minimum: null, recommended: null };

    const headerImage = igdbGame.cover?.image_id
      ? `https://images.igdb.com/igdb/image/upload/t_cover_big/${igdbGame.cover.image_id}.png`
      : rawgDetail.background_image ?? "";

    return NextResponse.json({
      appid: igdbGame.id,
      name: igdbGame.name,
      headerImage,
      requirements,
      platformRequirements,
      availablePlatforms,
      source: "igdb",
    });
  } catch {
    return NextResponse.json({ error: "Failed to fetch game" }, { status: 500 });
  }
}

function returnGameWithoutRequirements(igdbGame: { id: number; name: string; cover?: { image_id: string } }) {
  return NextResponse.json({
    appid: igdbGame.id,
    name: igdbGame.name,
    headerImage: igdbGame.cover?.image_id
      ? `https://images.igdb.com/igdb/image/upload/t_cover_big/${igdbGame.cover.image_id}.png`
      : "",
    requirements: { minimum: null, recommended: null },
    platformRequirements: {},
    availablePlatforms: [],
    source: "igdb",
  });
}
