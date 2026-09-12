---
name: verify-solar-array
description: Drive the Expo/React Native Solar Array Simulator the way a user does (Maestro today; EAS Simulator and Mac/serve-sim later). Use before claiming UI, navigation, or screen work is done — not for unit-test-only or status-200 checks.
---

# Verify Solar Array Simulator

This skill is a **driver contract**, not a unit-test substitute.

- Use it after changing screens, navigation, or interactive UI.
- Do not treat `bun test`, `bun run lint`, or HTTP 200 as proof the user path works.
- Read `features/` for what Maestro can actually see today. Do not invent a happy path that the product does not expose.

## Current backends

| Backend | Status | How to invoke |
| --- | --- | --- |
| **maestro** | Wired. Default. | `node .cursor/skills/verify-solar-array/control.mjs <cmd> [--platform=ios\|android] [--device=<id>]` |
| **eas** | Not wired. | `--backend=eas` exits 2 and prints the missing pieces. EAS Simulator on this repo is **Generac-only** (see `eas.json`). Personal verify stays Mac local Simulator + `emulator-5554`. |
| **mac / serve-sim** | Not wired. | `--backend=mac` exits 2. `serve-sim` is not a backend that exists in this repo. |

## Commands (Maestro)

```bash
# List feature files
node .cursor/skills/verify-solar-array/control.mjs features

# Check Maestro + simulators
node .cursor/skills/verify-solar-array/control.mjs doctor

# Launch-only smoke (Welcome visible)
node .cursor/skills/verify-solar-array/control.mjs smoke --platform=ios
node .cursor/skills/verify-solar-array/control.mjs smoke --platform=android --device=emulator-5554

# Named flow
node .cursor/skills/verify-solar-array/control.mjs run-flow wizard-happy-path --platform=ios
node .cursor/skills/verify-solar-array/control.mjs run-flow wizard-happy-path --platform=android --device=emulator-5554
node .cursor/skills/verify-solar-array/control.mjs run-flow production-menu --platform=ios
node .cursor/skills/verify-solar-array/control.mjs run-flow production-menu --platform=android --device=emulator-5554
node .cursor/skills/verify-solar-array/control.mjs run-flow simulation-nav --platform=ios
node .cursor/skills/verify-solar-array/control.mjs run-flow simulation-nav --platform=android --device=emulator-5554
node .cursor/skills/verify-solar-array/control.mjs run-flow analyze-skip --platform=ios
node .cursor/skills/verify-solar-array/control.mjs run-flow analyze-skip --platform=android --device=emulator-5554
node .cursor/skills/verify-solar-array/control.mjs run-flow details-sheets --platform=ios
node .cursor/skills/verify-solar-array/control.mjs run-flow details-sheets --platform=android --device=emulator-5554
node .cursor/skills/verify-solar-array/control.mjs run-flow full-app-tour --platform=ios
node .cursor/skills/verify-solar-array/control.mjs run-flow full-app-tour --platform=android --device=emulator-5554
```

`control.mjs` defaults `MAESTRO_DRIVER_STARTUP_TIMEOUT` to `180000` when unset so Maestro has time to attach after Expo cold start. Override that env if a machine needs more.

`--backend=eas|mac` always fails today. Do not pretend those backends exist.

## What you must actually drive

Match the change to a feature file, then run the matching Maestro flow. One screenshot of a static screen is not enough.

| If you changed | Drive | Notes |
| --- | --- | --- |
| Welcome / Get Started | `smoke` + `wizard-happy-path` | Welcome is real. |
| Config (SwiftUI Form / inverters) | `wizard-happy-path` + `details-sheets` | One `src/app/config.tsx` (#63). `config.web.tsx` is the web stub. Android inverter row is `id: inverter-row-1`. |
| inverter-details / panel-details | `details-sheets` | Shared `FieldGroup` bodies (#64). Drive via Config `id: inverter-row-1` + Custom `openLink` `/panel-details?panelId=seed-panel`. Do not use Custom Add. Presentation chrome is `InverterDetailsScreen.*` / `PanelDetailsScreen.*` (#56). |
| Upload | `wizard-happy-path` + `analyze-skip` | One `src/app/upload.tsx` (#59). No Host/entering first paint. Android Skip is Pressable. |
| Analyze (model picker / Skip / Continue) | `analyze-skip` | One `src/app/analyze.tsx` (#61). Header is `Select AI Model` on **both** platforms. Android Continue-without-photo is `id: analyze-empty-state-button`. Android Skip is Pressable. iOS Skip/Continue stay SwiftUI. |
| Custom canvas / toolbar / compass | `wizard-happy-path` | Shared `CustomChrome` (#62). Android Add works. `Badge` is only on the header-right unlinked count. Skia is not Maestro-visible — prove via toolbar side effects. Wizard Finish stays hidden until the first panel exists. |
| Production chrome / overflow | `production-menu` | One `src/app/production.tsx` (#55). Overflow a11y is still split: iOS `More options`, Android `Configuration options`. |
| Simulation 3D / sliders | `simulation-nav` | One `src/app/simulation.tsx` (#65). Season chips are `SeasonPicker.ios.tsx` / `.android.tsx` (#67). Empty-array 3D seed is `panelsForSimulationScene`. `sim-3d-proof` is panel+sun, not GPU-painted. |
| Compass help sheet | `full-app-tour` | One `src/app/compass-help.tsx` (#60). Chrome lives in `_layout`. Assert "Array Orientation". |
| Full Welcome → Simulation path | `full-app-tour` | Chains Welcome → Config → Upload Skip → Custom compass + first panel → Production menu → Simulation + `sim-3d-proof`. |

## Honesty rules (do not paper over)

1. **Skia / WebGPU / R3F are not Maestro-visible.** Canvas proof is toolbar side effects only. `sim-3d-proof` is Simulation chrome (panel + sun). GPU scene load is late — do not wait for `webgpu-scene-painted`.
2. **Wizard Finish is gated.** `shouldShowWizardFinish` is false until at least one panel exists. `wizard-happy-path` must assert Finish is **not** visible after compass, then add a panel, then Finish.
3. **Production overflow labels differ.** iOS `More options`, Android `Configuration options`. `production-menu` must not show Reload / Go home.
4. **Analyze header is `Select AI Model` on both platforms.** `wait-analyze-header.yaml` no longer branches. Do not wait for `SELECT AI MODEL`.
5. **Android Analyze empty-state Continue.** `analyze-skip` on Android taps `id: analyze-empty-state-button` instead of the system Photos picker.
6. **Android Skip / Analyze Pressable.** Upload and Analyze Skip on Android are RN `Pressable`, not SwiftUI Button.
7. **Android launch.** Wait for Dev Client Home, deep-link `http://10.0.2.2:8081`, dismiss Dev Menu, tap **Tools button** once. Expo Go / `exp://` / `launchApp` alone is not enough. Comments in `launch-android.yaml` say SDK 57.
8. **Compass help is iOS-only as a sheet.** Android compass opens a modal that Maestro cannot assert the same way.
9. **Do not "fix" the map to hide a product bug.** If Android ≠ iOS, leave it as a product issue and document it.
10. **Leftover platform chrome is in `src/components/screens/` (#56).** `config.web.tsx` stays in `src/app/`. Do not recreate `src/app/*.ios.tsx` / `*.android.tsx` for already-universal screens.
11. **No invented device video.** Linux CI / this VM cannot drive a simulator. Proof is the feature map + Maestro YAML + unit tests that lock the map. Attach a recording only when a real Maestro / Simulator run produced it.

## Personal Mac drive (required before claiming UI done)

```bash
export MAESTRO_DRIVER_STARTUP_TIMEOUT=180000
node .cursor/skills/verify-solar-array/control.mjs doctor
node .cursor/skills/verify-solar-array/control.mjs smoke --platform=ios
node .cursor/skills/verify-solar-array/control.mjs smoke --platform=android --device=emulator-5554
node .cursor/skills/verify-solar-array/control.mjs run-flow wizard-happy-path --platform=ios
node .cursor/skills/verify-solar-array/control.mjs run-flow wizard-happy-path --platform=android --device=emulator-5554
node .cursor/skills/verify-solar-array/control.mjs run-flow production-menu --platform=ios
node .cursor/skills/verify-solar-array/control.mjs run-flow production-menu --platform=android --device=emulator-5554
node .cursor/skills/verify-solar-array/control.mjs run-flow simulation-nav --platform=ios
node .cursor/skills/verify-solar-array/control.mjs run-flow simulation-nav --platform=android --device=emulator-5554
node .cursor/skills/verify-solar-array/control.mjs run-flow analyze-skip --platform=ios
node .cursor/skills/verify-solar-array/control.mjs run-flow analyze-skip --platform=android --device=emulator-5554
node .cursor/skills/verify-solar-array/control.mjs run-flow details-sheets --platform=ios
node .cursor/skills/verify-solar-array/control.mjs run-flow details-sheets --platform=android --device=emulator-5554
node .cursor/skills/verify-solar-array/control.mjs run-flow full-app-tour --platform=ios
node .cursor/skills/verify-solar-array/control.mjs run-flow full-app-tour --platform=android --device=emulator-5554
```

## When you cannot drive a device

Say so. Update the feature files and Maestro YAML so the next Mac run has a true map. Do not invent a full-app video.

## See also

- Feature files: `.cursor/skills/verify-solar-array/features/`
- Maestro flows: `.maestro/`
- CLI: `.cursor/skills/verify-solar-array/control.mjs`
- Evidence receipts: `.agents/evidence/verify-solar-array/` (gitignored except `README.md`)
