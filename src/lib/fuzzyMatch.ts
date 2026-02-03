/**
 * Fuzzy-match free-form hardware text against a list of known candidates.
 * Returns the best matching candidate name, or null if nothing scores above threshold.
 */

const NOISE_WORDS = new Set([
  // GPU renderer noise
  "angle", "opengl", "direct3d11", "direct3d12", "d3d11", "d3d12",
  "vulkan", "metal", "google", "inc", "corporation", "technologies",
  "vs_4_0", "ps_4_0", "vs_5_0", "ps_5_0", "vs_6_0", "ps_6_0",
  // Requirement text noise
  "equivalent", "better", "compatible", "above", "later", "with",
  "or", "and", "series",
]);

export function fuzzyMatchHardware(
  input: string,
  candidates: string[]
): string | null {
  if (!input.trim()) return null;

  const inputTokens = tokenize(input).filter((t) => !NOISE_WORDS.has(t));
  if (inputTokens.length === 0) return null;

  let bestCandidate: string | null = null;
  let bestScore = 0;

  for (const candidate of candidates) {
    const candidateTokens = tokenize(candidate);
    let score = 0;
    let maxPossible = 0;

    for (const ct of candidateTokens) {
      const weight = isNumericToken(ct) ? 3 : 1;
      maxPossible += weight;
      if (inputTokens.some((it) => it === ct || it.includes(ct) || ct.includes(it))) {
        score += weight;
      }
    }

    // Normalize to 0-1 range
    const normalized = maxPossible > 0 ? score / maxPossible : 0;

    if (normalized > bestScore) {
      bestScore = normalized;
      bestCandidate = candidate;
    }
  }

  // Require at least 60% match
  return bestScore >= 0.6 ? bestCandidate : null;
}

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[®™©]+/g, "")
    .split(/[\s\-\/,@()]+/)
    .filter((t) => t.length > 0);
}

function isNumericToken(token: string): boolean {
  return /\d/.test(token);
}
