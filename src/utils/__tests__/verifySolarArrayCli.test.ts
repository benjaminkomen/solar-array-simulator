import { describe, it, expect } from "bun:test";
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { parseAdbDevices, parseBootedSimulators } from "../../../.cursor/skills/verify-solar-array/control.mjs";

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
    expect(dispatcher).toContain("platform: iOS");
    expect(dispatcher).toContain("platform: Android");
    expect(ios).toContain("127.0.0.1");
    expect(ios).not.toContain("DEVELOPMENT SERVERS");
    expect(ios).toContain("extendedWaitUntil:");
    expect(ios).toContain("Continue");
    expect(android).toContain("10.0.2.2");
    expect(android).toContain("disableOnboarding=1");
    // Android: wait for Home before openLink, then Recently Opened / typed Connect,
    // then wait for Continue (not a one-shot optional check).
    expect(android.indexOf("DEVELOPMENT SERVERS")).toBeLessThan(android.indexOf("openLink:"));
    expect(android).toContain("METRO_URL_PLAIN");
    expect(android).toContain("http://10.0.2.2:8081");
    expect(android).toContain("exp://");
    expect(android).toContain("inputText:");
    expect(android).toContain("Connect");
    expect(android).toContain("notVisible: ${METRO_URL_PLAIN}");
    expect(android).toContain("notVisible: \"Solar Array Simulator\"");
    expect(android).toMatch(/extendedWaitUntil:[\s\S]*visible: \"Continue\"[\s\S]*timeout: 90000/);
  });

  it("simulation-nav settles Android WebGPU before 3D proof", () => {
    const flow = readFileSync(join(repoRoot, ".maestro/simulation-nav.yaml"), "utf8");
    expect(flow).toContain("platform: Android");
    expect(flow).toContain("webgpu-scene-painted");
    expect(flow).toContain("timeout: 90000");
    expect(flow).toContain("optional: true");
    expect(flow).toContain("takeScreenshot: sim-3d-proof");
    expect(flow).not.toMatch(/waitForAnimationToEnd:[\s\S]*timeout: 20000/);
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
  });

  it("eas and mac backends refuse drive commands with a plug-in hint", () => {
    for (const backend of ["eas", "mac"]) {
      const result = run(["smoke", `--backend=${backend}`, "--json"]);
      expect(result.status).toBe(2);
      const payload = JSON.parse(result.stdout);
      expect(payload.ok).toBe(false);
      expect(payload.implemented).toBe(false);
      expect(payload.error).toContain("not wired yet");
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
