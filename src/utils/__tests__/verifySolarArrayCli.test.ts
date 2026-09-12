import { describe, it, expect } from "bun:test";
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import {
  MAESTRO_DRIVER_STARTUP_TIMEOUT_MS,
  parseAdbDevices,
  parseBootedSimulators,
} from "../../../.cursor/skills/verify-solar-array/control.mjs";
import { readAppRouteSource } from "./readAppRouteSource";

const repoRoot = resolve(import.meta.dir, "../../..");
const cli = join(repoRoot, ".cursor/skills/verify-solar-array/control.mjs");
const evidenceDir = join(repoRoot, ".agents/evidence/verify-solar-array");
const scratchDir = join(repoRoot, ".agents/scratch/verify-solar-array");

function run(args: string[]) {
  return spawnSync("node", [cli, ...args], {
    encoding: "utf8",
    cwd: repoRoot,
  });
}

describe("verify-solar-array CLI", () => {
  it("route-source hook prefers leftover Custom mounts and falls back after collapse", () => {
    const custom = readAppRouteSource(repoRoot, "custom", "android");
    expect(custom.file.endsWith("CustomScreen.android.tsx")).toBe(true);
    const upload = readAppRouteSource(repoRoot, "upload", "android");
    expect(upload.file.endsWith("upload.tsx")).toBe(true);
    const analyze = readAppRouteSource(repoRoot, "analyze", "ios");
    expect(analyze.file.endsWith("analyze.tsx")).toBe(true);
    const simulation = readAppRouteSource(repoRoot, "simulation", "ios");
    expect(simulation.file.endsWith("simulation.tsx")).toBe(true);
    const production = readAppRouteSource(repoRoot, "production", "android");
    expect(production.file.endsWith("production.tsx")).toBe(true);
    expect(production.src).toContain("Toolbar.Menu");
    const config = readAppRouteSource(repoRoot, "config", "ios");
    expect(config.file.endsWith("config.tsx")).toBe(true);
    const compass = readAppRouteSource(repoRoot, "compass-help", "ios");
    expect(compass.file.endsWith("compass-help.tsx")).toBe(true);
  });

  it("lists full-app-tour as a top-level flow", () => {
    const result = run(["list-flows", "--json"]);
    expect(result.status).toBe(0);
    const payload = JSON.parse(result.stdout);
    const ids = payload.flows.map((f: { id: string }) => f.id);
    expect(ids).toContain("full-app-tour");
    expect(ids).toContain("details-sheets");
    expect(ids).toContain("wizard-happy-path");
    expect(ids).toContain("production-menu");
    expect(ids).toContain("simulation-nav");
    expect(ids).toContain("analyze-skip");
  });

  it("prints a command surface on --help", () => {
    const result = run(["--help"]);
    expect(result.status).toBe(0);
    expect(result.stdout).toContain("doctor");
    expect(result.stdout).toContain("features");
    expect(result.stdout).toContain("smoke");
    expect(result.stdout).toContain("run-flow");
    expect(result.stdout).toContain("--backend=maestro|eas|mac");
  });

  it("doctor reports maestro backend and no-device honestly", () => {
    const result = run(["doctor", "--json"]);
    expect(result.status).toBe(0);
    const report = JSON.parse(result.stdout);
    expect(report.ok).toBe(true);
    expect(report.appId).toBe("com.bkomen.solararraysimulator");
    expect(report.backend.id).toBe("maestro");
    expect(report.backend.implemented).toBe(true);
    expect(report.featureMap.count).toBeGreaterThanOrEqual(8);
    expect(report.flows.names).toContain("smoke-test");
    expect(report.flows.names).toContain("full-app-tour");
    expect(report.flows.names).toContain("details-sheets");
    expect(report.featureMap.features).toEqual([
      "analyze",
      "compass-help",
      "config",
      "custom",
      "production",
      "simulation",
      "upload",
      "welcome",
    ]);
    expect(report.eas.androidDevelopment.hint).toContain("emulator-5554");
    expect(report.eas.androidDevelopment.hint).toContain("Generac-only");
    expect(report.eas.profiles.every((p: { iosSimulator: boolean }) => p.iosSimulator)).toBe(true);
    expect(Array.isArray(report.howToSmokeLocally)).toBe(true);
    if (!report.device.available) {
      expect(report.warnings.some((w: string) => w.includes("no device"))).toBe(true);
    }
    expect(report.device.ios).toBeDefined();
    expect(report.device.android).toBeDefined();
    expect(typeof report.device.ios.available).toBe("boolean");
    expect(typeof report.device.android.available).toBe("boolean");
    expect(report.eas.androidDevelopment.present).toBe(true);
    expect(report.eas.androidDevelopment.developmentClient).toBe(true);
  });

  it("parses adb devices and booted simctl lines", () => {
    const android = parseAdbDevices(
      "List of devices attached\nemulator-5554\tdevice\nR58M123\toffline\n",
    );
    expect(android).toEqual([
      { serial: "emulator-5554", state: "device", emulator: true },
      { serial: "R58M123", state: "offline", emulator: false },
    ]);
    const ios = parseBootedSimulators(
      "== Devices ==\n-- iOS 26.0 --\n    iPhone 17 (A1B2C3D4-E5F6-7890-ABCD-EF1234567890) (Booted)\n",
    );
    expect(ios).toEqual([
      { name: "iPhone 17", udid: "A1B2C3D4-E5F6-7890-ABCD-EF1234567890" },
    ]);
  });

  it("rejects an unknown --platform", () => {
    const result = run(["smoke", "--platform=blackberry"]);
    expect(result.status).toBe(1);
    expect(result.stderr).toContain("Unknown platform");
  });

  it("launch-fresh branches iOS 127.0.0.1 and Android 10.0.2.2", () => {
    const dispatcher = readFileSync(join(repoRoot, ".maestro/shared/launch-fresh.yaml"), "utf8");
    const ios = readFileSync(join(repoRoot, ".maestro/shared/launch-fresh.ios.yaml"), "utf8");
    const android = readFileSync(join(repoRoot, ".maestro/shared/launch-fresh.android.yaml"), "utf8");
    const hideToolsYaml = readFileSync(
      join(repoRoot, ".maestro/shared/hide-android-dev-client-tools.yaml"),
      "utf8",
    );
    expect(dispatcher).toContain("platform: iOS");
    expect(dispatcher).toContain("platform: Android");
    expect(ios).toContain("127.0.0.1");
    expect(ios).not.toContain("DEVELOPMENT SERVERS");
    expect(ios).toContain("extendedWaitUntil:");
    expect(ios).toContain("Continue");
    expect(android).toContain("10.0.2.2");
    expect(android).toContain("disableOnboarding=1");
    // Android: wait for Home before openLink, then Recently Opened / typed Connect,
    // then dismiss Dev Menu (Go home / Close) or tap Continue — do not block on Continue.
    expect(android.indexOf("DEVELOPMENT SERVERS")).toBeLessThan(android.indexOf("openLink:"));
    expect(android).toContain("METRO_URL_PLAIN");
    expect(android).toContain("http://10.0.2.2:8081");
    expect(android).toContain("exp://");
    expect(android).toContain("inputText:");
    expect(android).toContain("Connect");
    expect(android).toContain("notVisible: ${METRO_URL_PLAIN}");
    expect(android).toContain("Go home");
    expect(android).toContain("Close");
    expect(android).toContain('tapOn: "Continue"');
    expect(android).toContain("repeat:");
    expect(android).toContain("hide-android-dev-client-tools.yaml");
    expect(android).toContain("Tools button");
    const hideTools = android.indexOf("hide-android-dev-client-tools.yaml");
    const goHomeVisible = android.indexOf('visible: "Go home"');
    expect(hideTools).toBeGreaterThan(-1);
    expect(hideTools).toBeLessThan(goHomeVisible);
    expect(hideToolsYaml).toContain('tapOn: "Tools button"');
    expect(hideToolsYaml).toContain('visible: "Tools button"');
    expect(hideToolsYaml).toContain("extendedWaitUntil:");
    expect(hideToolsYaml).toContain('tapOn: "Tools"');
    expect(android).not.toMatch(/extendedWaitUntil:[\s\S]*visible: \"Continue\"[\s\S]*timeout: 90000/);
    expect(android.indexOf("Go home")).toBeLessThan(android.lastIndexOf("Continue"));
  });

  it("analyze-skip does not open the Android system gallery", () => {
    const flow = readFileSync(join(repoRoot, ".maestro/analyze-skip.yaml"), "utf8");
    const uploadSrc = readFileSync(join(repoRoot, "src/app/upload.tsx"), "utf8");
    const analyze = readFileSync(join(repoRoot, "src/app/analyze.tsx"), "utf8");
    expect(existsSync(join(repoRoot, "src/app/upload.android.tsx"))).toBe(false);
    expect(existsSync(join(repoRoot, "src/app/upload.ios.tsx"))).toBe(false);
    expect(uploadSrc).toContain("ANALYZE_CONTINUE_WITHOUT_PHOTO_TEST_ID");
    expect(uploadSrc).toContain("ANALYZE_CONTINUE_WITHOUT_PHOTO_LABEL");
    expect(uploadSrc).toContain("handleContinueWithoutPhoto");
    expect(uploadSrc).toContain("isWizardMode &&");
    expect(analyze).toContain("ANALYZE_EMPTY_PREVIEW_LABEL");
    expect(analyze).toContain("analyze-empty-preview");
    expect(analyze).toContain("Stack.Toolbar.View");
    expect(analyze).toContain('accessibilityLabel={label}');
    expect(analyze).toContain('label="Skip"');
    const androidBlock = flow.slice(flow.indexOf("platform: Android"));
    expect(androidBlock).toContain("analyze-empty-state-button");
    expect(androidBlock).not.toContain("choose-gallery-button");
    expect(flow).toContain("No photo selected");
    expect(flow.indexOf("platform: iOS")).toBeLessThan(flow.indexOf("choose-gallery-button"));
  });

  it("simulation-nav takes 3D proof while Simulation chrome is visible", () => {
    const flow = readFileSync(join(repoRoot, ".maestro/simulation-nav.yaml"), "utf8");
    const winter = flow.indexOf('assertVisible: "Winter"');
    const screenshot = flow.indexOf("takeScreenshot: sim-3d-proof");
    const reassert = flow.indexOf('assertVisible: "Simulation"', flow.indexOf("Winter"));
    expect(winter).toBeGreaterThan(-1);
    expect(screenshot).toBeGreaterThan(winter);
    expect(reassert).toBeGreaterThan(winter);
    expect(reassert).toBeLessThan(screenshot);
    expect(flow).not.toContain("webgpu-scene-painted");
    expect(flow).not.toMatch(/timeout: 90000/);
    expect(flow).toContain("panel + sun");
  });

  it("Android Production menu and empty-canvas Finish match iOS product rules", () => {
    const more = readFileSync(join(repoRoot, ".maestro/shared/tap-more-options.yaml"), "utf8");
    const menu = readFileSync(join(repoRoot, ".maestro/production-menu.yaml"), "utf8");
    const wizard = readFileSync(join(repoRoot, ".maestro/shared/wizard-to-production.yaml"), "utf8");
    const happy = readFileSync(join(repoRoot, ".maestro/wizard-happy-path.yaml"), "utf8");
    const productionScreen = readFileSync(join(repoRoot, "src/app/production.tsx"), "utf8");
    expect(more).toContain("platform: Android");
    expect(more).toContain('tapOn: "Configuration options"');
    expect(more.indexOf("platform: Android")).toBeLessThan(more.lastIndexOf("Configuration options"));
    expect(more.slice(more.indexOf("platform: Android"))).not.toMatch(/tapOn:\s*"More options"/);
    expect(menu).toContain('assertNotVisible: "Reload"');
    expect(menu).toContain('assertNotVisible: "Go home"');
    expect(menu.indexOf("tap-more-options")).toBeLessThan(menu.indexOf('assertNotVisible: "Reload"'));
    expect(menu.indexOf('assertNotVisible: "Reload"')).toBeLessThan(menu.indexOf('tapOn: "Edit Configuration"'));
    expect(productionScreen).toContain("Toolbar.Menu");
    expect(productionScreen).toMatch(/placement="right"[\s\S]*Toolbar\.Menu/);
    expect(productionScreen).not.toContain("DropdownMenu");
    expect(productionScreen).toContain("productionMenuA11y");
    expect(more).toContain("header-right");
    expect(wizard).toContain('assertNotVisible: "Finish"');
    expect(wizard.indexOf('assertNotVisible: "Finish"')).toBeLessThan(wizard.indexOf("tap-add-panel"));
    expect(happy).toContain('assertNotVisible: "Finish"');
    expect(happy.indexOf('assertNotVisible: "Finish"')).toBeLessThan(happy.indexOf("tap-add-panel"));
    expect(happy).toContain('tapOn: "Finish"');
    expect(happy).toContain("Total Array Output");
    expect(happy).not.toMatch(/openLink:[\s\S]*production/);
    expect(wizard).not.toMatch(/openLink:[\s\S]*production/);
    const details = readFileSync(join(repoRoot, ".maestro/details-sheets.yaml"), "utf8");
    expect(details).toContain("inverter-row-1");
    expect(details).toContain("panelId=seed-panel");
    expect(details).not.toContain("tap-add-panel");
    expect(details).not.toContain("inverter-details?mode=edit");
    expect(details).toContain("scrollUntilVisible");
    expect(details).toContain("visibilityPercentage: 100");
    const firstSave = details.indexOf('tapOn: "Save"');
    expect(details.slice(firstSave)).toContain('visible: "Continue"');
  });

  it("features lists the Feature Map", () => {
    const result = run(["features", "--json"]);
    expect(result.status).toBe(0);
    const payload = JSON.parse(result.stdout);
    const ids = payload.features.map((f: { id: string }) => f.id);
    expect(ids).toContain("welcome");
    expect(ids).toContain("config");
    expect(ids).toContain("upload");
    expect(ids).toContain("analyze");
    expect(ids).toContain("custom");
    expect(ids).toContain("production");
    expect(ids).toContain("simulation");
    expect(ids).toContain("compass-help");
    expect(payload.count).toBe(8);
  });

  it("feature map stays honest about current-main product diffs", () => {
    const featuresDir = join(repoRoot, ".cursor/skills/verify-solar-array/features");
    const readme = readFileSync(join(featuresDir, "README.md"), "utf8");
    const production = readFileSync(join(featuresDir, "production.md"), "utf8");
    const custom = readFileSync(join(featuresDir, "custom.md"), "utf8");
    const analyze = readFileSync(join(featuresDir, "analyze.md"), "utf8");
    const simulation = readFileSync(join(featuresDir, "simulation.md"), "utf8");
    const welcome = readFileSync(join(featuresDir, "welcome.md"), "utf8");
    const skill = readFileSync(
      join(repoRoot, ".cursor/skills/verify-solar-array/SKILL.md"),
      "utf8",
    );

    expect(readme).toContain("[Welcome](welcome.md)");
    expect(readme).toContain("[Config](config.md)");
    expect(readme).toContain("[Upload](upload.md)");
    expect(readme).toContain("[Analyze](analyze.md)");
    expect(readme).toContain("[Custom](custom.md)");
    expect(readme).toContain("[Production](production.md)");
    expect(readme).toContain("[Simulation](simulation.md)");
    expect(readme).toContain("[Compass help](compass-help.md)");
    expect(readme).toContain('Do **not** write "iOS-only route" or "Android-only route"');
    expect(readme).toContain("Every listed screen exists on both platforms");
    expect(readme).toContain("Configuration options");
    expect(readme).toContain("More options");
    expect(readme).toContain("emulator-5554");
    expect(readme).toContain("Generac-only");
    expect(readme).toContain("MAESTRO_DRIVER_STARTUP_TIMEOUT=180000");
    expect(readme).toContain("full-app-tour");
    expect(readme).toContain("Already universal");
    expect(readme).toContain("Leftover platform chrome");
    expect(readme).not.toContain("Remaining platform stubs");
    expect(readme).toContain("#56");
    expect(readme).not.toContain("hold #56");
    expect(readme).toContain("src/app/upload.tsx");
    expect(readme).toContain("src/app/analyze.tsx");
    expect(readme).toContain("src/app/simulation.tsx");
    expect(readme).toContain("details-sheets");

    expect(production).toContain("src/app/production.tsx");
    expect(production).toContain("no `production.ios.tsx`");
    expect(production).toContain("Configuration options");
    expect(production).toContain("More options");
    expect(production).toContain("Reload");
    expect(production).toContain("Go home");
    const config = readFileSync(join(featuresDir, "config.md"), "utf8");
    const compass = readFileSync(join(featuresDir, "compass-help.md"), "utf8");
    const upload = readFileSync(join(featuresDir, "upload.md"), "utf8");
    expect(config).toContain("src/app/config.tsx");
    expect(config).toContain("config.web.tsx");
    expect(config).not.toContain("product UI is `src/app/config.ios.tsx`");
    expect(compass).toContain("src/app/compass-help.tsx");
    expect(compass).toContain("old `compass-help.ios.tsx`");
    expect(upload).toContain("src/app/upload.tsx");
    expect(upload).toContain("Do not paper this as still-split");
    expect(upload).toContain("analyze-empty-state-button");
    expect(custom).toContain("shouldShowWizardFinish");
    expect(custom).toContain('Assert "Finish" is **not** visible');
    expect(custom).toContain("CustomChrome");
    expect(custom).toContain("CustomScreen.ios.tsx");
    expect(custom).not.toContain("hold #56");
    expect(analyze).toContain("Select AI Model");
    expect(analyze).toContain("Do not wait for `SELECT AI MODEL`");
    expect(analyze).toContain("analyze-empty-state-button");
    expect(analyze).toContain("verified-unreachable");
    expect(simulation).toContain("sim-3d-proof");
    expect(simulation).toContain("Do not wait on `webgpu-scene-painted`");
    expect(simulation).toContain("SeasonPicker");
    expect(simulation).toContain("community/segmented-control");
    expect(simulation).not.toContain("SeasonPicker.ios.tsx");
    expect(config).toContain("community/segmented-control");
    expect(config).toContain("RoofTypePicker.android.tsx");
    expect(config).toContain("RNHostView");
    expect(config).not.toContain("RoofTypePicker.ios.tsx");
    expect(simulation).toContain("panelsForSimulationScene");
    expect(welcome).toContain("Tools button");
    expect(welcome).toContain("10.0.2.2:8081");
    expect(skill).toContain("MAESTRO_DRIVER_STARTUP_TIMEOUT=180000");
    expect(skill).toContain("Generac-only");
    expect(skill).toContain("emulator-5554");
    expect(skill).toContain("Do not invent a full-app video");
    expect(skill).toContain("details-sheets");
    expect(skill).toContain("Select AI Model");
  });

  it("full-app-tour encodes the honesty facts and is a top-level flow", () => {
    const tour = readFileSync(join(repoRoot, ".maestro/full-app-tour.yaml"), "utf8");
    expect(tour).toContain("shared/launch-fresh.yaml");
    expect(tour).toContain('assertNotVisible: "Finish"');
    expect(tour.indexOf('assertNotVisible: "Finish"')).toBeLessThan(tour.indexOf("tap-add-panel"));
    expect(tour).toContain("Toggle compass");
    expect(tour).toContain("Array Orientation");
    expect(tour).toContain("tap-more-options.yaml");
    expect(tour).toContain('assertNotVisible: "Reload"');
    expect(tour).toContain('assertNotVisible: "Go home"');
    expect(tour).toContain("takeScreenshot: sim-3d-proof");
    expect(tour).toContain("iPhone 17");
    expect(tour).not.toContain("webgpu-scene-painted");
    expect(MAESTRO_DRIVER_STARTUP_TIMEOUT_MS).toBe("180000");
  });

  it("eas and mac backends refuse drive commands with a plug-in hint", () => {
    for (const backend of ["eas", "mac"]) {
      const result = run(["smoke", `--backend=${backend}`, "--json"]);
      expect(result.status).toBe(2);
      const payload = JSON.parse(result.stdout);
      expect(payload.ok).toBe(false);
      expect(payload.implemented).toBe(false);
      expect(payload.error).toContain("not wired yet");
      if (backend === "eas") {
        expect(payload.error).toContain("Generac-only");
      }
    }
  });

  it("doctor on eas/mac stays honest and exits 0", () => {
    const result = run(["doctor", "--backend=eas", "--json"]);
    expect(result.status).toBe(0);
    const report = JSON.parse(result.stdout);
    expect(report.backend.implemented).toBe(false);
    expect(report.backend.hint).toContain("not wired yet");
  });

  it("rejects an unknown backend", () => {
    const result = run(["doctor", "--backend=sorcery"]);
    expect(result.status).toBe(1);
    expect(result.stderr).toContain("Unknown backend");
  });

  it("cleanup does not delete evidence", () => {
    mkdirSync(evidenceDir, { recursive: true });
    mkdirSync(scratchDir, { recursive: true });
    const marker = join(evidenceDir, "keep-me.json");
    writeFileSync(marker, "{\"keep\":true}\n");
    writeFileSync(join(scratchDir, "tmp.txt"), "scratch\n");

    const result = run(["cleanup", "--json"]);
    expect(result.status).toBe(0);
    const payload = JSON.parse(result.stdout);
    expect(payload.evidencePreserved).toBe(true);
    expect(existsSync(marker)).toBe(true);
    expect(JSON.parse(readFileSync(marker, "utf8")).keep).toBe(true);
    expect(existsSync(scratchDir)).toBe(false);

    rmSync(marker);
  });
});
