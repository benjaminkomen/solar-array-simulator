# Config

Wizard step 1 (`/config?wizard=true`) and later "Edit Configuration". Sets default panel wattage, optional city, roof type/tilt, and the micro-inverter list (add/edit/delete sheets).

Product UI is one `FieldGroup` in `src/app/config.tsx` (#63; web stub is `config.web.tsx`). iOS roof chips are `@expo/ui/community/segmented-control` (#75) because universal `Picker` has no `segmented` appearance. Android Config FieldGroup is Compose — `RoofTypePicker.android.tsx` is `SingleChoiceSegmentedButtonRow` + `fillMaxWidth()`. Do **not** embed `RNHostView` / `width: "100%"` on a Compose `Column` (`FieldCastException`, crash to launcher). Inverter delete stays on platform swipe because universal `List` has no swipe-delete. Do not paper Config as still-split.

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
- Config toolbar plus → Inverter Details (`/inverter-details?mode=add`). Tap a row → `mode=edit`. Sheet body is shared `InverterDetailsForm` (`FieldGroup`, #64); presentation lives in `InverterDetailsScreen.*` / `_layout`.

## Driving it with the harness

Preconditions:

- On Welcome (cleared) or on Production (for the edit entry).
- Drive iOS Simulator or Android emulator (`emulator-5554`). Body copy is the same (`Panel Settings`, `Continue`, `Default Production`).

- **Enter from Welcome.** `smoke` or `run-flow wizard-happy-path`: tap `id: get-started-button`, wait for "Panel Settings". Assert "Configure", "Photo", "Layout", and "Default Production".
- **Continue.** Tap "Continue". Upload ("Take or Select Photo") is the success state. A LogBox overlay ("Can't perform a React state update on a component that hasn't mounted yet") is a product failure. Do not remount a Jetpack `Host` on Upload first paint.
- **Add inverter.** Tap toolbar control with accessibilityLabel "Add inverter" (iOS SF `plus` may also appear as `add`). Sheet title is "New Micro-inverter".
- **Edit inverter.** `run-flow details-sheets` after Welcome: the list inset must put the last visible inverter fully above Continue (a real thumb tap, not a swipe-to-uncover). Then tap `id: inverter-row-1` (seeded id `1`; serial text is random). A Maestro `scrollUntilVisible` is OK only after that inset. The **row tap** must open the sheet (Serial Number, Efficiency, Edit Micro-inverter). Do not paper this with `openLink`. After Save, wait for **Continue** (centering the row scrolls Panel Settings off-screen), then tap the same row again — the sheet reopens with the same fields. Do not go through Custom Add.
- **Edit from Production.** `run-flow production-menu` opens the menu, taps "Edit Configuration", asserts "Panel Settings" and "Default Production".
- **Proof.** Visible "Panel Settings" / "Default Production" after the entry you claim.

## Gotchas

- Product UI is `src/app/config.tsx` (`FieldGroup` + `Host`). `config.web.tsx` is the web stub. Do not add `config.ios.tsx` / `config.android.tsx` back.
- Header options for Config and Upload live in `_layout`. Do not set `Stack.Screen` options from Config, and do not put `Host` on Upload first paint.
- Inverter Details body is `src/components/InverterDetailsForm.tsx`. Presentation chrome is `src/components/screens/InverterDetailsScreen.ios.tsx` / `.android.tsx`. Save persists serial / efficiency; Cancel / back must not LogBox.
- SwiftUI section headers may be invisible to Maestro — assert "Default Production", not the header node.
- Location search hits the network. An empty result list is not a product bug if the query is garbage or the geocoder is down; say so.
- Seeded config ships **14** inverters. Do not assume an empty list on first launch.
- Continue is **wizard-only**. Edit-from-Production still uses `wizard=true`, so Continue is present; that is how `wizard-resume-to-production.yaml` works. Config reserves `configToolbarListInset` (96 + safe-area bottom) above the bottom toolbar so the last inverter row is not under Continue.
- iOS roof chips are `@expo/ui/community/segmented-control` (SwiftUI segmented). Android Config chips are Compose `SingleChoiceSegmentedButtonRow` (`RoofTypePicker.android.tsx`) with `fillMaxWidth()` — not `RNHostView`, not `style={{ width: "100%" }}` on `Column`, not universal `Picker appearance="segmented"`. Pixel proof is Gable / Hip / Flat / Shed on one row and horizontal FieldGroup titles — a11y strings alone are not enough. Get Started must open Config without crashing.
- Inverter swipe-delete is platform-only: iOS `SwipeActions` and Android `SwipeToDismissBox` (`InverterSection.ios.tsx` / `.android.tsx`). Do not wrap iOS rows in `List.ForEach` inside the Section — that packs every row into one Form cell and misses taps on the Spacer.
