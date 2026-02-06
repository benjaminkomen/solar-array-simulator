export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Check if two rectangles overlap using AABB collision detection.
 */
export function rectsOverlap(a: Rect, b: Rect): boolean {
  "worklet";
  return !(
    a.x + a.width <= b.x ||
    b.x + b.width <= a.x ||
    a.y + a.height <= b.y ||
    b.y + b.height <= a.y
  );
}

/**
 * Check if a rectangle collides with any rectangle in the array.
 * Optionally exclude a rectangle by id.
 */
export function collidesWithAny(
  rect: Rect,
  others: (Rect & { id: string })[],
  excludeId?: string
): boolean {
  "worklet";
  for (const other of others) {
    if (excludeId && other.id === excludeId) continue;
    if (rectsOverlap(rect, other)) return true;
  }
  return false;
}
