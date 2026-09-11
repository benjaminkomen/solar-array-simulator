import { describe, it, expect } from "bun:test";
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";

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
