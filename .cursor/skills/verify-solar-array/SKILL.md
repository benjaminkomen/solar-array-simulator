---
name: verify-solar-array
description: "Drive the Expo/React Native Solar Array Simulator the way a user does (Maestro today; EAS Simulator and Mac/serve-sim later). Use before claiming UI, navigation, or screen work is done — not for unit-test-only or status-200 checks."
---

# Verify Solar Array Simulator

Drive `com.bkomen.solararraysimulator` through real screens on **iOS Simulator and Android emulator**. A green TypeScript compile, a unit test, or an HTTP 200 is not proof.

`node .cursor/skills/verify-solar-array/control.mjs --help` is the lever. Read the matching file under [`features/`](features/) before you drive.

Device backends are **pluggable**. This revision implements **`maestro` only** (local iOS Simulator / Android emulator, or Maestro Cloud if you already have it). **`eas`** (EAS Simulator + `agent-device`) and **`mac`** (`serve-sim` on a Mac worker) are reserved stubs — they print a "not wired yet" message. Do not invent those drivers here.

## Launch

This is a **development-build** Expo app. Maestro flows assume an installed Dev Client and a running Metro server. Do **not** run `npx expo run:ios`, `npx expo run:android`, or `eas build --local` just to verify.

On a MacBook (Benjamin's, or a later Mac/`eas` backend):

```bash
bun install
bun start
# iOS: open the development-simulator build on a booted Simulator.
# Android: install the `development` APK on an AVD (api35_test / bare-expo).
# Then, from another terminal:
node .cursor/skills/verify-solar-array/control.mjs doctor
node .cursor/skills/verify-solar-array/control.mjs smoke --platform=ios
node .cursor/skills/verify-solar-array/control.mjs smoke --platform=android
```

Ready means the Dev Client shows the app (Welcome: "Solar Array Simulator", or Production if the wizard already completed).

Bonjour ("DEVELOPMENT SERVERS") is flaky. `.maestro/shared/launch-fresh.yaml` branches by platform:

- **iOS** (`launch-fresh.ios.yaml`): deep-link `http://127.0.0.1:8081` (sim shares the Mac loopback). Optional **Open**, required **Continue**, optional Reload, wait for Welcome.
- **Android** (`launch-fresh.android.yaml`): wait for Dev Client Home (`DEVELOPMENT SERVERS`) before `openLink` (too-early ACTION_VIEW is dropped and Home stays on empty `exp://`). Then `openLink` to `solararraysimulator://expo-development-client/?url=http%3A%2F%2F10.0.2.2%3A8081` (`10.0.2.2` = AVD host loopback — `127.0.0.1` inside the emulator is the guest). If still on Home: tap Recently Opened / packager `http://10.0.2.2:8081`, or type that URL and tap **Connect** (Connect is disabled while the field is empty). Then wait for **Continue** like iOS (skip only if Welcome is already up), optional Reload, wait for Welcome. Override with `-e METRO_URL=…` and `-e METRO_URL_PLAIN=…` (physical device or `adb reverse tcp:8081 tcp:8081`).

On this Cloud VM there is usually **no Xcode, no emulator, and no Maestro**. That is expected. `doctor` must still run and say so honestly. Do not start an EAS Simulator session or require Expo login from this skill.

Teardown: stop only Metro or Maestro processes **this run started**. Never kill a simulator/emulator by process name, and never delete evidence.

## Doctor

Read-only. Run first, and again after any failed drive.

```bash
node .cursor/skills/verify-solar-array/control.mjs doctor
node .cursor/skills/verify-solar-array/control.mjs doctor --json
node .cursor/skills/verify-solar-array/control.mjs doctor --backend=maestro
```

`doctor` reports: selected backend, Maestro binary, Feature Map file count, top-level `.maestro/*.yaml` flows, EAS profiles, **booted iOS Simulator** (`xcrun simctl`), and **Android emulator/device** (`adb devices`).

- **No device is OK.** Exit `0` with `device.available: false`. iOS and Android are listed separately (`device.ios` / `device.android`).
- Missing Feature Map or unknown `--backend` is **not** OK (exit `1`).
- `--backend=eas` or `--backend=mac` is honest: implemented `false`, plus the plug-in hint. Exit `0` for `doctor`; drive commands (`smoke`, `run-flow`, `screenshot`) exit `2`.

Do not drive an instance `doctor` has not checked since the last surprise.

## Drive

Prefer existing Maestro YAML over rewriting flows. Stable handles already used by Maestro:

| Handle | Kind | iOS | Android |
| --- | --- | --- | --- |
| `get-started-button` | testID | Welcome | Welcome |
| `take-photo-button` | testID | Upload | Upload |
| `choose-gallery-button` | testID | Upload | Upload |
| `canvas-container` | testID | Custom | Custom |
| `text-input-unit` | testID | Config wattage "W" | — |
| `Panel Settings` | text | Config | Config |
| `Take or Select Photo` | text | Upload | Upload |
| Analyze header | text | `Select AI Model` | `SELECT AI MODEL` |
| Add panel | toolbar | `add` (SF Symbol `plus`) | `Add panel` |
| `Finish` / `Continue` / `Skip` | toolbar text | wizard | wizard |
| `Simulate` | a11y | Production sun | Production sun (`contentDescription`) |
| `More options` | a11y | Production menu | Production overflow (`contentDescription`) |

```bash
# Welcome launch + Get Started → Config
node .cursor/skills/verify-solar-array/control.mjs smoke --platform=ios
node .cursor/skills/verify-solar-array/control.mjs smoke --platform=android

# Named top-level flow (basename, with or without .yaml)
node .cursor/skills/verify-solar-array/control.mjs run-flow wizard-happy-path --platform=ios
node .cursor/skills/verify-solar-array/control.mjs run-flow simulation-nav --platform=android
node .cursor/skills/verify-solar-array/control.mjs list-flows

# Planned backends — must fail clearly, not pretend
node .cursor/skills/verify-solar-array/control.mjs smoke --backend=eas
node .cursor/skills/verify-solar-array/control.mjs smoke --backend=mac
```

`--platform` passes Maestro `--device` when a matching sim/emulator is attached (needed if both are up). Omit it only when a single device is connected.

Maestro notes (from the repo, not folklore):

- `tapOn: "text"` for visible copy; `tapOn: { id: "…" }` for testIDs.
- iOS toolbar SF Symbols: `icon="plus"` → `tapOn: "add"`. Android Custom add is `Add panel`.
- Skia canvas nodes are **not** Maestro-accessible — assert toolbar side effects (`Finish` after add).
- SwiftUI section headers may be invisible to Maestro; assert body copy (`Default Production`, `Panel Settings`).
- `extendedWaitUntil` with an id must nest: `visible: { id: "canvas-container" }`.
- iOS `launch-fresh`: deep-link `127.0.0.1:8081`, tap **Open** (not Cancel), wait for **Continue**. Android: wait for Home, `openLink` to `10.0.2.2:8081` (`disableOnboarding=1`), Recently Opened / typed **Connect** fallback, then wait for **Continue** (not a one-shot optional check). Optional Reload dismiss still uses `50%,15%`.
- Android Simulation 3D: chrome can be up while the canvas is still black. That is a GPU settle, not "WebGPU unavailable". `simulation-nav` waits ~90s after chrome (`optional` `webgpu-scene-painted`) before `sim-3d-proof`. Do not treat a black canvas as a failed native link if seasons / Total Output are visible.
- `analyze-skip` gallery picker is still iOS Photos chrome (`Photos` + `17%,25%`). Android system picker is a different OS sheet — prove Analyze header after a real pick, or Skip.

Android development build: `eas.json` `development` (`developmentClient: true`, `arm64-v8a`) — `eas build --profile development --platform android`, install the APK on the AVD. `development-simulator` / `preview-simulator` are **iOS-only** (`ios.simulator: true`). Do not invent a second Android profile unless EAS requires it.

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
- A status-200 from `/api/analyze` is not Analyze proof. Drive Upload → gallery/camera → Analyze header (or Skip).
- Skia/WebGPU pixels are not queryable. Prove Custom via `canvas-container` + toolbar (`Finish` after add). Prove Simulation via chrome (`Simulation`, `Total Output`, season labels). On Android, wait for the `simulation-nav` 3D settle before treating a screenshot as painted-scene proof — a black canvas with chrome up is not "WebGPU unavailable".
- Record the feature id, platform, and the flow/command on every artifact.
- If a path is unreachable (no sim, no emulator, no photo library, no AWS keys), name the path and the unmet precondition. Do not mark it verified via a different entry point.

## Cleanup

```bash
node .cursor/skills/verify-solar-array/control.mjs cleanup
```

Removes scratch the CLI created (temp Maestro output dirs). **Never deletes** `.agents/evidence/verify-solar-array/`. Does not kill a simulator, emulator, Metro, or Maestro Cloud session this run did not start.

After cleanup, confirm evidence files still exist at the named path.

## Helpers

All invocations are from the repo root.

| Command | What it does |
| --- | --- |
| `control.mjs --help` | Command surface, backends, examples |
| `control.mjs doctor` | Backend + toolchain + map + iOS sim + Android adb (no device = OK) |
| `control.mjs features` | Feature Map index (same files as `features/`) |
| `control.mjs list-flows` | Top-level `.maestro/*.yaml` names |
| `control.mjs smoke` | `maestro test .maestro/smoke-test.yaml` |
| `control.mjs run-flow <name>` | `maestro test` a named top-level flow |
| `control.mjs screenshot [path]` | `maestro screenshot` when a device exists |
| `control.mjs cleanup` | Drop scratch; keep evidence |

`--json` on `doctor`, `features`, `list-flows`, and drive commands. `--backend=maestro\|eas\|mac` (default `maestro`). `--platform=ios\|android` on drive commands.

Package script: `bun run verify-solar-array -- <cmd>` (same CLI).

When you change a screen, navigation, or a visible string, update the matching Feature Map file in the same PR and re-run the mapped flow. `/maintain-verification-skill` is the periodic honesty pass.

## Planned backends (do not implement here)

- **`eas`:** `eas.json` already has `development-simulator` and `preview-simulator` (`ios.simulator: true`). Next PR: `eas simulator:start` / `eas simulator:exec` plus `agent-device`. This skill must keep `--backend=eas`.
- **`mac`:** a Mac worker running `serve-sim` (Xcode Simulator + Android emulator + Metro). Next PR plugs a driver behind `--backend=mac`.

`.eas/workflows/deploy.yml` and `pr-preview.yml` are production deploy/preview. Do not change them to require a simulator.
