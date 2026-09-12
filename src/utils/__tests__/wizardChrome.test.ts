import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, it, expect } from "bun:test";
import {
  CONFIG_BOTTOM_TOOLBAR_INSET,
  PRODUCTION_PATH,
  PRODUCTION_ROUTE_NAME,
  configToolbarListInset,
  dispatchWizardFinish,
  persistWizardCompletedOnProduction,
  wizardFinishResetState,
  pressWizardFinish,
  runWizardFinish,
  shouldRedirectWelcomeToProduction,
  shouldShowWizardFinish,
  syncWizardFinishPressRefs,
} from "../wizardChrome";

const indexSrc = readFileSync(
  resolve(import.meta.dir, "../../app/index.tsx"),
  "utf8",
);
const editorSrc = readFileSync(
  resolve(import.meta.dir, "../../hooks/useCanvasEditor.ts"),
  "utf8",
);
const chromeSrc = readFileSync(
  resolve(import.meta.dir, "../../components/CustomChrome.tsx"),
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

describe("pressWizardFinish", () => {
  it("is a no-op while the empty-canvas ref is false, then fires after Add", () => {
    const calls: string[] = [];
    const refs = {
      visible: { current: false },
      onFinish: {
        current: () => {
          calls.push("finish");
        },
      },
    };
    const cachedPress = () => {
      pressWizardFinish(refs);
    };

    cachedPress();
    expect(calls).toEqual([]);

    syncWizardFinishPressRefs(refs, true, () => {
      calls.push("finish");
    });
    cachedPress();
    expect(calls).toEqual(["finish"]);
  });

  it("does not close over the empty-canvas visible boolean in CustomChrome", () => {
    const finishBlock =
      chromeSrc.match(/function WizardFinishButton[\s\S]*?function CustomBottomToolbar/)?.[0] ?? "";
    expect(finishBlock).toContain("pressWizardFinish");
    expect(finishBlock).toContain("syncWizardFinishPressRefs");
    expect(finishBlock).toContain("hidden={!visible}");
    expect(finishBlock).not.toContain("if (visible)");
    expect(finishBlock).not.toContain("disabled={!visible}");
    expect(chromeSrc).toContain("hidden={!selectedId}");
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

  it("resets the stack to Production so Custom cannot stay on top", () => {
    const stacks: ReturnType<typeof wizardFinishResetState>[] = [];
    dispatchWizardFinish({
      reset: (state) => {
        stacks.push(state as ReturnType<typeof wizardFinishResetState>);
      },
    });
    expect(wizardFinishResetState()).toEqual({
      index: 0,
      routes: [{ name: PRODUCTION_ROUTE_NAME }],
    });
    expect(stacks).toEqual([wizardFinishResetState()]);
  });

  it("Finish resets to Production and leaves persist to the Production mount", () => {
    expect(editorSrc).toContain("dispatchWizardFinish");
    expect(editorSrc).toContain("useNavigation");
    expect(editorSrc).not.toContain("retryWizardFinishIfNeeded");
    expect(editorSrc).not.toContain("requestAnimationFrame");
    expect(editorSrc).not.toContain("expoRouter.push");
    expect(editorSrc).not.toMatch(/setTimeout\s*\(/);
    expect(editorSrc).not.toContain("setWizardCompleted");
    expect(editorSrc).not.toContain("router.replace");
    expect(editorSrc).not.toContain("router.push('/production')");
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
