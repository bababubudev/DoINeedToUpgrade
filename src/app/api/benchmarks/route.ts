import { NextResponse } from "next/server";
import {
  cpuList as staticCpuList,
  gpuList as staticGpuList,
  cpuScores as staticCpuScores,
  gpuScores as staticGpuScores,
} from "@/lib/hardwareData";

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
          return { name: e.name, score };
        })
        .filter((e) => e.name && e.score > 0)
    );

    // Merge static data so existing entries are always available
    const mergedCpuScores = { ...staticCpuScores, ...cpu.scores };
    const mergedGpuScores = { ...staticGpuScores, ...gpu.scores };

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
