import { NextRequest, NextResponse } from "next/server";
import { parseRequirements } from "@/lib/parseRequirements";
import { Platform, ParsedGameRequirements, PlatformRequirements, GameRequirements } from "@/types";

function hasContent(reqs: GameRequirements | null): boolean {
  if (!reqs) return false;
  return Object.values(reqs).some((v) => v && v.trim() !== "");
}

export async function GET(request: NextRequest) {
  const appid = request.nextUrl.searchParams.get("appid");
  if (!appid) {
    return NextResponse.json({ error: "Missing appid" }, { status: 400 });
  }

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
        // Only include platform if it has actual requirement content
        if (hasContent(parsed.minimum) || hasContent(parsed.recommended)) {
          platformRequirements[platform] = parsed;
          availablePlatforms.push(platform);
        }
      }
    }

    // Backward compat: default to Windows requirements
    const requirements = platformRequirements.windows ?? platformRequirements[availablePlatforms[0]] ?? { minimum: null, recommended: null };

    return NextResponse.json({
      name: info.name,
      headerImage: info.header_image,
      requirements,
      platformRequirements,
      availablePlatforms,
    });
  } catch {
    return NextResponse.json({ error: "Failed to fetch game" }, { status: 500 });
  }
}
