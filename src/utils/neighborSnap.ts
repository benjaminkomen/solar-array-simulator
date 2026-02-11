import type { Rect } from "./collision";
import { collidesWithAny, PANEL_GAP } from "./collision";
import { snapToGrid, SNAP_THRESHOLD, PANEL_SPACING } from "./gridSnap";

/**
 * Snap panel position using independent axis snapping.
 *
 * Algorithm:
 * 1. Collect all valid X positions from all panels (left edge, adjacent-right, adjacent-left)
 * 2. Collect all valid Y positions from all panels (top edge, adjacent-below, adjacent-above)
 * 3. Snap X to closest valid position within threshold (or grid snap if none)
 * 4. Snap Y to closest valid position within threshold (or grid snap if none)
 * 5. Combine and validate for collisions
 *
 * This ensures BOTH axes align to the established grid, preventing cascading misalignment.
 */
export function snapToNeighbors(
  currentX: number,
  currentY: number,
  panelWidth: number,
  panelHeight: number,
  panelId: string,
  allPanelRects: (Rect & { id: string })[]
): { x: number; y: number } {
  "worklet";

  // Collect all X snap positions from all panels
  const xPositions: number[] = [];
  for (const panel of allPanelRects) {
    if (panel.id === panelId) continue;
    xPositions.push(panel.x); // Left edge alignment
    xPositions.push(panel.x + panel.width + PANEL_SPACING); // Adjacent right
    xPositions.push(panel.x - panelWidth - PANEL_SPACING); // Adjacent left
  }

  // Collect all Y snap positions from all panels
  const yPositions: number[] = [];
  for (const panel of allPanelRects) {
    if (panel.id === panelId) continue;
    yPositions.push(panel.y); // Top edge alignment
    yPositions.push(panel.y + panel.height + PANEL_SPACING); // Adjacent below
    yPositions.push(panel.y - panelHeight - PANEL_SPACING); // Adjacent above
  }

  // Find best X (closest within threshold)
  let bestX = snapToGrid(currentX);
  let bestXDist = SNAP_THRESHOLD + 1;
  for (const x of xPositions) {
    const dist = Math.abs(currentX - x);
    if (dist < bestXDist && dist <= SNAP_THRESHOLD) {
      bestX = x;
      bestXDist = dist;
    }
  }

  // Find best Y (closest within threshold)
  let bestY = snapToGrid(currentY);
  let bestYDist = SNAP_THRESHOLD + 1;
  for (const y of yPositions) {
    const dist = Math.abs(currentY - y);
    if (dist < bestYDist && dist <= SNAP_THRESHOLD) {
      bestY = y;
      bestYDist = dist;
    }
  }

  // Validate combined position doesn't cause collision
  const finalRect: Rect = {
    x: bestX,
    y: bestY,
    width: panelWidth,
    height: panelHeight,
  };
  if (!collidesWithAny(finalRect, allPanelRects, panelId, PANEL_GAP)) {
    return { x: bestX, y: bestY };
  }

  // Fallback to grid snap if combined position collides
  const gridX = snapToGrid(currentX);
  const gridY = snapToGrid(currentY);
  const gridRect: Rect = {
    x: gridX,
    y: gridY,
    width: panelWidth,
    height: panelHeight,
  };
  if (!collidesWithAny(gridRect, allPanelRects, panelId, PANEL_GAP)) {
    return { x: gridX, y: gridY };
  }

  // Last resort: keep current position
  return { x: currentX, y: currentY };
}
