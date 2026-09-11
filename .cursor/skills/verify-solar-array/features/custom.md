# Custom (canvas + panel details)

Wizard step 3 (`/custom?wizard=true`): Skia canvas for laying out panels. Selected panels can be rotated, deleted, or linked to a micro-inverter via the Panel Details sheet. Finish (wizard, panels > 0) writes `wizardCompleted` and opens Production.

## Sub-features

- `custom-canvas` mounts `id: canvas-container` with zoom controls.
- `custom-add` toolbar plus adds a panel. Wizard "Finish" appears only after `panels.length > 0`.
- `custom-select-actions` after a selection: Link inverter, Rotate, Delete.
- `custom-panel-details` form sheet `/panel-details?panelId=…` (link / unlink / empty state).
- `custom-panel-view` from Production tap (read-only, `mode=view`) — covered here because it is the same sheet.
- `custom-finish` Finish → Production ("Total Array Output").

## How to get to it (user POV)

- Upload → Skip.
- Analyze → Skip or Continue.
- Config is not a direct jump; users pass Upload.

## Driving it with the harness

Preconditions:

- Wizard Custom via Skip (no photo) or after Analyze.
- Skia nodes are **not** Maestro-accessible. Prove via toolbar side effects.

- **Land on canvas.** `run-flow wizard-happy-path` after Upload Skip: `id: canvas-container` visible. Assert "Finish" is **not** visible on the empty canvas (Android used to show it anyway).
- **Add panel.** `shared/tap-add-panel.yaml`: iOS `add` (SF `plus`), Android `Add panel` (`CUSTOM_ADD_PANEL_A11Y` on a RN `Pressable` with `accessibilityRole="button"`). Wait for animation. Assert "Finish". Do not skip that assert.
- **Finish.** Tap "Finish". Wait for "Total Array Output".
- **Link inverter.** After add, tap `link` / "Link inverter". Sheet: "Available Inverters" or "Linked Inverter" or "No Available Inverters". Link a serial, dismiss, reopen — the same serial is still linked. No committed Maestro flow; drive as a follow-up.
- **Empty inverters.** If every inverter is already linked, the sheet shows "No Available Inverters" and "Add Inverter" → Config.
- **Production view sheet.** On Production, tap a **linked** panel (Skia — usually unreachable to Maestro). If you cannot tap, say `verified-unreachable` and prove the editor sheet from Custom instead.
- **Proof.** `canvas-container` + "Finish" after add, then Production chrome. That is the mapped wizard proof. Canvas geometry/collision is unit-tested (`src/utils/__tests__/collision.test.ts`) and is **not** a substitute for this screen.

## Gotchas

- Shared `custom.tsx` is a stub. Product UI is `custom.ios.tsx` / `custom.android.tsx`, both mounting the same `CustomHeaderToolbar` / `CustomBottomToolbar` tree (`src/components/CustomChrome.tsx`). Icons are SF Symbol vs Material (`Platform` only).
- Android `Stack.Toolbar.Button` puts `accessibilityLabel` on a Compose `Icon` (`android.view.View`, `clickable=false`). Maestro then taps a dead node (PR #62 dump: Add panel `[509,2222][572,2285]`). Android tappable chrome (Add, compass, snap, selected actions, Finish) uses `Stack.Toolbar.View` + RN `Pressable` `accessibilityRole="button"` instead. Zoom ± already work that way.
- Android add control is labeled "Add panel", not `add`. Shared `tap-add-panel.yaml` branches. Do not skip the Finish assert if Add misses (#54).
- Finish is hidden when `panels.length === 0` or not in wizard mode (`shouldShowWizardFinish`). Adding then deleting the last panel hides it again.
- `Stack.Toolbar.Badge` is only on the header-right link `Stack.Toolbar.Button` when `unlinkedCount > 0`. Do not add Badge on Production / Config / bottom toolbar. Android omits `accessibilityLabel` on that Badge button so Maestro does not hit a second dead node.
- Compass toggle is a different feature ([compass-help.md](compass-help.md)).
- Collision uses an 8px gap. Overlap on drag-release is app behavior; Maestro cannot see it.
