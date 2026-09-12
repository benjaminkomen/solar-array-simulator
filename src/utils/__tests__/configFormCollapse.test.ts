import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, it, expect } from "bun:test";

const repoRoot = resolve(import.meta.dir, "../../..");
const src = (...parts: string[]) => resolve(repoRoot, "src", ...parts);

const configSrc = readFileSync(src("app/config.tsx"), "utf8");
const layoutSrc = readFileSync(src("app/_layout.tsx"), "utf8");
const uploadSrc = readFileSync(src("app/upload.tsx"), "utf8");
const roofIosSrc = readFileSync(src("components/config/RoofTypePicker.ios.tsx"), "utf8");
const roofAndroidSrc = readFileSync(src("components/config/RoofTypePicker.android.tsx"), "utf8");
const inverterIosSrc = readFileSync(src("components/config/InverterSection.ios.tsx"), "utf8");
const inverterAndroidSrc = readFileSync(
  src("components/config/InverterSection.android.tsx"),
  "utf8",
);
const productionSrc = readFileSync(src("app/production.tsx"), "utf8");
const appJson = readFileSync(resolve(repoRoot, "app.json"), "utf8");
const pickerTypesSrc = readFileSync(
  resolve(repoRoot, "node_modules/@expo/ui/src/universal/Picker/types.ts"),
  "utf8",
);

describe("config FieldGroup collapse", () => {
  it("uses one FieldGroup body in config.tsx", () => {
    expect(configSrc).toContain("from '@expo/ui'");
    expect(configSrc).toContain("<FieldGroup>");
    expect(configSrc).toContain("<FieldGroup.Section");
    expect(configSrc).toContain("Default Production");
    expect(configSrc).toContain("Continue");
    expect(existsSync(src("app/config.ios.tsx"))).toBe(false);
    expect(existsSync(src("app/config.android.tsx"))).toBe(false);
    expect(existsSync(src("app/config.web.tsx"))).toBe(true);
  });

  it("keeps platform UI imports out of the shared Config route", () => {
    expect(configSrc).not.toContain("@expo/ui/swift-ui");
    expect(configSrc).not.toContain("@expo/ui/jetpack-compose");
    expect(configSrc).not.toContain("pickerStyle('segmented')");
    expect(configSrc).not.toContain("List.ForEach");
    expect(configSrc).not.toContain("SwipeToDismissBox");
    expect(configSrc).not.toContain("<Stack.Screen");
  });

  it("documents that universal Picker has no segmented appearance", () => {
    expect(pickerTypesSrc).toContain("'wheel' | 'menu'");
    expect(pickerTypesSrc).not.toMatch(/segmented/);
    expect(roofIosSrc).toContain("pickerStyle('segmented')");
    expect(roofIosSrc).toContain("@expo/ui/swift-ui");
    expect(roofAndroidSrc).toContain("SingleChoiceSegmentedButtonRow");
    expect(roofAndroidSrc).toContain("SegmentedButton");
    expect(configSrc).toContain("<RoofTypePicker");
  });

  it("keeps a real platform delete gesture for inverter rows", () => {
    expect(inverterIosSrc).toContain("List.ForEach");
    expect(inverterIosSrc).toContain("onDelete");
    expect(inverterAndroidSrc).toContain("SwipeToDismissBox");
    expect(inverterAndroidSrc).toContain("onEndToStart");
    expect(configSrc).toContain("<InverterSection");
  });

  it("puts Config and Upload header options in _layout", () => {
    expect(layoutSrc).toMatch(/name="config"[\s\S]*headerBackButtonDisplayMode:\s*"minimal"/);
    expect(layoutSrc).toMatch(/name="upload"[\s\S]*headerBackButtonDisplayMode:\s*"minimal"/);
    expect(uploadSrc).not.toContain("Stack.Screen.BackButton");
    expect(uploadSrc).not.toContain("<Stack.Screen");
  });

  it("does not put Host on Upload first paint", () => {
    expect(existsSync(src("app/upload.ios.tsx"))).toBe(false);
    expect(existsSync(src("app/upload.android.tsx"))).toBe(false);
    expect(uploadSrc).not.toMatch(/from ["']@expo\/ui/);
    expect(uploadSrc).not.toMatch(/<Host[\s>]/);
    expect(uploadSrc).not.toContain("@expo/ui/swift-ui");
    expect(uploadSrc).not.toContain("@expo/ui/jetpack-compose");
  });

  it("does not flip Hermes V1 or move the Production overflow", () => {
    expect(appJson).toContain('"useHermesV1": true');
    expect(productionSrc).toContain('placement="right"');
    expect(productionSrc).toContain("Toolbar.Menu");
    expect(productionSrc).toContain("Simulate");
    expect(productionSrc).not.toContain("cardMenu");
  });
});
