import { generateJitteredKeyBetween } from "fractional-indexing-jittered";

/**
 * Bytewise comparator for fractional-index position keys. Matches the server's
 * `order by position` and the codebase's sortPositionKeys — using
 * String.localeCompare here would reorder keys (locale/case folding) and make
 * cards/columns render in a different order than they are stored.
 */
export function byPosition<T extends { position: string | null }>(
  a: T,
  b: T,
): number {
  const pa = a.position ?? "";
  const pb = b.position ?? "";
  if (pa < pb) return -1;
  if (pa > pb) return 1;
  return 0;
}

/**
 * Compute a fractional-index key that sorts between two neighbors. If the
 * neighbors aren't strictly ordered (shouldn't normally happen, but guards
 * against equal/duplicate keys), fall back to appending after `prev`.
 */
export function positionBetween(
  prev: string | null,
  next: string | null,
): string {
  try {
    return generateJitteredKeyBetween(prev, next);
  } catch {
    return generateJitteredKeyBetween(prev, null);
  }
}
