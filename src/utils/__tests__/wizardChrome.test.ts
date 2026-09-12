import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, it, expect } from "bun:test";
import {
  CONFIG_BOTTOM_TOOLBAR_INSET,
  PRODUCTION_PATH,
  PRODUCTION_ROUTE_NAME,
  configToolbarListInset,
  dispatchWizardFinish,
  focusedRouteName,
  isWizardProductionRoute,
  persistWizardCompletedOnProduction,
  retryWizardFinishIfNeeded,
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
const productionHookSrc = readFileSync(
  resolve(import.meta.dir, "../../hooks/useProductionMonitor.ts"),
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
  it("redirects only from the launch-time snapshot, not a live flag flip", () => {
    expect(shouldRedirectWelcomeToProduction(true)).toBe(true);
    expect(shouldRedirectWelcomeToProduction(false)).toBe(false);
  });

  it("wires Index to a launch-time snapshot, not useConfigStore", () => {
    expect(indexSrc).toContain("useState(getWizardCompleted)");
    expect(indexSrc).toContain("shouldRedirectWelcomeToProduction");
    expect(indexSrc).toContain('Redirect href="/production"');
    expect(indexSrc).not.toContain("useConfigStore");
    expect(indexSrc).not.toContain("usePathname");
  });
});

describe("runWizardFinish", () => {
  it("opens Production and does not write wizardCompleted", () => {
    const hrefs: string[] = [];
    runWizardFinish((href) => {
      hrefs.push(href);
    });
    expect(hrefs).toEqual([PRODUCTION_PATH]);
  });

  it("dispatches the Production route name on the focused navigator", () => {
    const names: string[] = [];
    dispatchWizardFinish({
      navigate: (name) => {
        names.push(name);
      },
    });
    expect(names).toEqual([PRODUCTION_ROUTE_NAME]);
    expect(isWizardProductionRoute(PRODUCTION_ROUTE_NAME)).toBe(true);
    expect(isWizardProductionRoute("custom")).toBe(false);
    expect(focusedRouteName({
      getState: () => ({ index: 1, routes: [{ name: "index" }, { name: "custom" }] }),
    })).toBe("custom");
  });

  it("retries Finish only while Custom is still focused", () => {
    const names: string[] = [];
    retryWizardFinishIfNeeded({
      navigate: (name) => {
        names.push(name);
      },
      getState: () => ({ index: 0, routes: [{ name: "custom" }] }),
    });
    retryWizardFinishIfNeeded({
      navigate: (name) => {
        names.push(name);
      },
      getState: () => ({ index: 0, routes: [{ name: PRODUCTION_ROUTE_NAME }] }),
    });
    expect(names).toEqual([PRODUCTION_ROUTE_NAME]);
  });

  it("Finish navigates Production on the focused stack and leaves persist to the Production mount", () => {
    expect(editorSrc).toContain("dispatchWizardFinish");
    expect(editorSrc).toContain("retryWizardFinishIfNeeded");
    expect(editorSrc).toContain("useNavigation");
    expect(editorSrc).toContain("requestAnimationFrame");
    expect(editorSrc).not.toContain("expoRouter.push");
    expect(editorSrc).not.toMatch(/setTimeout\s*\(/);
    expect(editorSrc).not.toContain("setWizardCompleted");
    expect(editorSrc).not.toContain("router.replace");
    expect(productionHookSrc).toContain("persistWizardCompletedOnProduction");
  });

  it("wizard-happy-path still reaches Production via one Finish tap, not a deeplink", () => {
    expect(happyYaml).toContain('tapOn: "Finish"');
    expect(happyYaml).not.toMatch(/tapOn:\s*"Finish"[\s\S]*tapOn:\s*"Finish"/);
    expect(happyYaml).toContain("Total Array Output");
    expect(happyYaml).not.toMatch(/openLink:[\s\S]*production/);
    expect(wizardToProductionYaml).toContain('tapOn: "Finish"');
    expect(wizardToProductionYaml).not.toMatch(/openLink:[\s\S]*production/);
    expect(wizardToProductionYaml).not.toMatch(/tapOn:\s*"Finish"[\s\S]*tapOn:\s*"Finish"/);
  });
});

describe("persistWizardCompletedOnProduction", () => {
  it("writes the flag only when Production actually mounted incomplete", () => {
    const writes: boolean[] = [];
    persistWizardCompletedOnProduction({
      getWizardCompleted: () => false,
      setWizardCompleted: (completed) => {
        writes.push(completed);
      },
    });
    expect(writes).toEqual([true]);
  });

  it("does not rewrite when the wizard already completed", () => {
    persistWizardCompletedOnProduction({
      getWizardCompleted: () => true,
      setWizardCompleted: () => {
        throw new Error("must not write");
      },
    });
  });
});
