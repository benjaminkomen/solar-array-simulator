import { describe, it, expect } from "bun:test";
import {
  HOUR_SLIDER_DEBOUNCE_MS,
  clearDebouncedHour,
  scheduleDebouncedHour,
} from "../debounceHour";

describe("scheduleDebouncedHour", () => {
  it("uses a 150ms delay so wattage work settles after the drag", () => {
    expect(HOUR_SLIDER_DEBOUNCE_MS).toBe(150);
  });

  it("commits the last scheduled hour after the delay", async () => {
    const debounceRef: { current: ReturnType<typeof setTimeout> | null } = {
      current: null,
    };
    const committed: number[] = [];

    scheduleDebouncedHour(debounceRef, 8, (hour) => committed.push(hour), 20);
    scheduleDebouncedHour(debounceRef, 10, (hour) => committed.push(hour), 20);

    expect(committed).toEqual([]);
    await new Promise((resolvePromise) => setTimeout(resolvePromise, 40));
    expect(committed).toEqual([10]);
  });

  it("clearDebouncedHour cancels a pending commit", async () => {
    const debounceRef: { current: ReturnType<typeof setTimeout> | null } = {
      current: null,
    };
    const committed: number[] = [];

    scheduleDebouncedHour(debounceRef, 9, (hour) => committed.push(hour), 20);
    clearDebouncedHour(debounceRef);
    await new Promise((resolvePromise) => setTimeout(resolvePromise, 40));
    expect(committed).toEqual([]);
  });
});
