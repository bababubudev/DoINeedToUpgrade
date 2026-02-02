/**
 * Fuzzy-match free-form hardware text against a list of known candidates.
 * Returns the best matching candidate name, or null if nothing scores above threshold.
 */
export function fuzzyMatchHardware(
  input: string,
  candidates: string[]
): string | null {
  if (!input.trim()) return null;

  const inputTokens = tokenize(input);
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
