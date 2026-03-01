import { HardwareScores, FpsEstimate } from "@/types";

const REC_ANCHOR_FPS = 60;
const MIN_ANCHOR_FPS = 30;
const BASELINE_FPS   = 60;
const UNCERTAINTY    = 0.25;
const MAX_FPS        = 300;

/**
 * Estimate the FPS contribution of a single hardware component.
 *
 * - Below minimum  → sub-30fps using min as the 30fps reference
 * - Meets minimum, rec available → 60fps at rec spec
 * - Meets minimum, no rec       → 60fps at min spec (user-hardware-driven)
 * - No game specs at all        → null (caller handles via early exit)
 */
function componentFps(
  userScore: number | null,
  minScore: number | null,
  recScore: number | null,
): { fps: number | null; failsMin: boolean } {
  if (userScore === null) return { fps: null, failsMin: false };
  if (minScore === null && recScore === null) return { fps: null, failsMin: false };

  if (minScore !== null && userScore < minScore) {
    // Below minimum — gives sub-30fps so the estimate reflects the failing result
    return { fps: MIN_ANCHOR_FPS * (userScore / minScore), failsMin: true };
  }

  if (recScore !== null) {
    // Apply diminishing returns above recommended — a GPU 3× faster than recommended
    // does not deliver 3× the FPS due to resolution, engine, and other bottlenecks.
    const ratio = userScore / recScore;
    const fps = ratio <= 1
      ? REC_ANCHOR_FPS * ratio
      : REC_ANCHOR_FPS * Math.pow(ratio, 0.5);
    return { fps, failsMin: false };
  }

  // Above minimum, no rec — treat minimum as the 60fps reference so high-end
  // hardware isn't artificially dragged down by the 30fps minimum anchor
  const ratio = userScore / minScore!;
  const fps = ratio <= 1
    ? BASELINE_FPS * ratio
    : BASELINE_FPS * Math.pow(ratio, 0.5);
  return { fps, failsMin: false };
}

export function estimateFps(scores: HardwareScores): FpsEstimate {
  const useRec = scores.recGpuScore !== null || scores.recCpuScore !== null;
  const useMin = scores.minGpuScore !== null || scores.minCpuScore !== null;

  if (!useRec && !useMin) return { low: 0, high: 0, mid: 0, bottleneck: "balanced", confidence: "none" };

  const gpu = componentFps(scores.userGpuScore, scores.minGpuScore, scores.recGpuScore);
  const cpu = componentFps(scores.userCpuScore, scores.minCpuScore, scores.recCpuScore);

  const fpsByGpu = gpu.fps;
  const fpsByCpu = cpu.fps;

  if (fpsByGpu === null && fpsByCpu === null) {
    return { low: 0, high: 0, mid: 0, bottleneck: "balanced", confidence: "none" };
  }

  const confidence = useRec
    ? (scores.recGpuScore !== null && scores.recCpuScore !== null ? "good" : "limited")
    : "limited";

  let mid: number;
  let bottleneck: FpsEstimate["bottleneck"];
  const anyFailsMin = gpu.failsMin || cpu.failsMin;

  if (fpsByGpu !== null && fpsByCpu !== null) {
    if (anyFailsMin) {
      // A component below minimum is the hard bottleneck — a great GPU/CPU
      // can't compensate, so use min() rather than geometric mean
      mid = Math.min(fpsByGpu, fpsByCpu);
      bottleneck = fpsByGpu <= fpsByCpu ? "gpu" : "cpu";
    } else {
      // Both pass — geometric mean prevents one outlier from dominating
      mid = Math.sqrt(fpsByGpu * fpsByCpu);
      bottleneck = Math.abs(fpsByGpu - fpsByCpu) <= Math.min(fpsByGpu, fpsByCpu) * 0.15
        ? "balanced" : fpsByGpu < fpsByCpu ? "gpu" : "cpu";
    }
  } else if (fpsByGpu !== null) {
    mid = fpsByGpu;
    bottleneck = "gpu";
  } else {
    mid = fpsByCpu!;
    bottleneck = "cpu";
  }

  mid = Math.min(mid, MAX_FPS);
  return {
    low: Math.max(1, Math.floor(mid * (1 - UNCERTAINTY))),
    high: Math.ceil(mid * (1 + UNCERTAINTY)),
    mid: Math.round(mid),
    bottleneck,
    confidence,
  };
}
