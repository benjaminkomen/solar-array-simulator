import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, it, expect } from "bun:test";

const customAndroid = readFileSync(
  resolve(import.meta.dir, "../../app/custom.android.tsx"),
  "utf8",
);
const productionAndroid = readFileSync(
  resolve(import.meta.dir, "../../app/production.android.tsx"),
  "utf8",
);
const layoutSrc = readFileSync(
  resolve(import.meta.dir, "../../app/_layout.tsx"),
  "utf8",
);
const canvasEditor = readFileSync(
  resolve(import.meta.dir, "../../hooks/useCanvasEditor.ts"),
  "utf8",
);
const tapAdd = readFileSync(
  resolve(import.meta.dir, "../../../.maestro/shared/tap-add-panel.yaml"),
  "utf8",
);
const happy = readFileSync(
  resolve(import.meta.dir, "../../../.maestro/wizard-happy-path.yaml"),
  "utf8",
);
const wizard = readFileSync(
  resolve(import.meta.dir, "../../../.maestro/shared/wizard-to-production.yaml"),
  "utf8",
);
const hideTools = readFileSync(
  resolve(import.meta.dir, "../../../.maestro/shared/hide-android-dev-client-tools.yaml"),
  "utf8",
);

function toolbarBlock(source: string, placement: "right" | "bottom"): string {
  const match = source.match(
    new RegExp(`<Stack\\.Toolbar placement="${placement}">[\\s\\S]*?<\\/Stack\\.Toolbar>`),
  );
  return match?.[0] ?? "";
}

describe("Android Custom toolbar hits", () => {
  it("uses native Toolbar.Button for Add panel instead of Host-wrapped Pressable", () => {
    const bottom = toolbarBlock(customAndroid, "bottom");
    expect(bottom).toContain('accessibilityLabel="Add panel"');
    expect(bottom).toMatch(/Stack\.Toolbar\.Button[\s\S]*accessibilityLabel="Add panel"/);
    expect(bottom).not.toContain("Host");
    expect(bottom).not.toMatch(/<Pressable[\s\S]*Add panel/);
  });

  it("keeps header-right compass, snap, and link as Toolbar.Button", () => {
    const right = toolbarBlock(customAndroid, "right");
    expect(right).toContain('accessibilityLabel="Toggle compass"');
    expect(right).toContain('accessibilityLabel="Snap to origin"');
    expect(right).toContain('accessibilityLabel="Unlinked panels"');
    expect(right).toContain("handleCompassToggle");
    expect(right).toContain("handleSnapToOrigin");
    expect(right).toContain("Toolbar.Badge");
    expect(right).not.toContain("Host");
    expect(right).not.toContain("Toolbar.View");
  });

  it("keeps selected-panel actions on Toolbar.Button", () => {
    const bottom = toolbarBlock(customAndroid, "bottom");
    expect(bottom).toContain('accessibilityLabel="Link inverter"');
    expect(bottom).toContain('accessibilityLabel="Rotate panel"');
    expect(bottom).toContain('accessibilityLabel="Delete panel"');
    expect(bottom).toMatch(/Stack\.Toolbar\.Button[\s\S]*handleLinkInverter/);
    expect(bottom).toMatch(/Stack\.Toolbar\.Button[\s\S]*handleRotatePanel/);
    expect(bottom).toMatch(/Stack\.Toolbar\.Button[\s\S]*handleDeletePanel/);
  });

  it("still hides Finish on an empty wizard canvas", () => {
    const bottom = toolbarBlock(customAndroid, "bottom");
    expect(bottom).toContain("shouldShowWizardFinish(isWizardMode, panels.length)");
    expect(bottom).toContain("Finish");
    expect(bottom).toContain("handleFinish");
  });

  it("queues Add panel when the canvas has not laid out yet", () => {
    expect(canvasEditor).toContain("pendingAddPanel");
    expect(canvasEditor).toMatch(/if \(width > 0 && height > 0\) \{[\s\S]*addPanel/);
    expect(canvasEditor).toContain("pendingAddPanel.current = true");
  });
});

describe("Android Production overflow stays in the header", () => {
  it("does not move Configuration options onto the output card", () => {
    expect(productionAndroid).toContain("PRODUCTION_MENU_A11Y_ANDROID");
    expect(productionAndroid).toMatch(/placement="right"[\s\S]*Toolbar\.Menu/);
    expect(productionAndroid).not.toContain("DropdownMenu");
    expect(productionAndroid).not.toContain("cardMenu");
    expect(layoutSrc).toContain("hideDevClientToolsButton");
    expect(hideTools).toContain('tapOn: "Tools button"');
  });
});

describe("Maestro Add panel is a single tap", () => {
  it("does not retry-storm tap-add-panel", () => {
    expect(tapAdd).toContain('tapOn: "Add panel"');
    expect(tapAdd).not.toContain("repeat:");
    expect(happy).toContain("tap-add-panel");
    expect(happy.indexOf('assertNotVisible: "Finish"')).toBeLessThan(happy.indexOf("tap-add-panel"));
    expect(happy.indexOf("tap-add-panel")).toBeLessThan(happy.indexOf('assertVisible: "Finish"'));
    expect(happy).not.toMatch(/repeat:[\s\S]*tap-add-panel/);
    expect(wizard).not.toMatch(/repeat:[\s\S]*tap-add-panel/);
  });
});
