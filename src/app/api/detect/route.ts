import { NextResponse } from "next/server";
import si from "systeminformation";

export async function GET() {
  try {
    const [osInfo, cpu, mem, graphics, disks] = await Promise.all([
      si.osInfo(),
      si.cpu(),
      si.mem(),
      si.graphics(),
      si.fsSize(),
    ]);

    // Build OS string
    let os = osInfo.distro;
    if (osInfo.release) os += ` ${osInfo.release}`;

    // Build CPU string
    const cpuName = cpu.brand
      ? `${cpu.manufacturer} ${cpu.brand}`
      : `${cpu.manufacturer} (${cpu.cores} cores)`;

    // Pick the primary discrete GPU, fall back to first controller
    const gpuController =
      graphics.controllers.find((c) => (c.vram ?? 0) > 0) ??
      graphics.controllers[0];
    const gpuName = gpuController?.model ?? "";

    // RAM in GB (rounded)
    const ramGB = Math.round(mem.total / 1073741824);

    // Total storage across all mounted disks in GB
    const storageGB = Math.round(
      disks.reduce((sum, d) => sum + d.size, 0) / 1073741824
    );

    return NextResponse.json({
      os,
      cpu: cpuName,
      cpuCores: cpu.cores,
      gpu: gpuName,
      ramGB,
      storageGB,
    });
  } catch (err) {
    console.error("System detection failed:", err);
    return NextResponse.json(
      { error: "Failed to detect system specs" },
      { status: 500 }
    );
  }
}
