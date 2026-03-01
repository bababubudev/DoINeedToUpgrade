import { NextResponse } from "next/server";
import {
  cpuList as staticCpuList,
  gpuList as staticGpuList,
  cpuScores as staticCpuScores,
  gpuScores as staticGpuScores,
} from "@/lib/hardwareData";
import { fuzzyMatchHardware } from "@/lib/fuzzyMatch";

interface GeekbenchCPUEntry {
  name: string;
  score: number;
  multicore_score: number;
}

interface GeekbenchGPUEntry {
  name: string;
  opencl?: number;
  vulkan?: number;
  metal?: number;
  cuda?: number;
}

interface BenchmarkResponse {
  cpuList: string[];
  gpuList: string[];
  cpuScores: Record<string, number>;
  gpuScores: Record<string, number>;
}

function normalizeScores(
  entries: { name: string; score: number }[]
): { list: string[]; scores: Record<string, number> } {
  if (entries.length === 0) return { list: [], scores: {} };

  const maxScore = Math.max(...entries.map((e) => e.score));
  const scores: Record<string, number> = {};
  const list: string[] = [];

  for (const entry of entries) {
    const normalized = Math.round((entry.score / maxScore) * 90 + 10);
    scores[entry.name] = normalized;
    list.push(entry.name);
  }

  return { list, scores };
}

/**
 * Calibrate Geekbench-normalized scores to the static hand-curated scale.
 * Uses overlapping entries (present in both datasets) to compute a median
 * scaling ratio, then applies it to Geekbench-only entries so all scores
 * end up on the same scale for reliable cross-source comparisons.
 */
function calibrateToStaticScale(
  geekbenchScores: Record<string, number>,
  staticScores: Record<string, number>
): Record<string, number> {
  const overlapping = Object.keys(geekbenchScores).filter(
    (k) => staticScores[k] != null && geekbenchScores[k] > 0
  );

  if (overlapping.length < 3) {
    // Not enough overlap to calibrate reliably — discard Geekbench scores
    return {};
  }

  const ratios = overlapping
    .map((k) => staticScores[k] / geekbenchScores[k])
    .sort((a, b) => a - b);
  const medianRatio = ratios[Math.floor(ratios.length / 2)];

  const staticNames = Object.keys(staticScores);
  const calibrated: Record<string, number> = {};
  for (const [name, score] of Object.entries(geekbenchScores)) {
    if (staticScores[name] != null) continue; // exact match — static takes priority
    // Skip entries that are just name variants of a static entry (e.g. "i7 3770K" vs
    // "i7-3770K", or "i7-3770K @ 3.50GHz"). Without this check, the fuzzy matcher can
    // pick the calibrated Geekbench variant (which uses multicore scores) over the
    // hand-curated static entry, producing a lower score for old CPUs and causing
    // false "pass" results when comparing against them.
    if (fuzzyMatchHardware(name, staticNames)) continue;
    calibrated[name] = Math.max(1, Math.round(score * medianRatio));
  }

  return calibrated;
}

function getStaticFallback(): BenchmarkResponse {
  return {
    cpuList: staticCpuList,
    gpuList: staticGpuList,
    cpuScores: staticCpuScores,
    gpuScores: staticGpuScores,
  };
}

export async function GET() {
  try {
    const [cpuRes, gpuRes] = await Promise.all([
      fetch("https://browser.geekbench.com/processor-benchmarks.json", {
        next: { revalidate: 86400 },
      }),
      fetch("https://browser.geekbench.com/gpu-benchmarks.json", {
        next: { revalidate: 86400 },
      }),
    ]);

    if (!cpuRes.ok || !gpuRes.ok) {
      return NextResponse.json(getStaticFallback());
    }

    const cpuJson = await cpuRes.json();
    const cpuData: GeekbenchCPUEntry[] = cpuJson.devices ?? [];
    const gpuJson = await gpuRes.json();
    const gpuData: GeekbenchGPUEntry[] = gpuJson.devices ?? [];

    const cpu = normalizeScores(
      cpuData
        .filter((e) => e.name && e.multicore_score > 0)
        .map((e) => ({ name: e.name, score: e.multicore_score }))
    );

    const gpu = normalizeScores(
      gpuData
        .map((e) => {
          // Use OpenCL as the most universal score, fall back to vulkan/metal/cuda
          const score = e.opencl || e.vulkan || e.metal || e.cuda || 0;
          // Normalize GPU names to include vendor prefix for consistency with static data
          let name = e.name;
          if (name.startsWith("GeForce") && !name.startsWith("NVIDIA")) {
            name = `NVIDIA ${name}`;
          } else if (name.startsWith("Radeon") && !name.startsWith("AMD")) {
            name = `AMD ${name}`;
          }
          return { name, score };
        })
        .filter((e) => e.name && e.score > 0)
    );

    // Calibrate Geekbench scores to the static scale, then merge
    // (static scores take priority — they're hand-curated for gaming)
    const calibratedCpuScores = calibrateToStaticScale(cpu.scores, staticCpuScores);
    const calibratedGpuScores = calibrateToStaticScale(gpu.scores, staticGpuScores);
    const mergedCpuScores = { ...calibratedCpuScores, ...staticCpuScores };
    const mergedGpuScores = { ...calibratedGpuScores, ...staticGpuScores };

    const mergedCpuList = Array.from(
      new Set([...cpu.list, ...staticCpuList])
    );
    const mergedGpuList = Array.from(
      new Set([...gpu.list, ...staticGpuList])
    );

    return NextResponse.json({
      cpuList: mergedCpuList,
      gpuList: mergedGpuList,
      cpuScores: mergedCpuScores,
      gpuScores: mergedGpuScores,
    } satisfies BenchmarkResponse);
  } catch {
    return NextResponse.json(getStaticFallback());
  }
}
