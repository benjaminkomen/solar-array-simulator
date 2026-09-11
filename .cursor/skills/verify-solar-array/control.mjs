#!/usr/bin/env node
/**
 * Agent-facing control lever for Solar Array Simulator verification.
 *
 * Device backends are pluggable (`--backend=maestro|eas|mac`).
 * Only `maestro` is implemented in this revision. `eas` and `mac` are
 * reserved stubs so a later PR can plug in EAS Simulator / agent-device
 * and Mac serve-sim without rewriting the skill.
 */

import { spawnSync } from "node:child_process";
import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { dirname, join, resolve, basename } from "node:path";
import { fileURLToPath } from "node:url";

const SKILL_DIR = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(SKILL_DIR, "../../..");
const FEATURES_DIR = join(SKILL_DIR, "features");
const MAESTRO_DIR = join(REPO_ROOT, ".maestro");
const EVIDENCE_DIR = join(REPO_ROOT, ".agents/evidence/verify-solar-array");
const SCRATCH_DIR = join(REPO_ROOT, ".agents/scratch/verify-solar-array");
const APP_ID = "com.bkomen.solararraysimulator";
const CLI = "node .cursor/skills/verify-solar-array/control.mjs";

const BACKENDS = {
  maestro: {
    id: "maestro",
    implemented: true,
    summary: "Maestro YAML against a local sim/emulator or Maestro Cloud.",
  },
  eas: {
    id: "eas",
    implemented: false,
    summary: "Planned: EAS Simulator + agent-device.",
    hint: [
      'backend "eas" is not wired yet.',
      "",
      "This revision implements --backend=maestro only.",
      "eas.json already has development-simulator and preview-simulator",
      "(ios.simulator: true). Next PR should call `eas simulator:start` /",
      "`eas simulator:exec` and drive the session with agent-device.",
      "",
      `Re-run with --backend=maestro on a machine that has Maestro + a simulator.`,
      `Local smoke: bun start, open the development build, then \`${CLI} smoke\`.`,
    ].join("\n"),
  },
  mac: {
    id: "mac",
    implemented: false,
    summary: "Planned: Mac worker running serve-sim.",
    hint: [
      'backend "mac" is not wired yet.',
      "",
      "This revision implements --backend=maestro only.",
      "Next PR should talk to a Mac worker running serve-sim",
      "(Xcode Simulator + Metro tunnel) without rewriting this skill.",
      "",
      `Re-run with --backend=maestro on a machine that has Maestro + a simulator.`,
      `Local smoke: bun start, open the development build, then \`${CLI} smoke\`.`,
    ].join("\n"),
  },
};

const FLOW_ALIASES = {
  smoke: "smoke-test",
};

const COMMANDS = [
  "doctor",
  "features",
  "list-flows",
  "smoke",
  "run-flow",
  "screenshot",
  "cleanup",
  "help",
];

export function parseArgs(argv) {
  const flags = { json: false, backend: "maestro", help: false };
  const positional = [];
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--help" || arg === "-h") {
      flags.help = true;
    } else if (arg === "--json") {
      flags.json = true;
    } else if (arg === "--backend") {
      const value = argv[i + 1];
      if (!value || value.startsWith("-")) {
        throw usageError("Missing value for --backend (expected maestro|eas|mac).");
      }
      flags.backend = value;
      i += 1;
    } else if (arg.startsWith("--backend=")) {
      flags.backend = arg.slice("--backend=".length);
    } else if (arg === "--") {
      positional.push(...argv.slice(i + 1));
      break;
    } else if (arg.startsWith("-")) {
      throw usageError(`Unknown flag ${arg}. See ${CLI} --help.`);
    } else {
      positional.push(arg);
    }
  }
  const command = positional[0] ?? "help";
  return { command, args: positional.slice(1), flags };
}

function usageError(message) {
  const error = new Error(message);
  error.exitCode = 1;
  error.kind = "usage";
  return error;
}

function resolveBackend(id) {
  const backend = BACKENDS[id];
  if (!backend) {
    throw usageError(
      `Unknown backend "${id}". Expected maestro, eas, or mac.`,
    );
  }
  return backend;
}

function which(cmd) {
  const pathEnv = process.env.PATH || "";
  for (const dir of pathEnv.split(process.platform === "win32" ? ";" : ":")) {
    if (!dir) continue;
    const candidate = join(dir, cmd);
    if (existsSync(candidate)) return candidate;
    if (process.platform === "win32" && existsSync(`${candidate}.exe`)) {
      return `${candidate}.exe`;
    }
  }
  return null;
}

function runCapture(cmd, args, opts = {}) {
  const result = spawnSync(cmd, args, {
    encoding: "utf8",
    cwd: opts.cwd ?? REPO_ROOT,
    env: process.env,
  });
  return {
    status: result.status ?? 1,
    stdout: result.stdout ?? "",
    stderr: result.stderr ?? "",
    error: result.error ? String(result.error.message) : null,
  };
}

export function listFeatureFiles() {
  if (!existsSync(FEATURES_DIR)) return [];
  return readdirSync(FEATURES_DIR)
    .filter((name) => name.endsWith(".md") && name !== "README.md")
    .sort()
    .map((name) => {
      const file = join(FEATURES_DIR, name);
      const text = readFileSync(file, "utf8");
      const title = (text.match(/^#\s+(.+)$/m) || [null, name])[1];
      return {
        id: name.replace(/\.md$/, ""),
        title,
        file: `.cursor/skills/verify-solar-array/features/${name}`,
      };
    });
}

export function listMaestroFlows() {
  if (!existsSync(MAESTRO_DIR)) return [];
  return readdirSync(MAESTRO_DIR)
    .filter((name) => name.endsWith(".yaml") || name.endsWith(".yml"))
    .sort()
    .map((name) => ({
      id: name.replace(/\.ya?ml$/, ""),
      file: `.maestro/${name}`,
      path: join(MAESTRO_DIR, name),
    }));
}

export function resolveFlow(name) {
  if (!name) {
    const known = listMaestroFlows().map((f) => f.id).join(", ");
    throw usageError(
      `run-flow requires a flow name (e.g. smoke-test, wizard-happy-path).\nKnown top-level flows: ${known || "(none found)"}`,
    );
  }
  const alias = FLOW_ALIASES[name] ?? name;
  const candidates = [
    resolve(process.cwd(), name),
    resolve(REPO_ROOT, name),
    join(MAESTRO_DIR, alias),
    join(MAESTRO_DIR, `${alias}.yaml`),
    join(MAESTRO_DIR, `${alias}.yml`),
  ];
  for (const candidate of candidates) {
    if (existsSync(candidate) && statSync(candidate).isFile()) {
      const rel = candidate.startsWith(REPO_ROOT)
        ? candidate.slice(REPO_ROOT.length + 1)
        : candidate;
      if (rel.includes(".maestro/shared/")) {
        throw usageError(
          `${rel} is a shared subflow, not a top-level drive. Use smoke-test, wizard-happy-path, analyze-skip, production-menu, or simulation-nav.`,
        );
      }
      return { id: basename(candidate).replace(/\.ya?ml$/, ""), path: candidate, rel };
    }
  }
  const known = listMaestroFlows().map((f) => f.id).join(", ");
  throw usageError(
    `No Maestro flow named "${name}". Known top-level flows: ${known || "(none found)"}`,
  );
}

function readEasSimulatorProfiles() {
  const easPath = join(REPO_ROOT, "eas.json");
  if (!existsSync(easPath)) {
    return { path: "eas.json", present: false, profiles: [] };
  }
  const eas = JSON.parse(readFileSync(easPath, "utf8"));
  const profiles = [];
  for (const name of ["development-simulator", "preview-simulator"]) {
    const profile = eas.build?.[name];
    profiles.push({
      name,
      present: Boolean(profile),
      iosSimulator: profile?.ios?.simulator === true,
    });
  }
  return { path: "eas.json", present: true, profiles };
}

function detectDevice() {
  const signals = [];
  let available = false;

  const adb = which("adb");
  if (adb) {
    const result = runCapture(adb, ["devices"]);
    const attached = (result.stdout || "")
      .split("\n")
      .filter((line) => /\tdevice\s*$/.test(line));
    if (attached.length > 0) {
      available = true;
      signals.push({ kind: "adb", available: true, detail: attached.map((l) => l.split("\t")[0]) });
    } else {
      signals.push({ kind: "adb", available: false, detail: "adb on PATH but no device in 'device' state" });
    }
  } else {
    signals.push({ kind: "adb", available: false, detail: "adb not on PATH" });
  }

  const xcrun = which("xcrun");
  if (xcrun) {
    const result = runCapture(xcrun, ["simctl", "list", "devices", "booted"]);
    const booted = /Booted/.test(result.stdout || "");
    if (booted) {
      available = true;
      signals.push({ kind: "simctl", available: true, detail: "booted iOS simulator" });
    } else {
      signals.push({ kind: "simctl", available: false, detail: "xcrun present but no booted simulator" });
    }
  } else {
    signals.push({ kind: "simctl", available: false, detail: "xcrun not on PATH (no Xcode)" });
  }

  const maestroCloud = Boolean(process.env.MAESTRO_CLOUD_API_KEY);
  if (maestroCloud) {
    signals.push({ kind: "maestro-cloud", available: true, detail: "MAESTRO_CLOUD_API_KEY is set" });
  } else {
    signals.push({ kind: "maestro-cloud", available: false, detail: "MAESTRO_CLOUD_API_KEY not set" });
  }

  return {
    available: available || maestroCloud,
    localDevice: available,
    maestroCloud,
    signals,
  };
}

function maestroStatus() {
  const bin = which("maestro");
  if (!bin) {
    return { installed: false, bin: null, version: null };
  }
  const result = runCapture(bin, ["--version"]);
  const version = (result.stdout || result.stderr || "").trim().split("\n")[0] || null;
  return { installed: true, bin, version };
}

function ensureEvidenceDir() {
  mkdirSync(EVIDENCE_DIR, { recursive: true });
  return EVIDENCE_DIR;
}

export function writeReceipt(kind, payload) {
  ensureEvidenceDir();
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const file = join(EVIDENCE_DIR, `${stamp}-${kind}.json`);
  const body = {
    kind,
    writtenAt: new Date().toISOString(),
    appId: APP_ID,
    ...payload,
  };
  writeFileSync(file, `${JSON.stringify(body, null, 2)}\n`);
  return file;
}

function printJson(value) {
  process.stdout.write(`${JSON.stringify(value, null, 2)}\n`);
}

function printHelp(command) {
  if (command && command !== "help") {
    process.stdout.write(`${commandHelp(command)}\n`);
    return;
  }
  process.stdout.write(`${rootHelp()}\n`);
}

function rootHelp() {
  return `
Solar Array Simulator verification CLI (agent lever)

Usage:
  ${CLI} <command> [args] [flags]

Drive the Expo/React Native app the way a user does. Read the Feature Map
under .cursor/skills/verify-solar-array/features/ before claiming UI work.

Commands:
  doctor              Read-only health: backend, Maestro, map, flows, device
  features            List Feature Map files (id, title, path)
  list-flows          List top-level .maestro/*.yaml flows
  smoke               Run .maestro/smoke-test.yaml (launch-fresh + Get Started)
  run-flow <name>     Run a named top-level Maestro flow
  screenshot [path]   Maestro screenshot into the evidence dir (if a device exists)
  cleanup             Remove CLI scratch only — never evidence
  help [command]      This screen, or per-command help

Flags:
  --backend=maestro|eas|mac   Device backend (default: maestro)
  --json                      Machine-readable JSON on stdout
  --help, -h                  Help for the CLI or the selected command

Backends:
  maestro   Implemented. Composes existing .maestro/*.yaml flows.
  eas       Stub. Planned: eas simulator:exec + agent-device.
  mac       Stub. Planned: Mac worker serve-sim.

Evidence:  .agents/evidence/verify-solar-array/  (survives cleanup)
Scratch:   .agents/scratch/verify-solar-array/

No simulator on this machine is OK for doctor/features. It is not OK for a
claimed UI proof. On a Mac with the dev client:

  bun start
  ${CLI} doctor
  ${CLI} smoke

Examples:
  ${CLI} doctor --json
  ${CLI} features
  ${CLI} run-flow wizard-happy-path
  ${CLI} run-flow simulation-nav --json
  ${CLI} smoke --backend=eas          # must print "not wired yet"
`.trim();
}

function commandHelp(command) {
  const extras = {
    doctor: `
doctor — is this instance worth driving?

  ${CLI} doctor [--backend=maestro|eas|mac] [--json]

Exit 0 when the skill scaffolding is intact, even if no device is present.
Exit 1 for an unknown backend or a missing Feature Map / Maestro dir.
eas/mac report implemented=false and still exit 0 here (drive commands exit 2).
`.trim(),
    features: `
features — print the Feature Map index

  ${CLI} features [--json]

One file per user journey under .cursor/skills/verify-solar-array/features/.
`.trim(),
    "list-flows": `
list-flows — top-level Maestro YAML (not shared/ subflows)

  ${CLI} list-flows [--json]
`.trim(),
    smoke: `
smoke — Welcome launch + Get Started → Config

  ${CLI} smoke [--backend=maestro] [--json]

Wraps .maestro/smoke-test.yaml (shared/launch-fresh.yaml + get-started-button).
Requires Maestro and a simulator, emulator, or Maestro Cloud.
`.trim(),
    "run-flow": `
run-flow — run one top-level .maestro/*.yaml

  ${CLI} run-flow <name> [--backend=maestro] [--json]

Names: smoke-test, wizard-happy-path, analyze-skip, production-menu, simulation-nav
Also accepts a path (.maestro/wizard-happy-path.yaml). Rejects shared/ subflows.
`.trim(),
    screenshot: `
screenshot — capture the current device screen

  ${CLI} screenshot [path] [--backend=maestro] [--json]

Default path: .agents/evidence/verify-solar-array/<timestamp>-screenshot.png
Without Maestro + a device, exits 2 and does not invent a PNG.
`.trim(),
    cleanup: `
cleanup — drop scratch this CLI created

  ${CLI} cleanup [--json]

Deletes .agents/scratch/verify-solar-array/ only.
Does not delete .agents/evidence/verify-solar-array/ and does not kill
a simulator, Metro, or a session this run did not start.
`.trim(),
  };
  return extras[command] || `Unknown command "${command}". See ${CLI} --help.`;
}

function buildDoctorReport(backend) {
  const features = listFeatureFiles();
  const flows = listMaestroFlows();
  const eas = readEasSimulatorProfiles();
  const maestro = maestroStatus();
  const device = detectDevice();
  const mapOk = existsSync(join(FEATURES_DIR, "README.md")) && features.length > 0;
  const flowsOk = existsSync(MAESTRO_DIR) && flows.length > 0;
  const easOk = eas.present && eas.profiles.every((p) => p.present && p.iosSimulator);

  const warnings = [];
  if (!backend.implemented) {
    warnings.push(`backend ${backend.id} is not wired yet`);
  }
  if (!maestro.installed && backend.id === "maestro") {
    warnings.push("Maestro CLI is not on PATH — smoke/run-flow/screenshot will fail");
  }
  if (!device.available) {
    warnings.push("no device — smoke/run-flow/screenshot need a sim, emulator, or Maestro Cloud");
  }
  if (!mapOk) warnings.push("Feature Map missing or empty");
  if (!flowsOk) warnings.push("no top-level .maestro/*.yaml flows");
  if (!easOk) warnings.push("eas.json simulator profiles missing or ios.simulator != true");

  const ok = mapOk && flowsOk;
  return {
    ok,
    appId: APP_ID,
    repoRoot: REPO_ROOT,
    backend: {
      id: backend.id,
      implemented: backend.implemented,
      summary: backend.summary,
      hint: backend.implemented ? null : backend.hint,
    },
    maestro,
    device: {
      available: device.available,
      localDevice: device.localDevice,
      maestroCloud: device.maestroCloud,
      signals: device.signals,
    },
    featureMap: {
      path: ".cursor/skills/verify-solar-array/features/",
      readme: existsSync(join(FEATURES_DIR, "README.md")),
      count: features.length,
      features: features.map((f) => f.id),
    },
    flows: {
      path: ".maestro/",
      count: flows.length,
      names: flows.map((f) => f.id),
    },
    eas,
    evidenceDir: ".agents/evidence/verify-solar-array/",
    warnings,
    howToSmokeLocally: [
      "1. On a Mac (or CI image) with Xcode / Android SDK and the development client installed.",
      "2. bun install && bun start",
      "3. Open the existing development build on the simulator (do not expo run:ios).",
      `4. ${CLI} smoke`,
    ],
  };
}

function printDoctorHuman(report) {
  const lines = [
    `verify-solar-array doctor`,
    `  backend     ${report.backend.id} (${report.backend.implemented ? "implemented" : "NOT WIRED"})`,
    `  maestro     ${report.maestro.installed ? report.maestro.version || report.maestro.bin : "not installed"}`,
    `  device      ${report.device.available ? "available" : "none (OK for doctor)"}`,
    `  feature map ${report.featureMap.count} file(s) — ${report.featureMap.features.join(", ") || "—"}`,
    `  flows       ${report.flows.count} — ${report.flows.names.join(", ") || "—"}`,
    `  eas sims    ${report.eas.profiles.map((p) => `${p.name}${p.iosSimulator ? "" : " (missing)"}`).join(", ")}`,
    `  evidence    ${report.evidenceDir}`,
  ];
  if (report.warnings.length) {
    lines.push("  warnings:");
    for (const warning of report.warnings) lines.push(`    - ${warning}`);
  }
  if (!report.device.available) {
    lines.push("  local smoke:");
    for (const step of report.howToSmokeLocally) lines.push(`    ${step}`);
  }
  if (report.backend.hint) {
    lines.push("");
    lines.push(report.backend.hint);
  }
  process.stdout.write(`${lines.join("\n")}\n`);
}

function refuseUnwiredBackend(backend, json) {
  const payload = {
    ok: false,
    exitCode: 2,
    backend: backend.id,
    implemented: false,
    error: backend.hint,
  };
  if (json) printJson(payload);
  else process.stderr.write(`${backend.hint}\n`);
  return 2;
}

function requireImplementedBackend(backend, json) {
  if (backend.implemented) return 0;
  return refuseUnwiredBackend(backend, json);
}

function runMaestroCommand(args, { json, kind, extra }) {
  const maestro = maestroStatus();
  const device = detectDevice();
  if (!maestro.installed) {
    const error = [
      "Maestro CLI is not on PATH.",
      "Install from https://maestro.dev, attach a simulator or emulator",
      `(or set MAESTRO_CLOUD_API_KEY), then re-run. App id: ${APP_ID}.`,
      `Local smoke: bun start, open the development build, then \`${CLI} smoke\`.`,
    ].join("\n");
    const receipt = writeReceipt(kind, { ok: false, exitCode: 2, error, ...extra });
    const payload = { ok: false, exitCode: 2, error, receipt };
    if (json) printJson(payload);
    else process.stderr.write(`${error}\n`);
    return 2;
  }
  if (!device.available) {
    const error = [
      "No simulator, emulator, or Maestro Cloud credentials detected.",
      "doctor is allowed to say this; smoke/run-flow/screenshot are not a UI proof.",
      `On a Mac: open the iOS Simulator, bun start, open the ${APP_ID} development build,`,
      `then re-run. Cloud agents without a device should stop and say so.`,
    ].join("\n");
    const receipt = writeReceipt(kind, { ok: false, exitCode: 2, error, ...extra });
    const payload = { ok: false, exitCode: 2, error, receipt };
    if (json) printJson(payload);
    else process.stderr.write(`${error}\n`);
    return 2;
  }

  mkdirSync(SCRATCH_DIR, { recursive: true });
  const result = runCapture(maestro.bin, args);
  const ok = result.status === 0;
  const receipt = writeReceipt(kind, {
    ok,
    exitCode: result.status,
    argv: args,
    stdout: result.stdout,
    stderr: result.stderr,
    spawnError: result.error,
    ...extra,
  });
  const payload = { ok, exitCode: result.status, receipt, stdout: result.stdout, stderr: result.stderr };
  if (json) printJson(payload);
  else {
    if (result.stdout) process.stdout.write(result.stdout);
    if (result.stderr) process.stderr.write(result.stderr);
    process.stderr.write(`receipt: ${receipt}\n`);
  }
  return result.status === 0 ? 0 : result.status || 1;
}

function cmdDoctor(backend, json) {
  const report = buildDoctorReport(backend);
  if (json) printJson(report);
  else printDoctorHuman(report);
  if (!report.ok) return 1;
  return 0;
}

function cmdFeatures(json) {
  const features = listFeatureFiles();
  const payload = {
    map: ".cursor/skills/verify-solar-array/features/",
    count: features.length,
    features,
  };
  if (json) printJson(payload);
  else {
    process.stdout.write(`Feature map (${payload.map})\n`);
    for (const feature of features) {
      process.stdout.write(`  ${feature.id.padEnd(16)} ${feature.title}  ${feature.file}\n`);
    }
  }
  return features.length > 0 ? 0 : 1;
}

function cmdListFlows(json) {
  const flows = listMaestroFlows();
  const payload = { path: ".maestro/", count: flows.length, flows: flows.map(({ id, file }) => ({ id, file })) };
  if (json) printJson(payload);
  else {
    process.stdout.write("Top-level Maestro flows (.maestro/*.yaml)\n");
    for (const flow of payload.flows) {
      process.stdout.write(`  ${flow.id.padEnd(22)} ${flow.file}\n`);
    }
  }
  return 0;
}

function cmdSmoke(backend, json) {
  const blocked = requireImplementedBackend(backend, json);
  if (blocked) return blocked;
  const flow = resolveFlow("smoke-test");
  return runMaestroCommand(["test", flow.path], {
    json,
    kind: "smoke",
    extra: { flow: flow.rel, featureHint: "welcome" },
  });
}

function cmdRunFlow(backend, name, json) {
  const blocked = requireImplementedBackend(backend, json);
  if (blocked) return blocked;
  const flow = resolveFlow(name);
  return runMaestroCommand(["test", flow.path], {
    json,
    kind: "run-flow",
    extra: { flow: flow.rel, name: flow.id },
  });
}

function cmdScreenshot(backend, requestedPath, json) {
  const blocked = requireImplementedBackend(backend, json);
  if (blocked) return blocked;
  ensureEvidenceDir();
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const outPath = resolve(requestedPath || join(EVIDENCE_DIR, `${stamp}-screenshot.png`));
  return runMaestroCommand(["screenshot", outPath], {
    json,
    kind: "screenshot",
    extra: { path: outPath },
  });
}

function cmdCleanup(json) {
  const existed = existsSync(SCRATCH_DIR);
  if (existed) rmSync(SCRATCH_DIR, { recursive: true, force: true });
  const evidenceStillThere = existsSync(EVIDENCE_DIR);
  const payload = {
    ok: true,
    removedScratch: existed,
    scratchDir: ".agents/scratch/verify-solar-array/",
    evidencePreserved: evidenceStillThere,
    evidenceDir: ".agents/evidence/verify-solar-array/",
  };
  if (json) printJson(payload);
  else {
    process.stdout.write(
      existed
        ? `Removed scratch at ${payload.scratchDir}\n`
        : "No scratch directory to remove.\n",
    );
    process.stdout.write(
      evidenceStillThere
        ? `Evidence kept at ${payload.evidenceDir}\n`
        : `Evidence dir missing (nothing to keep): ${payload.evidenceDir}\n`,
    );
  }
  return 0;
}

export function main(argv = process.argv.slice(2)) {
  let parsed;
  try {
    parsed = parseArgs(argv);
  } catch (error) {
    process.stderr.write(`${error.message}\n`);
    return error.exitCode ?? 1;
  }

  const { command, args, flags } = parsed;
  if (flags.help && command === "help") {
    printHelp();
    return 0;
  }
  if (flags.help) {
    printHelp(command);
    return 0;
  }

  let backend;
  try {
    backend = resolveBackend(flags.backend);
  } catch (error) {
    process.stderr.write(`${error.message}\n`);
    return error.exitCode ?? 1;
  }

  try {
    switch (command) {
      case "help":
        printHelp(args[0]);
        return 0;
      case "doctor":
        return cmdDoctor(backend, flags.json);
      case "features":
        return cmdFeatures(flags.json);
      case "list-flows":
        return cmdListFlows(flags.json);
      case "smoke":
        return cmdSmoke(backend, flags.json);
      case "run-flow":
        return cmdRunFlow(backend, args[0], flags.json);
      case "screenshot":
        return cmdScreenshot(backend, args[0], flags.json);
      case "cleanup":
        return cmdCleanup(flags.json);
      default:
        throw usageError(
          `Unknown command "${command}". Expected: ${COMMANDS.join(", ")}.\nSee ${CLI} --help.`,
        );
    }
  } catch (error) {
    const code = error.exitCode ?? 1;
    if (flags.json) {
      printJson({ ok: false, exitCode: code, error: error.message });
    } else {
      process.stderr.write(`${error.message}\n`);
    }
    return code;
  }
}

const invokedDirectly = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (invokedDirectly) {
  process.exitCode = main();
}
