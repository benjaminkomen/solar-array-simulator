export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** Minimum gap between panels in pixels */
export const PANEL_GAP = 8;

/**
 * Check if two rectangles overlap using AABB collision detection.
 * Includes a gap parameter to enforce minimum spacing.
 */
export function rectsOverlap(a: Rect, b: Rect, gap: number = 0): boolean {
  "worklet";
  return !(
    a.x + a.width + gap <= b.x ||
    b.x + b.width + gap <= a.x ||
    a.y + a.height + gap <= b.y ||
    b.y + b.height + gap <= a.y
  );
}

/**
 * Check if a rectangle collides with any rectangle in the array.
 * Optionally exclude a rectangle by id.
 * Uses PANEL_GAP for minimum spacing enforcement.
 */
export function collidesWithAny(
  rect: Rect,
  others: (Rect & { id: string })[],
  excludeId?: string,
  gap: number = PANEL_GAP
): boolean {
  "worklet";
  for (const other of others) {
    if (excludeId && other.id === excludeId) continue;
    if (rectsOverlap(rect, other, gap)) return true;
  }
  return false;
}
