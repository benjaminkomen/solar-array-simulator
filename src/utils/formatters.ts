/**
 * Shared formatting and generation utilities used across screens.
 */

export function formatWattage(watts: number): string {
  if (watts >= 1000) {
    return `${(watts / 1000).toFixed(1)}kW`;
  }
  return `${watts}W`;
}

export function generateSerialNumber(): string {
  return Math.floor(10000000 + Math.random() * 90000000).toString();
}
