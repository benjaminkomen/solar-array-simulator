import { describe, expect, it } from "bun:test";
import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { relative, resolve, sep } from "node:path";

const repoRoot = resolve(import.meta.dir, "../../..");

/** Version pins Expo reads. Everywhere else should say "the current Expo SDK" or point here. */
const SKIP = new Set(["package.json", "app.json", "bun.lock"]);
const BINARY_EXT = new Set(["png", "jpg", "jpeg", "gif", "webp", "ico", "pdf", "mp4"]);
/** Generated or dependency trees. A walk must not treat them as project source. */
const SKIP_DIRS = new Set([
  ".git",
  "node_modules",
  ".expo",
  "ios",
  "android",
  "dist",
  "web-build",
  "coverage",
  ".terraform",
]);

const PATTERNS = [
  /\bSDK\s+\d+/i,
  /exposdk:\s*\d+/i,
];

function walkFiles(root: string): string[] {
  const files: string[] = [];
  const queue = [root];
  while (queue.length > 0) {
    const dir = queue.pop()!;
    let entries;
    try {
      entries = readdirSync(dir, { withFileTypes: true });
    } catch (error) {
      if (isEnoent(error)) continue;
      throw error;
    }
    for (const entry of entries) {
      if (SKIP_DIRS.has(entry.name) || entry.isSymbolicLink()) continue;
      const abs = resolve(dir, entry.name);
      if (entry.isDirectory()) {
        queue.push(abs);
      } else if (entry.isFile()) {
        files.push(relative(root, abs).split(sep).join("/"));
      }
    }
  }
  return files;
}

function isEnoent(error: unknown): boolean {
  return typeof error === "object" && error !== null && "code" in error && error.code === "ENOENT";
}

function findHits(root: string, files: string[]): string[] {
  const hits: string[] = [];
  for (const file of files) {
    if (SKIP.has(file) || file.endsWith(".lock")) continue;
    const ext = file.includes(".") ? file.split(".").pop()!.toLowerCase() : "";
    if (BINARY_EXT.has(ext)) continue;

    let text: string;
    try {
      text = readFileSync(resolve(root, file), "utf8");
    } catch (error) {
      // A listed path can be gone (broken symlink, or a checkout that deleted it).
      if (isEnoent(error)) continue;
      throw error;
    }
    if (text.includes("\0")) continue;

    text.split("\n").forEach((line, index) => {
      if (PATTERNS.some((pattern) => pattern.test(line))) {
        hits.push(`${file}:${index + 1}: ${line.trim()}`);
      }
    });
  }
  return hits;
}

function failureMessage(hits: string[]): string {
  return [
    "Hardcoded Expo SDK version.",
    "Point at package.json, or say the current Expo SDK.",
    "Do not embed an SDK number or an exposdk: literal in comments, docs, skills, or flows.",
    ...hits,
  ].join("\n");
}

describe("Expo SDK version literals", () => {
  it("are only in package pins, not comments, docs, skills, or Maestro flows", () => {
    const hits = findHits(repoRoot, walkFiles(repoRoot));
    expect(hits, failureMessage(hits)).toEqual([]);
  });

  it("ignores package pins and dependencies even when GIT_DIR points at another tree", () => {
    const root = mkdtempSync(resolve(tmpdir(), "sdk-guard-"));
    const other = mkdtempSync(resolve(tmpdir(), "sdk-guard-other-"));
    const banned = "SDK " + "57";
    const previousGitDir = process.env.GIT_DIR;
    const previousWorkTree = process.env.GIT_WORK_TREE;
    try {
      writeFileSync(resolve(other, "foreign.md"), `${banned}\n`);
      const gitEnv = { ...process.env };
      delete gitEnv.GIT_DIR;
      delete gitEnv.GIT_WORK_TREE;
      const init = spawnSync("git", ["init"], { cwd: other, timeout: 5_000, env: gitEnv });
      expect(init.status, init.stderr?.toString()).toBe(0);
      const added = spawnSync("git", ["add", "foreign.md"], {
        cwd: other,
        timeout: 5_000,
        env: gitEnv,
      });
      expect(added.status, added.stderr?.toString()).toBe(0);

      writeFileSync(resolve(root, "notes.md"), `${banned}\n`);
      writeFileSync(resolve(root, "package.json"), `${banned}\n`);
      mkdirSync(resolve(root, "node_modules/dep"), { recursive: true });
      writeFileSync(resolve(root, "node_modules/dep/readme.md"), `${banned}\n`);

      process.env.GIT_DIR = resolve(other, ".git");
      process.env.GIT_WORK_TREE = other;
      const hits = findHits(root, walkFiles(root));
      expect(hits.map((hit) => hit.split(":")[0])).toEqual(["notes.md"]);
    } finally {
      if (previousGitDir === undefined) delete process.env.GIT_DIR;
      else process.env.GIT_DIR = previousGitDir;
      if (previousWorkTree === undefined) delete process.env.GIT_WORK_TREE;
      else process.env.GIT_WORK_TREE = previousWorkTree;
      rmSync(root, { recursive: true, force: true });
      rmSync(other, { recursive: true, force: true });
    }
  });

  it("skips listed paths that are not in the worktree", () => {
    const root = mkdtempSync(resolve(tmpdir(), "sdk-guard-missing-"));
    const banned = "SDK " + "57";
    try {
      writeFileSync(resolve(root, "kept.md"), `${banned}\n`);
      const hits = findHits(root, ["docs/app-icons.md", "kept.md"]);
      expect(hits.map((hit) => hit.split(":")[0])).toEqual(["kept.md"]);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });
});
