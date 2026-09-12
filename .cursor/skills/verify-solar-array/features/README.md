# Solar Array Simulator feature map

Behavior-level inventory for the Expo/React Native app (`com.bkomen.solararraysimulator`). Agents use this map to decide what to drive and what evidence counts. Humans use it as the regression checklist.

Surface: iOS Simulator and Android emulator development builds (SDK 57). Maestro YAML in `.maestro/` branches by platform (`launch-fresh.ios.yaml` / `launch-fresh.android.yaml`, plus shared tap helpers). Every listed screen exists on both platforms. Do **not** write "iOS-only route" or "Android-only route" — a missing platform file is not a missing product screen.

**Already universal on current main — do not paper as still-split:**

- `src/app/production.tsx` (#55)
- `src/app/compass-help.tsx` (#60; chrome stays in `_layout`)
- `src/app/config.tsx` (#63; `config.web.tsx` is the web stub)
- `src/app/simulation.tsx` (#65 + #67 chips + #75 community `SeasonPicker`, empty-array 3D seed)
- Custom chrome (#62; shared `CustomHeaderToolbar` / `CustomBottomToolbar`; Android Add works; Badge on header-right unlinked count)
- `src/app/upload.tsx` (#59; no Host/entering first paint; Android Skip Pressable)
- `src/app/analyze.tsx` (#61; universal Picker; header **Select AI Model** on both; Android Continue without photo + Skip Pressable)
- inverter-details / panel-details FieldGroup bodies (#64; `InverterDetailsForm` / `PanelDetailsForm`; drive via Config `inverter-row-1` + `seed-panel`)

**Leftover platform chrome (#56) lives in `src/components/screens/`:** `CustomScreen.ios.tsx` / `CustomScreen.android.tsx` mount the shared chrome (`CustomScreen.tsx` is the web stub); `InverterDetailsScreen.*` / `PanelDetailsScreen.*` are presentation chrome only. `src/app/custom.tsx`, `inverter-details.tsx`, and `panel-details.tsx` are thin re-exports. `src/app/config.web.tsx` stays. Do not invent extra stubs. Do not treat web-stub copy as success.

## Baseline preconditions

- Installed development client: iOS `development-simulator`, Android `development` APK on an AVD. Personal verify device is **Mac local Simulator + `emulator-5554`**. Production/TestFlight binaries will not reconnect to Metro the way `launch-fresh` expects.
- Metro running (`bun start`) unless you are driving a fully bundled preview build.
- `node .cursor/skills/verify-solar-array/control.mjs doctor` has run. It lists iOS sim and Android `adb` separately. No device is OK for doctor; it is **not** OK for a claimed UI proof.
- Start recipes from a cleared app unless the file says otherwise. `.maestro/shared/launch-fresh.yaml` is the reset: `clearState: true`, platform deep-link (iOS `127.0.0.1:8081`, Android AVD `10.0.2.2:8081`). Android waits for Dev Client Home (`DEVELOPMENT SERVERS`) before `openLink`, then Recently Opened / typed Connect if the deep-link is dropped, dismisses Dev Menu, taps **Tools button** once (`hide-android-dev-client-tools.yaml`), then "Solar Array Simulator".
- Maestro driver startup: `MAESTRO_DRIVER_STARTUP_TIMEOUT=180000` (the CLI sets this if unset).
- Prefer testIDs and visible text already used by Maestro. Do not tap Skia/WebGPU canvas coordinates as the primary proof.
- `--backend=maestro` is the only implemented driver. `--backend=eas` and `--backend=mac` are stubs. **EAS Simulator is Generac-only / preview** — not the personal solar-array verify backend.

## Proof and skip reporting

- Exercise every reachable entry point the feature file lists for the change under test.
- Record the user action and the resulting visible state. Receipts land in `.agents/evidence/verify-solar-array/`.
- Mocks count only behind the same production boundary the missing dependency uses (e.g. no AWS keys → do not claim Analyze-with-Bedrock; Skip is a real user path).
- Unreachable paths: name the path, the unmet precondition (no sim, no Photos library, empty gallery, Cloud VM), and the closest real path that remains. Do not report a skip as verified through a different entry point.
- **Do not paper over product bugs.** If Android ≠ iOS (labels, a11y, toolbar widgets), record both. File a product issue; do not rewrite the map to pretend they match.

## Honest product diffs (do not flatten)

These are current-main facts.

- Production overflow a11y: iOS `More options`, Android `Configuration options`. Same header-right slot, sibling of Simulate. `production-menu` must open Edit/Delete and must **not** show Reload / Go home.
- Analyze header is **Select AI Model** on both platforms. Android empty gallery uses `id: analyze-empty-state-button` — do not open the system picker.
- Custom add: Maestro iOS `add` (SF `plus`), Android `Add panel` (RN Pressable). Both product a11y labels are `Add panel`. Android Add works after #62.
- Android Skip / Continue / Analyze / Finish use `Stack.Toolbar.View` + Pressable (Toolbar.Button text children are not in the Android a11y tree). Source strings stay `Skip` / `Continue` / `Finish` / `Analyze`.
- Finish is hidden until `shouldShowWizardFinish(wizard, panels.length)` — **not** visible on an empty wizard canvas.
- `sim-3d-proof` is panel + sun (seeded if the array is empty). Chrome-only is not enough. GPU loads late.
- `analyze-skip` iOS Photos (`Photos` + `17%,25%`). Android must tap Continue without photo.

## Full sweep

Walk this list top to bottom for a broad regression. `wizard-happy-path` covers Welcome → Config → Upload (Skip) → Custom → Production. `details-sheets` covers inverter/panel FieldGroup bodies without Custom Add. `full-app-tour` is the long walk (wizard + compass sheet + Production menu + Simulation chrome) used for the iPhone 17 recording. The tour **video** is Mac-side; this Cloud VM does not invent it.

## Features

- [Welcome](welcome.md): first-run hero, Get Started, returning-user redirect.
- [Config](config.md): wizard step 1 — panel wattage, location, roof, micro-inverters.
- [Upload](upload.md): wizard step 2 — camera, gallery, Skip, Continue without photo.
- [Analyze](analyze.md): model picker, Skip, Analyze (Bedrock), results.
- [Custom](custom.md): canvas editor, add/rotate/delete/link panels, Finish.
- [Production](production.md): total output, edit/delete config, panel view sheet.
- [Simulation](simulation.md): 3D scene, time slider, seasons.
- [Compass help](compass-help.md): array-orientation sheet from the custom canvas.

## Entry contract

Every feature file uses the same four H2s:

1. `Sub-features`
2. `How to get to it (user POV)`
3. `Driving it with the harness`
4. `Gotchas`

## Collapse hooks

All listed collapses have landed, including leftover-file move **#56**.

| After | Status | Feature file |
| --- | --- | --- |
| landed #62 | Custom chrome is one toolbar tree; `#56` mounts it from `CustomScreen.ios.tsx` / `.android.tsx` | [custom.md](custom.md) |
| landed #55 | `production.tsx` universal | [production.md](production.md) |
| landed #59 | `upload.tsx` universal | [upload.md](upload.md) |
| landed #61 | `analyze.tsx` universal Picker | [analyze.md](analyze.md) |
| landed #60 | `compass-help.tsx` universal | [compass-help.md](compass-help.md) |
| landed #65 / #67 / #75 | `simulation.tsx` + community segmented `SeasonPicker` | [simulation.md](simulation.md) |
| landed #75 | roof + season use `@expo/ui/community/segmented-control`; Android Config embeds that drop-in through `RNHostView` | [config.md](config.md), [simulation.md](simulation.md) |
| landed #64 | details FieldGroup bodies; `#56` moved presentation chrome | [config.md](config.md), [custom.md](custom.md) |
| landed #63 | `config.tsx` FieldGroup (`config.web.tsx` stub) | [config.md](config.md) |
| landed #56 | leftover Custom/details platform chrome is in `src/components/screens/` | this README |

`theme.android.ts` stays in `utils/`. `_layout.tsx` and `index.tsx` are already one file. Do not invent a second Android EAS profile. Do not move Production ⋮ onto the output card.
