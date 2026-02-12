import { NextRequest, NextResponse } from "next/server";
import { getIgdbUsage, IGDB_USE_LIMIT } from "@/lib/igdbRateLimit";

export async function GET(request: NextRequest) {
  if (process.env.NODE_ENV === "development") {
    return NextResponse.json({ remaining: IGDB_USE_LIMIT, limit: IGDB_USE_LIMIT });
  }

  const usage = getIgdbUsage(request);
  return NextResponse.json({ remaining: usage.remaining, limit: IGDB_USE_LIMIT });
}
