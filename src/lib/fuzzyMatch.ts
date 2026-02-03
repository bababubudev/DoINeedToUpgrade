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

  const allInputTokens = tokenize(input);
  const hasSeries = allInputTokens.includes("series");
  const inputTokens = allInputTokens.filter((t) => !NOISE_WORDS.has(t));
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
      const isNumeric = isNumericToken(ct);
      if (inputTokens.some((it) =>
        isNumeric
          ? matchNumericToken(it, ct, hasSeries)
          : (it === ct || it.includes(ct) || ct.includes(it))
      )) {
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

/**
 * Match numeric tokens. When hasSeries is true and the input token is a round
 * hundred (600, 700, etc.), allow matching any candidate token in the same
 * hundred range (e.g. 600 matches 650, 660, 670).
 */
function matchNumericToken(
  inputToken: string,
  candidateToken: string,
  hasSeries: boolean
): boolean {
  if (inputToken === candidateToken) return true;

  if (hasSeries && isRoundHundred(inputToken)) {
    const inputNum = parseInt(inputToken, 10);
    const candidateNum = parseInt(candidateToken, 10);
    if (!isNaN(inputNum) && !isNaN(candidateNum)) {
      return Math.abs(Math.floor(candidateNum / 100) - Math.floor(inputNum / 100)) <= 1;
    }
  }

  return false;
}

function isRoundHundred(token: string): boolean {
  const num = parseInt(token, 10);
  return !isNaN(num) && num >= 100 && num % 100 === 0 && String(num) === token;
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
