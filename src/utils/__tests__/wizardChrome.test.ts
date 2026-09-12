import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, it, expect } from "bun:test";
import {
  ANDROID_BOTTOM_TOOLBAR_HEIGHT,
  CONFIG_BOTTOM_TOOLBAR_INSET,
  PRODUCTION_PATH,
  androidWizardFinishBottom,
  configToolbarListInset,
  persistWizardCompletedOnProduction,
  requestWizardFinish,
  shouldRedirectCustomToProduction,
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
const androidCustomSrc = readFileSync(
  resolve(import.meta.dir, "../../components/screens/CustomScreen.android.tsx"),
  "utf8",
);
const iosCustomSrc = readFileSync(
  resolve(import.meta.dir, "../../components/screens/CustomScreen.ios.tsx"),
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

describe("androidWizardFinishBottom", () => {
  it("sits Finish above the 64dp Android toolbar Host", () => {
    expect(ANDROID_BOTTOM_TOOLBAR_HEIGHT).toBe(64);
    expect(androidWizardFinishBottom(0)).toBe(76);
    expect(androidWizardFinishBottom(34)).toBe(110);
    expect(androidWizardFinishBottom(-8)).toBe(76);
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

describe("requestWizardFinish", () => {
  it("records the Production href and does not write wizardCompleted", () => {
    const hrefs: string[] = [];
    requestWizardFinish((href) => {
      hrefs.push(href);
    });
    expect(hrefs).toEqual([PRODUCTION_PATH]);
    expect(shouldRedirectCustomToProduction(PRODUCTION_PATH)).toBe(true);
    expect(shouldRedirectCustomToProduction(null)).toBe(false);
    expect(shouldRedirectCustomToProduction("/custom")).toBe(false);
  });

  it("Finish asks Custom to Redirect, not navigate/reset/push", () => {
    expect(editorSrc).toContain("requestWizardFinish");
    expect(editorSrc).toContain("setFinishHref");
    expect(editorSrc).not.toContain("useNavigation");
    expect(editorSrc).not.toContain("dispatchWizardFinish");
    expect(editorSrc).not.toContain("retryWizardFinishIfNeeded");
    expect(editorSrc).not.toContain("requestAnimationFrame");
    expect(editorSrc).not.toMatch(/setTimeout\s*\(/);
    expect(editorSrc).not.toContain("setWizardCompleted");
    expect(editorSrc).not.toContain("router.replace");
    expect(editorSrc).not.toContain("router.push('/production')");
    expect(androidCustomSrc).toContain("shouldRedirectCustomToProduction");
    expect(androidCustomSrc).toContain("Redirect");
    expect(androidCustomSrc).toContain("AndroidWizardFinishButton");
    expect(iosCustomSrc).toContain("shouldRedirectCustomToProduction");
    expect(iosCustomSrc).toContain("Redirect");
    expect(chromeSrc).toContain("AndroidWizardFinishButton");
    expect(chromeSrc).toContain("androidFinishHit");
    expect(chromeSrc).toContain("androidWizardFinishBottom");
    expect(chromeSrc).toContain('Platform.OS !== "android"');
    expect(chromeSrc).toMatch(
      /Platform\.OS !== "android"[\s\S]*<WizardFinishButton/,
    );
    expect(chromeSrc.split('accessibilityLabel="Finish"').length - 1).toBe(1);
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
