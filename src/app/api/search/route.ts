import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q");
  if (!q) {
    return NextResponse.json({ items: [] });
  }

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
      })
    );

    return NextResponse.json({ items });
  } catch {
    return NextResponse.json({ error: "Failed to search" }, { status: 500 });
  }
}
