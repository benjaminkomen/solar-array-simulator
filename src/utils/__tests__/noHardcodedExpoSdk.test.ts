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

function gitTrackedFiles(root: string): string[] | null {
  const listed = spawnSync("git", ["-c", "safe.directory=*", "ls-files", "-z"], {
    cwd: root,
    encoding: "buffer",
    timeout: 15_000,
    env: { ...process.env, GIT_TERMINAL_PROMPT: "0" },
  });
  if (listed.error || listed.status !== 0 || listed.stdout == null || listed.stdout.length === 0) {
    return null;
  }
  const files = listed.stdout.toString("utf8").split("\0").filter(Boolean);
  return files.length > 0 ? files : null;
}

function walkFiles(root: string): string[] {
  const files: string[] = [];
  const queue = [root];
  while (queue.length > 0) {
    const dir = queue.pop()!;
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      if (SKIP_DIRS.has(entry.name)) continue;
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

function listFiles(root: string): string[] {
  return gitTrackedFiles(root) ?? walkFiles(root);
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
      // eas/checkout deletes .easignore paths (/docs, /terraform) and leaves them in the index.
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
    const hits = findHits(repoRoot, listFiles(repoRoot));
    expect(hits, failureMessage(hits)).toEqual([]);
  });

  it("walks the tree when git is unavailable and ignores package pins and dependencies", () => {
    const root = mkdtempSync(resolve(tmpdir(), "sdk-guard-"));
    const banned = "SDK " + "57";
    try {
      writeFileSync(resolve(root, "notes.md"), `${banned}\n`);
      writeFileSync(resolve(root, "package.json"), `${banned}\n`);
      mkdirSync(resolve(root, "node_modules/dep"), { recursive: true });
      writeFileSync(resolve(root, "node_modules/dep/readme.md"), `${banned}\n`);
      const hits = findHits(root, listFiles(root));
      expect(hits.map((hit) => hit.split(":")[0])).toEqual(["notes.md"]);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it("skips tracked paths that are not in the worktree", () => {
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
