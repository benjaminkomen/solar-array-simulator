import { describe, expect, it } from "bun:test";
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const repoRoot = resolve(import.meta.dir, "../../..");

/** Version pins Expo reads. Everywhere else should say "the current Expo SDK" or point here. */
const SKIP = new Set(["package.json", "app.json", "bun.lock"]);
const BINARY_EXT = new Set(["png", "jpg", "jpeg", "gif", "webp", "ico", "pdf", "mp4"]);

const PATTERNS = [
  /\bSDK\s+\d+/i,
  /exposdk:\s*\d+/i,
];

describe("Expo SDK version literals", () => {
  it("are only in package pins, not comments, docs, skills, or Maestro flows", () => {
    const listed = spawnSync("git", ["ls-files", "-z"], {
      cwd: repoRoot,
      encoding: "buffer",
    });
    expect(listed.status).toBe(0);

    const hits: string[] = [];
    for (const file of listed.stdout.toString("utf8").split("\0").filter(Boolean)) {
      if (SKIP.has(file) || file.endsWith(".lock")) continue;
      const ext = file.includes(".") ? file.split(".").pop()!.toLowerCase() : "";
      if (BINARY_EXT.has(ext)) continue;

      const text = readFileSync(resolve(repoRoot, file), "utf8");
      if (text.includes("\0")) continue;

      text.split("\n").forEach((line, index) => {
        if (PATTERNS.some((pattern) => pattern.test(line))) {
          hits.push(`${file}:${index + 1}: ${line.trim()}`);
        }
      });
    }

    expect(hits, [
      "Hardcoded Expo SDK version.",
      "Point at package.json, or say the current Expo SDK.",
      "Do not embed an SDK number or an exposdk: literal in comments, docs, skills, or flows.",
      ...hits,
    ].join("\n")).toEqual([]);
  });
});
