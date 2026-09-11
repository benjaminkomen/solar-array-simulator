# Config

Wizard step 1 (`/config?wizard=true`) and later "Edit Configuration". Sets default panel wattage, optional city, roof type/tilt, and the micro-inverter list (add/edit/delete sheets).

Product UI is one `FieldGroup` in `src/app/config.tsx` (web stub is `config.web.tsx`). Roof type uses a documented platform segmented control (`RoofTypePicker.ios.tsx` / `.android.tsx`) because universal `Picker` has no `segmented` appearance. Inverter delete stays on platform swipe (`List.ForEach` / `SwipeToDismissBox`) because universal `List` has no swipe-delete.

## Sub-features

- `config-wizard-chrome` shows wizard progress (Configure / Photo / Layout) and a Continue toolbar button.
- `config-panel-settings` edits Default Production wattage (default 430 W).
- `config-location` searches a city and stores lat/long for Simulation.
- `config-roof` picks roof type (flat / gable / hip / shed) and tilt (0–90°).
- `config-inverters` lists seeded micro-inverters; tap opens Inverter Details; plus adds one; swipe deletes.
- `config-edit-from-production` is the same form after Production → Edit Configuration.

## How to get to it (user POV)

- Welcome → Get Started (`/config?wizard=true`).
- Production → Production menu → Edit Configuration (also `wizard=true`).
- Panel Details → Add Inverter (pushes `/config` without requiring wizard chrome).
- Config toolbar plus → Inverter Details (`/inverter-details?mode=add`). Tap a row → `mode=edit`.

## Driving it with the harness

Preconditions:

- On Welcome (cleared) or on Production (for the edit entry).
- Drive iOS Simulator or Android emulator. Android uses Jetpack Compose chrome with the same body copy (`Panel Settings`, `Continue`).

- **Enter from Welcome.** `smoke` or `run-flow wizard-happy-path`: tap `id: get-started-button`, wait for "Panel Settings". Assert "Configure", "Photo", "Layout", and "Default Production".
- **Continue.** Tap "Continue". Upload ("Take or Select Photo") is the success state. Do not skip this if you changed the toolbar. A LogBox overlay ("Can't perform a React state update on a component that hasn't mounted yet") is a product failure — dismiss/retry is not success.
- **Add inverter.** Tap toolbar `add` (iOS `icon="plus"`, accessibilityLabel "Add inverter"). Sheet title is "New Micro-inverter". Cancel (`xmark` / "Cancel") dismisses without a new row; Save (`checkmark` / "Save") returns to Config with count + 1. No Maestro flow covers the sheet — drive it as a follow-up after Config is on screen.
- **Edit inverter.** Tap a serial-number row. Sheet title is "Edit Micro-inverter". Change efficiency, Save, assert the row subtitle (`N% efficiency`).
- **Edit from Production.** `run-flow production-menu` opens the menu, taps "Edit Configuration", asserts "Panel Settings" and "Default Production".
- **Proof.** Visible "Panel Settings" / "Default Production" after the entry you claim. If you edited wattage or an inverter, the same values still show after leaving and returning via Edit Configuration.

## Gotchas

- Product UI is `src/app/config.tsx` (`FieldGroup` + `Host`). `config.web.tsx` is the web stub. Do not add `config.ios.tsx` / `config.android.tsx` back.
- Header options for Config and Upload live in `_layout` (`headerBackButtonDisplayMode: "minimal"`). Do not set `Stack.Screen` options from Config, and do not put `Host` on Upload first paint — that is the Config→Upload LogBox race.
- SwiftUI section headers may be invisible to Maestro — assert "Default Production", not the header node.
- Location search hits the network. An empty result list is not a product bug if the query is garbage or the geocoder is down; say so.
- Seeded config ships **14** inverters. Do not assume an empty list on first launch.
- Continue is **wizard-only**. Edit-from-Production still uses `wizard=true`, so Continue is present; that is how `wizard-resume-to-production.yaml` works.
- Roof chips are platform segmented controls, not universal `Picker appearance="segmented"` (that API does not exist).
- Inverter swipe-delete is platform-only (`InverterSection.ios.tsx` / `.android.tsx`). Universal `List` has no `onDelete`.
