"use client";

import { useState, useEffect } from "react";
import {
  cpuList as staticCpuList,
  gpuList as staticGpuList,
  cpuScores as staticCpuScores,
  gpuScores as staticGpuScores,
} from "@/lib/hardwareData";

interface BenchmarkData {
  cpuList: string[];
  gpuList: string[];
  cpuScores: Record<string, number>;
  gpuScores: Record<string, number>;
  loading: boolean;
}

let cachedData: Omit<BenchmarkData, "loading"> | null = null;
let fetchPromise: Promise<void> | null = null;

const staticFallback = {
  cpuList: staticCpuList,
  gpuList: staticGpuList,
  cpuScores: staticCpuScores,
  gpuScores: staticGpuScores,
};

export function useBenchmarks(): BenchmarkData {
  const [data, setData] = useState<Omit<BenchmarkData, "loading"> | null>(
    cachedData
  );
  const [loading, setLoading] = useState(cachedData === null);

  useEffect(() => {
    if (cachedData) {
      setData(cachedData);
      setLoading(false);
      return;
    }

    if (!fetchPromise) {
      fetchPromise = fetch("/api/benchmarks")
        .then((res) => (res.ok ? res.json() : staticFallback))
        .then((json) => {
          cachedData = json;
        })
        .catch(() => {
          cachedData = staticFallback;
        });
    }

    fetchPromise.then(() => {
      setData(cachedData);
      setLoading(false);
    });
  }, []);

  return {
    cpuList: data?.cpuList ?? staticFallback.cpuList,
    gpuList: data?.gpuList ?? staticFallback.gpuList,
    cpuScores: data?.cpuScores ?? staticFallback.cpuScores,
    gpuScores: data?.gpuScores ?? staticFallback.gpuScores,
    loading,
  };
}
