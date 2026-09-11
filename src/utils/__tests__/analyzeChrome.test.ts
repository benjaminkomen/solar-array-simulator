import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, it, expect } from "bun:test";
import {
  ANALYZE_MODEL_SECTION_TITLE,
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
    expect(analyzeSrc.match(/<Stack\.Toolbar placement="bottom">/g)?.length).toBe(1);
    expect(analyzeSrc).toContain("ANALYZE_MODEL_SECTION_TITLE");
    expect(analyzeSrc).toContain("shouldShowAnalyzeSkip");
    expect(analyzeSrc).toContain("shouldShowAnalyzeAction");
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
