import { HardwareScores, FpsEstimate } from "@/types";

const REC_ANCHOR_FPS = 60;
const MIN_ANCHOR_FPS = 30;
const BASELINE_FPS   = 60;
const UNCERTAINTY    = 0.25;
const MAX_FPS        = 300;
// Every SCORE_SCALE points above the recommended spec doubles the predicted FPS,
// and every SCORE_SCALE points below halves it. This handles score-scale compression
// better than a power function: a score ratio of 3× can represent a real-world gap
// of 5×, so basing predictions on the raw score difference is more accurate.
const SCORE_SCALE    = 25;

/**
 * Estimate the FPS contribution of a single hardware component.
 *
 * - Below minimum  → sub-30fps using min as the 30fps reference
 * - Meets minimum, rec available → 60fps at rec spec, exponential delta above/below
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
    // Exponential delta: anchored at 60fps for the recommended spec, doubling
    // every SCORE_SCALE points above (and halving every SCORE_SCALE points below).
    // This avoids score-compression distortion — a score gap of 88 (RTX 5090 vs
    // GTX 1080) correctly predicts high FPS instead of being capped by a raw ratio.
    const fps = REC_ANCHOR_FPS * Math.pow(2, (userScore - recScore) / SCORE_SCALE);
    return { fps, failsMin: false };
  }

  // Above minimum, no rec — treat minimum as the 60fps reference
  const fps = BASELINE_FPS * Math.pow(2, (userScore - minScore!) / SCORE_SCALE);
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
