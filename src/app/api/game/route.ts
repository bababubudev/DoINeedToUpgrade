import { NextRequest, NextResponse } from "next/server";
import { parseRequirements } from "@/lib/parseRequirements";

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
    const pcReqs = info.pc_requirements || {};

    const requirements = parseRequirements(pcReqs.minimum, pcReqs.recommended);

    return NextResponse.json({
      name: info.name,
      headerImage: info.header_image,
      requirements,
    });
  } catch {
    return NextResponse.json({ error: "Failed to fetch game" }, { status: 500 });
  }
}
