import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, resolve } from "node:path";
import { describe, it, expect } from "bun:test";
import {
  ANDROID_BOTTOM_TOOLBAR_HEIGHT,
  ANDROID_WIZARD_FINISH_A11Y,
  ANDROID_WIZARD_FINISH_HIT_HEIGHT,
  ANDROID_WIZARD_FINISH_HIT_WIDTH,
  ANDROID_WIZARD_FINISH_PRESS_PROOF_LABEL,
  ANDROID_WIZARD_FINISH_ZOOM_GAP,
  CONFIG_BOTTOM_TOOLBAR_INSET,
  PRODUCTION_PATH,
  androidFinishClearsZoomColumn,
  androidWizardFinishBottom,
  androidWizardFinishPressProofLabel,
  androidWizardFinishRight,
  configToolbarListInset,
  listAndroidFinishA11yNodes,
  persistWizardCompletedOnProduction,
  requestWizardFinish,
  shouldRedirectCustomToProduction,
  shouldRedirectWelcomeToProduction,
  shouldShowWizardFinish,
} from "../wizardChrome";
import {
  ZOOM_COLUMN_RIGHT,
  ZOOM_COLUMN_WIDTH,
} from "../zoomConstants";

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
const zoomSrc = readFileSync(
  resolve(import.meta.dir, "../../components/ZoomControls.tsx"),
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

describe("androidWizardFinishRight", () => {
  it("places Finish left of the zoom column that ate the af4f41c tap", () => {
    expect(ANDROID_WIZARD_FINISH_ZOOM_GAP).toBe(16);
    expect(androidWizardFinishRight()).toBe(
      ZOOM_COLUMN_RIGHT + ZOOM_COLUMN_WIDTH + ANDROID_WIZARD_FINISH_ZOOM_GAP,
    );
    expect(androidWizardFinishRight()).toBe(76);
    expect(androidFinishClearsZoomColumn(androidWizardFinishRight(), 48)).toBe(true);
    expect(androidFinishClearsZoomColumn(androidWizardFinishRight(), ANDROID_WIZARD_FINISH_HIT_WIDTH)).toBe(true);
    expect(androidFinishClearsZoomColumn(24, 48)).toBe(false);
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
    const redirectBranch = androidCustomSrc.indexOf(
      "if (shouldRedirectCustomToProduction(finishHref))",
    );
    expect(redirectBranch).toBeGreaterThan(-1);
    expect(redirectBranch).toBeLessThan(androidCustomSrc.indexOf("<SolarPanelCanvas"));
    expect(androidCustomSrc).toMatch(
      /if \(shouldRedirectCustomToProduction\(finishHref\)\) \{\s*return <Redirect/,
    );
    expect(zoomSrc).toContain("react-native-gesture-handler");
    expect(zoomSrc).toContain("ZOOM_COLUMN_RIGHT");
    expect(zoomSrc).toContain("elevation: 4");
    expect(chromeSrc).toContain("elevation: 16");
    expect(chromeSrc).toContain("androidFinishOverlay");
    expect(chromeSrc).toContain('pointerEvents="box-none"');
    expect(chromeSrc).toContain('pointerEvents="box-only"');
    expect(chromeSrc).toContain('from "react-native-gesture-handler"');
    expect(chromeSrc).toContain("GesturePressable");
    expect(chromeSrc).toContain("ANDROID_WIZARD_FINISH_HIT_WIDTH");
    expect(androidCustomSrc.indexOf("<ZoomControls")).toBeLessThan(
      androidCustomSrc.indexOf("<AndroidWizardFinishButton"),
    );
    expect(androidCustomSrc.indexOf("<AndroidWizardFinishButton")).toBeLessThan(
      androidCustomSrc.indexOf("<CustomBottomToolbar"),
    );
    expect(iosCustomSrc).toContain("shouldRedirectCustomToProduction");
    expect(iosCustomSrc).toContain("Redirect");
    expect(chromeSrc).toContain("AndroidWizardFinishButton");
    expect(chromeSrc).toContain("androidFinishHit");
    expect(chromeSrc).toContain("androidWizardFinishBottom");
    expect(chromeSrc).toContain("androidWizardFinishRight");
    expect(chromeSrc).toContain('Platform.OS !== "android"');
    expect(chromeSrc).toMatch(
      /Platform\.OS !== "android"[\s\S]*<WizardFinishButton/,
    );
    expect(chromeSrc).toContain("androidWizardFinishPressProofLabel");
    expect(chromeSrc).toContain("pressAndroidWizardFinish");
    expect(chromeSrc).toContain("AndroidWizardFinishGlyph");
    expect(chromeSrc.split('accessibilityLabel="Finish"').length - 1).toBe(0);
    const finishButton = chromeSrc.match(
      /export function AndroidWizardFinishButton[\s\S]*?export function CustomBottomToolbar/,
    )?.[0] ?? "";
    expect(finishButton).toContain("AndroidWizardFinishGlyph");
    expect(finishButton).not.toContain("<Text");
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

describe("androidWizardFinishPressProofLabel", () => {
  it("keeps Finish until press, then flips to Tapped without Redirect", () => {
    expect(ANDROID_WIZARD_FINISH_A11Y).toBe("Finish");
    expect(ANDROID_WIZARD_FINISH_PRESS_PROOF_LABEL).toBe("Tapped");
    expect(ANDROID_WIZARD_FINISH_HIT_WIDTH).toBe(188);
    expect(ANDROID_WIZARD_FINISH_HIT_HEIGHT).toBe(128);
    expect(androidWizardFinishPressProofLabel(false)).toBe("Finish");
    expect(androidWizardFinishPressProofLabel(true)).toBe("Tapped");
  });
});

describe("listAndroidFinishA11yNodes", () => {
  it("dumps exactly one Android Finish / FINISH a11y node", () => {
    const nodes = listAndroidFinishA11yNodes();
    expect(nodes).toEqual([
      {
        id: "AndroidWizardFinishButton",
        accessibilityLabel: "Finish",
        mountedOnAndroid: true,
      },
    ]);
    expect(nodes.filter((node) => node.mountedOnAndroid)).toHaveLength(1);
  });

  it("finds no extra Finish a11y props on Android product sources", () => {
    const roots = [
      resolve(import.meta.dir, "../../app"),
      resolve(import.meta.dir, "../../components"),
    ];
    const finishA11y = /(?:accessibilityLabel|contentDescription)\s*=\s*(?:\{["']|["'])(Finish|FINISH)["']/;
    const hits: string[] = [];

    const walk = (dir: string) => {
      for (const name of readdirSync(dir)) {
        const path = join(dir, name);
        const stat = statSync(path);
        if (stat.isDirectory()) {
          if (name === "__tests__") continue;
          walk(path);
          continue;
        }
        if (!name.endsWith(".tsx") && !name.endsWith(".ts")) continue;
        if (name.includes(".ios.") || name.includes(".web.")) continue;
        const src = readFileSync(path, "utf8");
        if (finishA11y.test(src)) {
          hits.push(path);
        }
      }
    };

    for (const root of roots) {
      walk(root);
    }

    expect(hits).toEqual([]);
    expect(chromeSrc).toContain("androidWizardFinishPressProofLabel");
    expect(chromeSrc).toContain('Platform.OS !== "android"');
  });

  it("does not mount an RN TextView that uiautomator can match as FINISH", () => {
    const glyphSrc = readFileSync(
      resolve(import.meta.dir, "../../components/AndroidWizardFinishGlyph.android.tsx"),
      "utf8",
    );
    expect(glyphSrc).toContain("@shopify/react-native-skia");
    expect(glyphSrc).toContain("SkiaText");
    expect(glyphSrc).not.toMatch(/import \{[^}]*\bText\b[^}]*\} from "react-native"/);
    expect(glyphSrc).not.toContain("<Text");
    expect(happyYaml).toContain('tapOn: "Finish"');
    expect(happyYaml).not.toContain("android-wizard-finish");
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
