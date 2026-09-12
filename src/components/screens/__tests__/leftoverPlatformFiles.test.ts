import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "bun:test";

const repoRoot = join(import.meta.dir, "../../../..");
const appDir = join(repoRoot, "src/app");

const THIN_ROUTES = [
  { file: "custom.tsx", screen: "CustomScreen" },
  { file: "inverter-details.tsx", screen: "InverterDetailsScreen" },
  { file: "panel-details.tsx", screen: "PanelDetailsScreen" },
] as const;

describe("leftover platform chrome", () => {
  it("keeps product UI out of src/app/*.ios.tsx and *.android.tsx", () => {
    const platformFiles = readdirSync(appDir).filter((name) =>
      /\.(ios|android)\.tsx$/.test(name),
    );
    expect(platformFiles).toEqual([]);
  });

  it("leaves leftover Custom and details routes as thin re-exports", () => {
    for (const route of THIN_ROUTES) {
      const source = readFileSync(join(appDir, route.file), "utf8").trim();
      expect(source).toBe(
        `export { default } from "@/components/screens/${route.screen}";`,
      );
    }
  });

  it("does not recreate collapsed universal route forks", () => {
    const names = readdirSync(appDir);
    expect(names).toContain("production.tsx");
    expect(names).toContain("config.tsx");
    expect(names).toContain("config.web.tsx");
    expect(names).toContain("compass-help.tsx");
    expect(names).toContain("simulation.tsx");
    expect(names).toContain("upload.tsx");
    expect(names).toContain("analyze.tsx");
    expect(names).not.toContain("production.ios.tsx");
    expect(names).not.toContain("config.ios.tsx");
    expect(names).not.toContain("analyze.android.tsx");
  });
});
