import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, it, expect } from "bun:test";
import {
  ANALYZE_CONTINUE_WITHOUT_PHOTO_LABEL,
  ANALYZE_CONTINUE_WITHOUT_PHOTO_TEST_ID,
  ANALYZE_EMPTY_PREVIEW_LABEL,
  ANALYZE_MODEL_SECTION_TITLE,
  hasAnalyzeImage,
  modelPickerLabel,
  shouldShowAnalyzeAction,
  shouldShowAnalyzeSkip,
} from "../analyzeChrome";

const analyzeSrc = readFileSync(
  resolve(import.meta.dir, "../../app/analyze.tsx"),
  "utf8",
);
const appDir = resolve(import.meta.dir, "../../app");

describe("analyze chrome collapse", () => {
  it("uses one Analyze route with universal Picker and one bottom toolbar", () => {
    expect(existsSync(resolve(appDir, "analyze.ios.tsx"))).toBe(false);
    expect(existsSync(resolve(appDir, "analyze.android.tsx"))).toBe(false);
    expect(analyzeSrc).toContain('from "@expo/ui"');
    expect(analyzeSrc).not.toContain("@expo/ui/swift-ui");
    expect(analyzeSrc).not.toContain("@expo/ui/jetpack-compose");
    expect(analyzeSrc).toContain("<Picker");
    expect(analyzeSrc).toContain("<Picker.Item");
    expect(analyzeSrc).not.toContain("community/segmented-control");
    expect(analyzeSrc.match(/<Stack\.Toolbar placement="bottom">/g)?.length).toBe(1);
    expect(analyzeSrc).toContain("ANALYZE_MODEL_SECTION_TITLE");
    expect(analyzeSrc).toContain("ANALYZE_EMPTY_PREVIEW_LABEL");
    expect(analyzeSrc).toContain("analyze-empty-preview");
    expect(analyzeSrc).toContain("shouldShowAnalyzeSkip");
    expect(analyzeSrc).toContain("shouldShowAnalyzeAction");
  });

  it("uses a visible Android Pressable for Skip and Analyze toolbar text", () => {
    expect(analyzeSrc).toContain('Platform.OS === "android"');
    expect(analyzeSrc).toContain("Stack.Toolbar.View");
    expect(analyzeSrc).toContain("toolbarTextButton");
    expect(analyzeSrc).toContain('accessibilityLabel={label}');
    expect(analyzeSrc).toContain('label="Skip"');
    expect(analyzeSrc).toContain('label="Analyze"');
    expect(analyzeSrc).toContain("Stack.Toolbar.Button");
    expect(analyzeSrc).toMatch(/<Stack\.Toolbar\.Button[\s\S]*?>\s*Skip\s*<\/Stack\.Toolbar\.Button>/);
    expect(analyzeSrc).toMatch(/<Stack\.Toolbar\.Button[\s\S]*?>\s*Analyze\s*<\/Stack\.Toolbar\.Button>/);
  });

  it("names the empty-state fixture used when the gallery is empty", () => {
    expect(ANALYZE_EMPTY_PREVIEW_LABEL).toBe("No photo selected");
    expect(ANALYZE_CONTINUE_WITHOUT_PHOTO_LABEL).toBe("Continue without photo");
    expect(ANALYZE_CONTINUE_WITHOUT_PHOTO_TEST_ID).toBe("analyze-empty-state-button");
    expect(hasAnalyzeImage(undefined)).toBe(false);
    expect(hasAnalyzeImage("")).toBe(false);
    expect(hasAnalyzeImage("file:///tmp/roof.jpg")).toBe(true);
  });

  it("keeps a single Select AI Model title", () => {
    expect(ANALYZE_MODEL_SECTION_TITLE).toBe("Select AI Model");
    expect(ANALYZE_MODEL_SECTION_TITLE).not.toBe("SELECT AI MODEL");
  });

  it("labels the default model for the picker", () => {
    expect(modelPickerLabel({ name: "Claude Sonnet 4.6", isDefault: true })).toBe(
      "Claude Sonnet 4.6 (Default)",
    );
    expect(modelPickerLabel({ name: "Claude Opus 4.6", isDefault: false })).toBe(
      "Claude Opus 4.6",
    );
  });

  it("shows Skip in wizard mode except while processing", () => {
    expect(shouldShowAnalyzeSkip(true, "select_model")).toBe(true);
    expect(shouldShowAnalyzeSkip(true, "results")).toBe(true);
    expect(shouldShowAnalyzeSkip(true, "processing")).toBe(false);
    expect(shouldShowAnalyzeSkip(false, "select_model")).toBe(false);
    expect(shouldShowAnalyzeSkip(false, "results")).toBe(false);
  });

  it("shows Analyze only on the model picker phase", () => {
    expect(shouldShowAnalyzeAction("select_model")).toBe(true);
    expect(shouldShowAnalyzeAction("processing")).toBe(false);
    expect(shouldShowAnalyzeAction("results")).toBe(false);
  });
});
