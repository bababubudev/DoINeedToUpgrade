import { NextRequest, NextResponse } from "next/server";
import { storeSpecs, retrieveSpecs } from "./store";

const MAX_BODY_SIZE = 4096;

export async function POST(request: NextRequest) {
  try {
    const text = await request.text();
    if (text.length > MAX_BODY_SIZE) {
      return NextResponse.json({ error: "Payload too large" }, { status: 413 });
    }

    const body = JSON.parse(text);

    // Validate required fields
    if (typeof body.os !== "string" || !body.os.trim()) {
      return NextResponse.json({ error: "os is required" }, { status: 400 });
    }
    if (typeof body.cpu !== "string" || !body.cpu.trim()) {
      return NextResponse.json({ error: "cpu is required" }, { status: 400 });
    }
    if (body.gpu !== undefined && body.gpu !== null && typeof body.gpu !== "string") {
      return NextResponse.json({ error: "gpu must be a string" }, { status: 400 });
    }

    const specs = {
      os: body.os,
      cpu: body.cpu,
      cpuCores: typeof body.cpuCores === "number" ? body.cpuCores : null,
      cpuSpeedGHz: typeof body.cpuSpeedGHz === "number" ? body.cpuSpeedGHz : null,
      gpu: typeof body.gpu === "string" ? body.gpu : "",
      ramGB: typeof body.ramGB === "number" ? body.ramGB : null,
      storageGB: typeof body.storageGB === "number" ? body.storageGB : null,
    };

    const token = storeSpecs(specs);
    return NextResponse.json({ token });
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
}

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token");
  if (!token) {
    return NextResponse.json({ error: "token parameter required" }, { status: 400 });
  }

  const specs = retrieveSpecs(token);
  if (!specs) {
    return NextResponse.json({ error: "Token not found or expired" }, { status: 404 });
  }

  return NextResponse.json(specs);
}
