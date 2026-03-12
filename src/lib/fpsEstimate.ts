import { HardwareScores, FpsEstimate } from "@/types";

const REC_ANCHOR_FPS = 60;
const MIN_ANCHOR_FPS = 30;
const BASELINE_FPS   = 60;
const UNCERTAINTY    = 0.25;
const MAX_FPS        = 300;
// Every SCORE_SCALE points above the recommended spec doubles the predicted FPS,
// and every SCORE_SCALE points below halves it. This handles score-scale compression
// better than a power function: a score ratio of 3x can represent a real-world gap
// of 5x, so basing predictions on the raw score difference is more accurate.
const SCORE_SCALE    = 25;

/**
 * Estimate the FPS contribution of a single hardware component.
 *
 * Uses a continuous curve that anchors at 30fps for minimum specs and 60fps
 * for recommended specs (when available). Below minimum, the curve extrapolates
 * downward smoothly rather than using a separate linear formula — this avoids
 * a discontinuity at the min threshold.
 */
function componentFps(
  userScore: number | null,
  minScore: number | null,
  recScore: number | null,
): { fps: number | null; failsMin: boolean } {
  if (userScore === null) return { fps: null, failsMin: false };
  if (minScore === null && recScore === null) return { fps: null, failsMin: false };

  const failsMin = minScore !== null && userScore < minScore;

  if (recScore !== null && minScore !== null) {
    // Two anchors: 30fps at minScore, 60fps at recScore.
    // Solve for base: 60/30 = base^(recScore - minScore) → base = 2^(1/(rec-min))
    // Then fps = 30 * base^(userScore - minScore)
    // This is continuous across the entire range including below minimum.
    const gap = recScore - minScore;
    if (gap > 0) {
      const fps = MIN_ANCHOR_FPS * Math.pow(2, (userScore - minScore) / gap);
      return { fps, failsMin };
    }
    // rec ≈ min — fall through to single-anchor formula
    const fps = REC_ANCHOR_FPS * Math.pow(2, (userScore - recScore) / SCORE_SCALE);
    return { fps, failsMin };
  }

  if (recScore !== null) {
    // Only rec available — anchor at 60fps
    const fps = REC_ANCHOR_FPS * Math.pow(2, (userScore - recScore) / SCORE_SCALE);
    return { fps, failsMin };
  }

  // Only min available — treat minimum as the 60fps reference
  const fps = BASELINE_FPS * Math.pow(2, (userScore - minScore!) / SCORE_SCALE);
  return { fps, failsMin };
}

/**
 * Compute a RAM penalty multiplier (0.4 – 1.0).
 * RAM doesn't scale FPS linearly — it's a cliff: enough RAM = no impact,
 * not enough = severe stuttering from OS paging.
 *
 * - >= recommended (or no req): 1.0 (no penalty)
 * - >= minimum but < recommended: mild penalty scaling linearly (0.85 – 1.0)
 * - < minimum: harsh penalty scaling with the deficit (down to 0.4)
 */
function ramPenalty(
  userGB: number | null,
  minGB: number | null,
  recGB: number | null,
): { multiplier: number; isBottleneck: boolean } {
  if (userGB === null) return { multiplier: 1, isBottleneck: false };

  const effectiveMin = minGB;
  const effectiveRec = recGB ?? minGB;

  // No RAM requirements listed — no penalty
  if (effectiveMin === null && effectiveRec === null) return { multiplier: 1, isBottleneck: false };

  if (effectiveRec !== null && userGB >= effectiveRec) {
    return { multiplier: 1, isBottleneck: false };
  }

  if (effectiveMin !== null && userGB < effectiveMin) {
    // Below minimum — harsh penalty. At 50% of minimum → 0.4x, at 100% → 0.85x
    const ratio = Math.max(userGB / effectiveMin, 0);
    const mult = 0.4 + 0.45 * ratio;
    return { multiplier: mult, isBottleneck: true };
  }

  if (effectiveMin !== null && effectiveRec !== null && effectiveRec > effectiveMin) {
    // Between min and rec — mild penalty (0.85 at min, 1.0 at rec)
    const t = (userGB - effectiveMin) / (effectiveRec - effectiveMin);
    const mult = 0.85 + 0.15 * t;
    return { multiplier: mult, isBottleneck: false };
  }

  // Has min but no rec, and user meets min
  return { multiplier: 1, isBottleneck: false };
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

  // Apply RAM penalty — insufficient RAM causes paging which tanks performance
  const ram = ramPenalty(scores.userRamGB, scores.minRamGB, scores.recRamGB);
  mid *= ram.multiplier;

  // RAM becomes the declared bottleneck if it's the dominant limiter
  if (ram.isBottleneck) {
    // Only override if RAM penalty is worse than the CPU/GPU bottleneck effect
    const cpuGpuMin = Math.min(fpsByGpu ?? Infinity, fpsByCpu ?? Infinity);
    if (ram.multiplier * cpuGpuMin < cpuGpuMin) {
      bottleneck = "ram";
    }
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
