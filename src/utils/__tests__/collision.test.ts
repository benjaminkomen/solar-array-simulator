import { describe, it, expect } from "bun:test";
import { rectsOverlap, collidesWithAny, PANEL_GAP } from "../collision";

describe("rectsOverlap", () => {
  it("detects overlapping rectangles", () => {
    const a = { x: 0, y: 0, width: 100, height: 100 };
    const b = { x: 50, y: 50, width: 100, height: 100 };
    expect(rectsOverlap(a, b)).toBe(true);
  });

  it("returns false for non-overlapping rectangles", () => {
    const a = { x: 0, y: 0, width: 100, height: 100 };
    const b = { x: 200, y: 200, width: 100, height: 100 };
    expect(rectsOverlap(a, b)).toBe(false);
  });

  it("returns false when rects are exactly touching (no gap)", () => {
    const a = { x: 0, y: 0, width: 100, height: 100 };
    const b = { x: 100, y: 0, width: 100, height: 100 };
    expect(rectsOverlap(a, b, 0)).toBe(false);
  });

  it("detects overlap when gap is enforced", () => {
    const a = { x: 0, y: 0, width: 100, height: 100 };
    const b = { x: 105, y: 0, width: 100, height: 100 };
    // 5px apart, but gap requires 8px
    expect(rectsOverlap(a, b, 8)).toBe(true);
  });

  it("returns false when gap requirement is satisfied", () => {
    const a = { x: 0, y: 0, width: 100, height: 100 };
    const b = { x: 110, y: 0, width: 100, height: 100 };
    // 10px apart, gap requires 8px
    expect(rectsOverlap(a, b, 8)).toBe(false);
  });

  it("handles zero-size rectangles", () => {
    const a = { x: 50, y: 50, width: 0, height: 0 };
    const b = { x: 0, y: 0, width: 100, height: 100 };
    // A zero-size rect at (50,50) is inside b
    expect(rectsOverlap(a, b)).toBe(true);
  });

  it("detects vertical overlap", () => {
    const a = { x: 0, y: 0, width: 100, height: 50 };
    const b = { x: 0, y: 25, width: 100, height: 50 };
    expect(rectsOverlap(a, b)).toBe(true);
  });

  it("returns false for vertically separated rects", () => {
    const a = { x: 0, y: 0, width: 100, height: 50 };
    const b = { x: 0, y: 100, width: 100, height: 50 };
    expect(rectsOverlap(a, b)).toBe(false);
  });

  it("handles negative coordinates", () => {
    const a = { x: -50, y: -50, width: 100, height: 100 };
    const b = { x: 0, y: 0, width: 100, height: 100 };
    expect(rectsOverlap(a, b)).toBe(true);
  });
});

describe("collidesWithAny", () => {
  const panels = [
    { id: "1", x: 0, y: 0, width: 60, height: 120 },
    { id: "2", x: 100, y: 0, width: 60, height: 120 },
    { id: "3", x: 200, y: 0, width: 60, height: 120 },
  ];

  it("detects collision with one of many rects", () => {
    const rect = { x: 50, y: 50, width: 60, height: 120 };
    expect(collidesWithAny(rect, panels)).toBe(true);
  });

  it("returns false when no collision exists", () => {
    const rect = { x: 500, y: 500, width: 60, height: 120 };
    expect(collidesWithAny(rect, panels)).toBe(false);
  });

  it("excludes specified panel by id", () => {
    // Rect at panel 1's position — excluded, and panel 2 is far enough (100-60=40 > gap 8)
    const rect = { x: 0, y: 0, width: 60, height: 120 };
    expect(collidesWithAny(rect, panels, "1")).toBe(false);

    // Rect overlapping panel 2's space — collides even with panel 1 excluded
    const rect2 = { x: 95, y: 0, width: 60, height: 120 };
    expect(collidesWithAny(rect2, panels, "1")).toBe(true);
  });

  it("uses custom gap parameter", () => {
    // Rect 5px from panel 3 (at x=265, panel 3 ends at x=260)
    const rect = { x: 265, y: 0, width: 60, height: 120 };
    expect(collidesWithAny(rect, panels, undefined, 10)).toBe(true);
    expect(collidesWithAny(rect, panels, undefined, 3)).toBe(false);
  });

  it("returns false for empty panel array", () => {
    const rect = { x: 0, y: 0, width: 60, height: 120 };
    expect(collidesWithAny(rect, [])).toBe(false);
  });

  it("uses PANEL_GAP as default gap", () => {
    // Panel at x=68 (gap from panel 1 = 68 - 60 = 8 = PANEL_GAP exactly)
    const rect = { x: 60 + PANEL_GAP, y: 0, width: 30, height: 30 };
    expect(collidesWithAny(rect, [panels[0]])).toBe(false);

    // One pixel closer
    const rectClose = { x: 60 + PANEL_GAP - 1, y: 0, width: 30, height: 30 };
    expect(collidesWithAny(rectClose, [panels[0]])).toBe(true);
  });
});
