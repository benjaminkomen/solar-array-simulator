---
name: verify-solar-array
description: "Drive the Expo/React Native Solar Array Simulator the way a user does (Maestro today; EAS Simulator and Mac/serve-sim later). Use before claiming UI, navigation, or screen work is done — not for unit-test-only or status-200 checks."
---

# Verify Solar Array Simulator

Drive `com.bkomen.solararraysimulator` through real screens. A green TypeScript compile, a unit test, or an HTTP 200 is not proof.

`node .cursor/skills/verify-solar-array/control.mjs --help` is the lever. Read the matching file under [`features/`](features/) before you drive.

Device backends are **pluggable**. This revision implements **`maestro` only** (local simulator/emulator, or Maestro Cloud if you already have it). **`eas`** (EAS Simulator + `agent-device`) and **`mac`** (`serve-sim` on a Mac worker) are reserved stubs — they print a "not wired yet" message. Do not invent those drivers here.

## Launch

This is a **development-build** Expo app. Maestro flows assume an installed dev client (`eas.json` profiles `development` / `development-simulator`) and a running Metro server. Do **not** run `npx expo run:ios`, `npx expo run:android`, or `eas build --local` just to verify.

On a machine with a simulator (Benjamin's Mac, or a later Mac/`eas` backend):

```bash
bun install
bun start
# Open the existing development build on the iOS Simulator (or Android emulator).
# Then, from another terminal:
node .cursor/skills/verify-solar-array/control.mjs doctor
node .cursor/skills/verify-solar-array/control.mjs smoke
```

Ready means the Expo dev client shows the app (Welcome: "Solar Array Simulator", or Production if the wizard already completed). `.maestro/shared/launch-fresh.yaml` clears state, dismisses the "Open in app?" / DEVELOPMENT SERVERS / Continue / Reload chrome, and waits for "Solar Array Simulator".

On this Cloud VM there is usually **no Xcode, no simulator, and no Maestro**. That is expected. `doctor` must still run and say so honestly. Do not start an EAS Simulator session or require Expo login from this skill.

Teardown: stop only Metro or Maestro processes **this run started**. Never kill a simulator by process name, and never delete evidence.

## Doctor

Read-only. Run first, and again after any failed drive.

```bash
node .cursor/skills/verify-solar-array/control.mjs doctor
node .cursor/skills/verify-solar-array/control.mjs doctor --json
node .cursor/skills/verify-solar-array/control.mjs doctor --backend=maestro
```

`doctor` reports: selected backend, whether that backend is implemented, Maestro binary, Feature Map file count, top-level `.maestro/*.yaml` flows, `eas.json` simulator profiles, and device/emulator presence.

- **No device is OK.** Exit `0` with `device.available: false`.
- Missing Feature Map or unknown `--backend` is **not** OK (exit `1`).
- `--backend=eas` or `--backend=mac` is honest: implemented `false`, plus the plug-in hint. Exit `0` for `doctor`; drive commands (`smoke`, `run-flow`, `screenshot`) exit `2`.

Do not drive an instance `doctor` has not checked since the last surprise.

## Drive

Prefer existing Maestro YAML over rewriting flows. Stable handles already used by Maestro:

| Handle | Kind | Where |
| --- | --- | --- |
| `get-started-button` | testID | Welcome |
| `take-photo-button` | testID | Upload |
| `choose-gallery-button` | testID | Upload |
| `canvas-container` | testID | Custom (iOS/Android) |
| `text-input-unit` | testID | Config iOS wattage "W" |
| `Panel Settings` | text | Config |
| `Take or Select Photo` | text | Upload |
| `Select AI Model` | text | Analyze iOS (Android: `SELECT AI MODEL`) |
| `Total Array Output` | text | Production |
| `add` | toolbar SF Symbol `plus` | Custom / Config (iOS Maestro) |
| `Finish` / `Continue` / `Skip` | toolbar text | wizard |
| `Simulate` | iOS accessibilityLabel | Production → Simulation |
| `More options` | iOS accessibilityLabel | Production menu |

```bash
# Welcome launch + Get Started → Config (wraps .maestro/smoke-test.yaml)
node .cursor/skills/verify-solar-array/control.mjs smoke

# Named top-level flow (basename, with or without .yaml)
node .cursor/skills/verify-solar-array/control.mjs run-flow wizard-happy-path
node .cursor/skills/verify-solar-array/control.mjs run-flow simulation-nav
node .cursor/skills/verify-solar-array/control.mjs list-flows

# Planned backends — must fail clearly, not pretend
node .cursor/skills/verify-solar-array/control.mjs smoke --backend=eas
node .cursor/skills/verify-solar-array/control.mjs smoke --backend=mac
```

Maestro notes (from the repo, not folklore):

- `tapOn: "text"` for visible copy; `tapOn: { id: "…" }` for testIDs.
- iOS toolbar SF Symbols: `icon="plus"` → `tapOn: "add"`.
- Skia canvas nodes are **not** Maestro-accessible — assert toolbar side effects (`Finish` appears after `add`).
- SwiftUI section headers may be invisible to Maestro; assert body copy (`Default Production`, `Panel Settings`).
- `extendedWaitUntil` with an id must nest: `visible: { id: "canvas-container" }`.
- `launch-fresh` uses coordinate taps on the Expo dev-client chrome (`50%,22%` server row, `50%,15%` to dismiss Reload). Fragile; do not "simplify" those points without a device.

Android gotchas: Production's sun button has **no** `Simulate` accessibility label (iOS does). Analyze header is `SELECT AI MODEL`, not `Select AI Model`. Custom add control is `Add panel`, not `add`. Existing Maestro YAML is written for the iOS dev client.

## Evidence

Proof lives under **`.agents/evidence/verify-solar-array/`** (gitignored except `README.md`). The CLI writes a JSON receipt there for every drive. Screenshots go there too when a backend can take one.

```bash
node .cursor/skills/verify-solar-array/control.mjs screenshot
node .cursor/skills/verify-solar-array/control.mjs screenshot .agents/evidence/verify-solar-array/welcome.png
```

Without Maestro + a device, `screenshot` exits `2` and does **not** invent a PNG.

Proof standards:

- Exercise a real user path from the Feature Map. Do not set `wizardCompleted` in the KV store or deep-link past the change under test as the primary proof.
- Capture the action **and** the resulting visible state (screenshot or Maestro `assertVisible`). "Looks right in code" is not evidence.
- A status-200 from `/api/analyze` is not Analyze proof. Drive Upload → gallery/camera → `Select AI Model` (or Skip).
- Skia/WebGPU pixels are not queryable. Prove Custom via `canvas-container` + toolbar (`Finish` after add). Prove Simulation via chrome (`Simulation`, `Total Output`, season labels).
- Record the feature id and the flow/command on every artifact.
- If a path is unreachable (no sim, no photo library, no AWS keys), name the path and the unmet precondition. Do not mark it verified via a different entry point.

## Cleanup

```bash
node .cursor/skills/verify-solar-array/control.mjs cleanup
```

Removes scratch the CLI created (temp Maestro output dirs). **Never deletes** `.agents/evidence/verify-solar-array/`. Does not kill a simulator, Metro, or Maestro Cloud session this run did not start.

After cleanup, confirm evidence files still exist at the named path.

## Helpers

All invocations are from the repo root.

| Command | What it does |
| --- | --- |
| `control.mjs --help` | Command surface, backends, examples |
| `control.mjs doctor` | Backend + toolchain + map + device (no device = OK) |
| `control.mjs features` | Feature Map index (same files as `features/`) |
| `control.mjs list-flows` | Top-level `.maestro/*.yaml` names |
| `control.mjs smoke` | `maestro test .maestro/smoke-test.yaml` |
| `control.mjs run-flow <name>` | `maestro test` a named top-level flow |
| `control.mjs screenshot [path]` | `maestro screenshot` when a device exists |
| `control.mjs cleanup` | Drop scratch; keep evidence |

`--json` on `doctor`, `features`, `list-flows`, and drive commands. `--backend=maestro\|eas\|mac` (default `maestro`).

Package script: `bun run verify-solar-array -- <cmd>` (same CLI).

When you change a screen, navigation, or a visible string, update the matching Feature Map file in the same PR and re-run the mapped flow. `/maintain-verification-skill` is the periodic honesty pass.

## Planned backends (do not implement here)

- **`eas`:** `eas.json` already has `development-simulator` and `preview-simulator` (`ios.simulator: true`). Next PR: `eas simulator:start` / `eas simulator:exec` plus `agent-device`. This skill must keep `--backend=eas`.
- **`mac`:** a Mac worker running `serve-sim` (Xcode Simulator + Metro). Next PR plugs a driver behind `--backend=mac`.

`.eas/workflows/deploy.yml` and `pr-preview.yml` are production deploy/preview. Do not change them to require a simulator.
