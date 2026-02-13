import { describe, it, expect } from "bun:test";
import { snapToGrid, snapPositionToGrid, GRID_SIZE } from "../gridSnap";

describe("snapToGrid", () => {
  it("snaps to nearest grid position (round down)", () => {
    expect(snapToGrid(14)).toBe(0); // 14 / 30 = 0.47, rounds to 0
  });

  it("snaps to nearest grid position (round up)", () => {
    expect(snapToGrid(16)).toBe(30); // 16 / 30 = 0.53, rounds to 1
  });

  it("returns 0 for 0", () => {
    expect(snapToGrid(0)).toBe(0);
  });

  it("returns exact value when already on grid", () => {
    expect(snapToGrid(60)).toBe(60);
    expect(snapToGrid(90)).toBe(90);
    expect(snapToGrid(GRID_SIZE)).toBe(GRID_SIZE);
  });

  it("handles negative values", () => {
    expect(snapToGrid(-14)).toBe(-0); // Math.round(-0.47) = 0, but -0 in JS
    expect(snapToGrid(-16)).toBe(-30);
    expect(snapToGrid(-60)).toBe(-60);
  });

  it("handles large values", () => {
    expect(snapToGrid(1000)).toBe(990); // 1000/30 = 33.33 → 33 × 30 = 990
  });

  it("snaps at exact midpoint (15) to nearest grid", () => {
    // 15/30 = 0.5, Math.round(0.5) = 1 in JS (banker's rounding not used)
    expect(snapToGrid(15)).toBe(30);
  });
});

describe("snapPositionToGrid", () => {
  it("snaps both x and y", () => {
    const result = snapPositionToGrid(14, 46);
    expect(result.x).toBe(0);
    expect(result.y).toBe(60); // 46/30 = 1.53 → round to 2 → 60
  });

  it("handles origin", () => {
    const result = snapPositionToGrid(0, 0);
    expect(result.x).toBe(0);
    expect(result.y).toBe(0);
  });

  it("handles negative coordinates", () => {
    const result = snapPositionToGrid(-45, -75);
    expect(result.x).toBe(-30); // -45/30 = -1.5 → round to -1 → -30... actually Math.round(-1.5) = -1
    expect(result.y).toBe(-60); // -75/30 = -2.5 → round to -2 → -60
  });
});

describe("GRID_SIZE constant", () => {
  it("is 30", () => {
    expect(GRID_SIZE).toBe(30);
  });
});
