/**
 * Simple subsequence-based fuzzy matcher: every character in `query` must
 * appear in `text` in the same order (not necessarily contiguous).
 * Returns a score (higher = better match) or null when there's no match.
 * Consecutive matches and matches near the start of the string score higher.
 */
export function fuzzyScore(text: string, query: string): number | null {
  const t = text.toLowerCase();
  const q = query.toLowerCase().trim();
  if (!q) return 0;

  let score = 0;
  let tIndex = 0;
  let consecutiveBonus = 0;

  for (let qIndex = 0; qIndex < q.length; qIndex++) {
    const char = q[qIndex];
    const foundAt = t.indexOf(char, tIndex);
    if (foundAt === -1) return null;

    // Reward matches close to the previous match (contiguous substrings score highest).
    if (foundAt === tIndex) {
      consecutiveBonus += 4;
      score += 10 + consecutiveBonus;
    } else {
      consecutiveBonus = 0;
      score += Math.max(1, 6 - (foundAt - tIndex));
    }

    // Reward matches near the start of the string.
    if (foundAt === 0) score += 5;

    tIndex = foundAt + 1;
  }

  // Prefer shorter overall text for equally-good matches (tighter relevance).
  score -= Math.min(t.length, 20) * 0.1;

  return score;
}

export function fuzzyMatch(text: string, query: string): boolean {
  return fuzzyScore(text, query) !== null;
}
