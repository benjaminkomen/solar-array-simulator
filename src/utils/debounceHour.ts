/** Delay before committing the hour slider to wattage `useMemo`. */
export const HOUR_SLIDER_DEBOUNCE_MS = 150;

export function clearDebouncedHour(
  debounceRef: { current: ReturnType<typeof setTimeout> | null },
) {
  if (debounceRef.current) {
    clearTimeout(debounceRef.current);
    debounceRef.current = null;
  }
}

export function scheduleDebouncedHour(
  debounceRef: { current: ReturnType<typeof setTimeout> | null },
  hour: number,
  setCurrentHour: (hour: number) => void,
  delayMs: number = HOUR_SLIDER_DEBOUNCE_MS,
) {
  clearDebouncedHour(debounceRef);
  debounceRef.current = setTimeout(() => setCurrentHour(hour), delayMs);
}
