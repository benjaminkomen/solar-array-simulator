import { describe, it, expect } from "bun:test";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const simulationViewPath = resolve(import.meta.dir, "../SimulationView.tsx");

describe("SimulationView import graph", () => {
  it("does not statically import react-native-wgpu or fiber-canvas", () => {
    const source = readFileSync(simulationViewPath, "utf8");
    expect(source).not.toMatch(
      /import\s+.*from\s+["']react-native-wgpu["']/,
    );
    expect(source).not.toMatch(
      /import\s+.*from\s+["']react-native-webgpu["']/,
    );
    expect(source).not.toMatch(
      /import\s+\{[^}]*FiberCanvas[^}]*\}\s+from\s+["']@\/lib\/fiber-canvas["']/,
    );
    expect(source).toContain('import("@/lib/fiber-canvas")');
    expect(source).toContain("tryEnableWebGPU");
  });
});
