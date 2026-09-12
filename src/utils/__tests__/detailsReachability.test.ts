import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "bun:test";
import {
  SEED_PANEL_ID,
  SEEDED_INVERTER_ID,
  inverterEditPath,
  inverterRowTestId,
} from "../detailsReachability";

const panelStoreSrc = readFileSync(
  resolve(import.meta.dir, "../panelStore.ts"),
  "utf8",
);
const hookSrc = readFileSync(
  resolve(import.meta.dir, "../../hooks/usePanelDetails.ts"),
  "utf8",
);
const configFormSrc = readFileSync(
  resolve(import.meta.dir, "../../hooks/useConfigForm.ts"),
  "utf8",
);

describe("details reachability", () => {
  it("uses stable Config row and seed-panel ids", () => {
    expect(SEEDED_INVERTER_ID).toBe("1");
    expect(inverterRowTestId(SEEDED_INVERTER_ID)).toBe("inverter-row-1");
    expect(inverterEditPath(SEEDED_INVERTER_ID)).toBe(
      "/inverter-details?mode=edit&inverterId=1",
    );
    expect(SEED_PANEL_ID).toBe("seed-panel");
  });

  it("opens inverter edit from the Config row via navigate", () => {
    expect(configFormSrc).toContain("inverterEditPath");
    expect(configFormSrc).toContain("router.navigate");
    expect(configFormSrc).toContain("handleOpenEditSheet");
  });

  it("seeds only the reserved panel-details id, not the empty Custom canvas", () => {
    expect(panelStoreSrc).toContain("export function ensureSeedPanel");
    expect(panelStoreSrc).toContain("SEED_PANEL_ID");
    expect(hookSrc).toContain("ensureSeedPanel");
    expect(hookSrc).toContain("SEED_PANEL_ID");
  });
});
