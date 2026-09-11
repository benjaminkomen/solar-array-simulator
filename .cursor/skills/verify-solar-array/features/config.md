# Config

Wizard step 1 (`/config?wizard=true`) and later "Edit Configuration". Sets default panel wattage, optional city, roof type/tilt, and the micro-inverter list (add/edit/delete sheets).

## Sub-features

- `config-wizard-chrome` shows wizard progress (Configure / Photo / Layout) and a Continue toolbar button.
- `config-panel-settings` edits Default Production wattage (default 430 W).
- `config-location` searches a city and stores lat/long for Simulation.
- `config-roof` picks roof type (flat / gable / hip / shed) and tilt (0–90°).
- `config-inverters` lists seeded micro-inverters; tap opens Inverter Details; plus adds one; swipe deletes.
- `config-edit-from-production` is the same form after Production → Edit Configuration.

## How to get to it (user POV)

- Welcome → Get Started (`/config?wizard=true`).
- Production → More options → Edit Configuration (also `wizard=true`).
- Panel Details → Add Inverter (pushes `/config` without requiring wizard chrome).
- Config toolbar plus → Inverter Details (`/inverter-details?mode=add`). Tap a row → `mode=edit`.

## Driving it with the harness

Preconditions:

- On Welcome (cleared) or on Production (for the edit entry).
- iOS Maestro is the documented path; Android uses Jetpack Compose chrome with the same body copy.

- **Enter from Welcome.** `smoke` or `run-flow wizard-happy-path`: tap `id: get-started-button`, wait for "Panel Settings". Assert "Configure", "Photo", "Layout", and "Default Production".
- **Continue.** Tap "Continue". Upload ("Take or Select Photo") is the success state. Do not skip this if you changed the toolbar.
- **Add inverter.** Tap toolbar `add` (iOS `icon="plus"`, accessibilityLabel "Add inverter"). Sheet title is "New Micro-inverter". Cancel (`xmark` / "Cancel") dismisses without a new row; Save (`checkmark` / "Save") returns to Config with count + 1. No Maestro flow covers the sheet — drive it as a follow-up after Config is on screen.
- **Edit inverter.** Tap a serial-number row. Sheet title is "Edit Micro-inverter". Change efficiency, Save, assert the row subtitle (`N% efficiency`).
- **Edit from Production.** `run-flow production-menu` opens the menu, taps "Edit Configuration", asserts "Panel Settings" and "Default Production".
- **Proof.** Visible "Panel Settings" / "Default Production" after the entry you claim. If you edited wattage or an inverter, the same values still show after leaving and returning via Edit Configuration.

## Gotchas

- Shared `src/app/config.tsx` is a stub ("Configuration is not yet implemented"). Product UI is `config.ios.tsx` / `config.android.tsx`.
- SwiftUI section headers may be invisible to Maestro — assert "Default Production", not the header node.
- Location search hits the network. An empty result list is not a product bug if the query is garbage or the geocoder is down; say so.
- Seeded config ships **14** inverters. Do not assume an empty list on first launch.
- Continue is **wizard-only**. Edit-from-Production still uses `wizard=true`, so Continue is present; that is how `wizard-resume-to-production.yaml` works.
