import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, it, expect } from "bun:test";
import {
  CONFIG_BOTTOM_TOOLBAR_INSET,
  PRODUCTION_PATH,
  configToolbarListInset,
  isWelcomePath,
  runWizardFinish,
  shouldRedirectWelcomeToProduction,
  shouldShowWizardFinish,
} from "../wizardChrome";

const indexSrc = readFileSync(
  resolve(import.meta.dir, "../../app/index.tsx"),
  "utf8",
);
const editorSrc = readFileSync(
  resolve(import.meta.dir, "../../hooks/useCanvasEditor.ts"),
  "utf8",
);
const happyYaml = readFileSync(
  resolve(import.meta.dir, "../../../.maestro/wizard-happy-path.yaml"),
  "utf8",
);
const wizardToProductionYaml = readFileSync(
  resolve(import.meta.dir, "../../../.maestro/shared/wizard-to-production.yaml"),
  "utf8",
);

describe("configToolbarListInset", () => {
  it("clears Continue by combining toolbar inset with the home indicator", () => {
    expect(CONFIG_BOTTOM_TOOLBAR_INSET).toBe(96);
    expect(configToolbarListInset(34)).toBe(130);
    expect(configToolbarListInset(0)).toBe(96);
    expect(configToolbarListInset(-1)).toBe(96);
  });
});

describe("shouldShowWizardFinish", () => {
  it("hides Finish outside wizard mode even when panels exist", () => {
    expect(shouldShowWizardFinish(false, 3)).toBe(false);
  });

  it("hides Finish on an empty wizard canvas", () => {
    expect(shouldShowWizardFinish(true, 0)).toBe(false);
  });

  it("shows Finish in wizard mode after a panel is added", () => {
    expect(shouldShowWizardFinish(true, 1)).toBe(true);
  });

  it("hides Finish again when the last panel is removed", () => {
    expect(shouldShowWizardFinish(true, 1)).toBe(true);
    expect(shouldShowWizardFinish(true, 0)).toBe(false);
  });
});

describe("shouldRedirectWelcomeToProduction", () => {
  it("redirects returning users only when Welcome is the visible path", () => {
    expect(isWelcomePath("/")).toBe(true);
    expect(isWelcomePath("/index")).toBe(true);
    expect(shouldRedirectWelcomeToProduction(true, "/")).toBe(true);
    expect(shouldRedirectWelcomeToProduction(true, "/index")).toBe(true);
  });

  it("does not redirect from a buried Welcome while the wizard is showing", () => {
    expect(isWelcomePath("/custom")).toBe(false);
    expect(shouldRedirectWelcomeToProduction(true, "/custom")).toBe(false);
    expect(shouldRedirectWelcomeToProduction(true, "/config")).toBe(false);
    expect(shouldRedirectWelcomeToProduction(true, "/upload")).toBe(false);
    expect(shouldRedirectWelcomeToProduction(true, PRODUCTION_PATH)).toBe(false);
  });

  it("does not redirect first-run users on Welcome", () => {
    expect(shouldRedirectWelcomeToProduction(false, "/")).toBe(false);
  });

  it("wires Index to the focused-path gate", () => {
    expect(indexSrc).toContain("usePathname");
    expect(indexSrc).toContain("shouldRedirectWelcomeToProduction");
    expect(indexSrc).toContain('Redirect href="/production"');
  });
});

describe("runWizardFinish", () => {
  it("opens Production before writing wizardCompleted", () => {
    const calls: string[] = [];
    runWizardFinish({
      openProduction: (href) => {
        calls.push(`open:${href}`);
      },
      markWizardCompleted: () => {
        calls.push("flag");
      },
    });
    expect(calls).toEqual([`open:${PRODUCTION_PATH}`, "flag"]);
  });

  it("Finish replaces Custom with Production instead of racing a buried Redirect", () => {
    expect(editorSrc).toContain("runWizardFinish");
    expect(editorSrc).toContain("router.replace");
    expect(editorSrc).not.toContain("router.push('/production')");
    expect(editorSrc).not.toContain('router.push("/production")');
  });

  it("wizard-happy-path still reaches Production via Finish, not a deeplink", () => {
    expect(happyYaml).toContain('tapOn: "Finish"');
    expect(happyYaml).toContain("Total Array Output");
    expect(happyYaml).not.toMatch(/openLink:[\s\S]*production/);
    expect(wizardToProductionYaml).toContain('tapOn: "Finish"');
    expect(wizardToProductionYaml).not.toMatch(/openLink:[\s\S]*production/);
  });
});
