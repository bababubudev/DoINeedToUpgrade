import { HardwareScores, FpsEstimate } from "@/types";

const REC_ANCHOR_FPS = 60;
const MIN_ANCHOR_FPS = 30;
const UNCERTAINTY    = 0.25;
const MAX_FPS        = 300;

export function estimateFps(scores: HardwareScores): FpsEstimate {
  const useRec = scores.recGpuScore !== null || scores.recCpuScore !== null;
  const anchor = useRec ? REC_ANCHOR_FPS : MIN_ANCHOR_FPS;
  const refGpu = useRec ? scores.recGpuScore : scores.minGpuScore;
  const refCpu = useRec ? scores.recCpuScore : scores.minCpuScore;

  const hasAny = refGpu !== null || refCpu !== null;
  if (!hasAny) return { low: 0, high: 0, mid: 0, bottleneck: "balanced", confidence: "none" };

  const confidence = useRec
    ? (scores.recGpuScore !== null && scores.recCpuScore !== null ? "good" : "limited")
    : "limited";

  const fpsByGpu = (scores.userGpuScore && refGpu)
    ? anchor * (scores.userGpuScore / refGpu)
    : null;
  const fpsByCpu = (scores.userCpuScore && refCpu)
    ? anchor * (scores.userCpuScore / refCpu)
    : null;

  let mid: number;
  let bottleneck: FpsEstimate["bottleneck"];

  if (fpsByGpu !== null && fpsByCpu !== null) {
    // Geometric mean instead of min: prevents one weak component from overly
    // dragging down the estimate when the other greatly exceeds requirements.
    mid = Math.sqrt(fpsByGpu * fpsByCpu);
    bottleneck = Math.abs(fpsByGpu - fpsByCpu) <= Math.min(fpsByGpu, fpsByCpu) * 0.15
      ? "balanced" : fpsByGpu < fpsByCpu ? "gpu" : "cpu";
  } else if (fpsByGpu !== null) {
    mid = fpsByGpu;
    bottleneck = "gpu";
  } else if (fpsByCpu !== null) {
    mid = fpsByCpu;
    bottleneck = "cpu";
  } else {
    return { low: 0, high: 0, mid: 0, bottleneck: "balanced", confidence: "none" };
  }

  // When using minimum-only specs, cap more conservatively since the actual
  // ceiling depends on in-engine limits we can't know.
  const maxFps = useRec ? MAX_FPS : 4 * MIN_ANCHOR_FPS;
  mid = Math.min(mid, maxFps);
  return {
    low: Math.max(1, Math.floor(mid * (1 - UNCERTAINTY))),
    high: Math.ceil(mid * (1 + UNCERTAINTY)),
    mid: Math.round(mid),
    bottleneck,
    confidence,
  };
}
