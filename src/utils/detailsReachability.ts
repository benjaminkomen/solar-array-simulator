/**
 * Stable handles so inverter-details / panel-details can be driven without
 * Custom Add or a Skia canvas tap (Custom Add works after #62; Skia
 * nodes are not Maestro-accessible).
 *
 * - Config row `inverter-row-1` opens the seeded inverter edit sheet.
 * - Deep link `/panel-details?panelId=seed-panel` ensures a panel exists.
 */
export const SEEDED_INVERTER_ID = "1";

export const SEED_PANEL_ID = "seed-panel";

export function inverterRowTestId(inverterId: string): string {
  return `inverter-row-${inverterId}`;
}
