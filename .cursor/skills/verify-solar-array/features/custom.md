# Custom (canvas + panel details)

Wizard step 3 (`/custom?wizard=true`): Skia canvas for laying out panels. Selected panels can be rotated, deleted, or linked to a micro-inverter via the Panel Details sheet. Finish (wizard, panels > 0) opens Production on the first tap; Production persists `wizardCompleted`.

Custom chrome is one toolbar tree (#62): `CustomHeaderToolbar` / `CustomBottomToolbar`. Android Add works. Badge is only on the header-right unlinked count. `#56` moved the leftover mounts to `src/components/screens/CustomScreen.ios.tsx` / `CustomScreen.android.tsx`. `src/app/custom.tsx` is a thin re-export; `CustomScreen.tsx` is the web stub.

## Sub-features

- `custom-canvas` mounts `id: canvas-container` with zoom controls.
- `custom-add` toolbar plus adds a panel. Wizard "Finish" appears only after `shouldShowWizardFinish` (`wizard` and `panels.length > 0`).
- `custom-select-actions` after a selection: Link inverter, Rotate, Delete.
- `custom-panel-details` form sheet `/panel-details?panelId=…`. Body is shared `PanelDetailsForm` (`FieldGroup`, #64). iOS formSheet / Android `ModalBottomSheet` chrome live in `PanelDetailsScreen.*` and `_layout`.
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

- **Land on canvas.** `run-flow wizard-happy-path` after Upload Skip: `id: canvas-container` visible. Assert "Finish" is **not** visible on the empty canvas. `full-app-tour` also lands here, opens compass help, then adds a panel.
- **Add panel.** `shared/tap-add-panel.yaml`: iOS `add` (SF `plus`), Android `Add panel` (`CUSTOM_ADD_PANEL_A11Y` on a RN `Pressable` with `accessibilityRole="button"`). Wait for animation. Assert "Finish". Android Add works after #62 — do not skip that assert.
- **Finish.** One tap on "Finish". Wait for "Total Array Output". Do not deeplink Production. Do not double-tap Finish in Maestro.
- **Link inverter.** Do **not** require a Skia canvas tap. `run-flow details-sheets`: Config `id: inverter-row-1` for inverter-details (row tap, no `openLink` paper); `openLink` `/panel-details?panelId=seed-panel` for panel-details (`ensureSeedPanel`). After add, the new panel is auto-selected so `link` / "Link inverter" is also a toolbar path — still not the required proof.
- **Empty inverters.** If every inverter is already linked, the sheet shows "No Available Inverters" and "Add Inverter" → Config.
- **Production view sheet.** On Production, tap a **linked** panel (Skia — usually unreachable to Maestro). If you cannot tap, say `verified-unreachable` and prove the editor sheet from `details-sheets` instead.
- **Proof.** `canvas-container` + "Finish" after add, then Production chrome. Canvas geometry/collision is unit-tested and is **not** a substitute for this screen.

## Gotchas

- Product chrome is `src/components/CustomChrome.tsx`. Leftover mounts are `src/components/screens/CustomScreen.ios.tsx` / `CustomScreen.android.tsx` (icons SF vs Material). Web stub `CustomScreen.tsx` is not success.
- Android `Stack.Toolbar.Button` puts `accessibilityLabel` on a Compose `Icon` (`clickable=false`). Android tappable chrome uses `Stack.Toolbar.View` + RN `Pressable` (`accessibilityRole="button"`, `collapsable={false}`). Keep Compose `Icon` **without** an a11y label; draw the Pressable **above** the Host. Do not put the Host inside the Pressable.
- Panel Details body is `src/components/PanelDetailsForm.tsx`. Sheet presentation lives in `PanelDetailsScreen.*` and `_layout`. Do not add a Host on the shared form.
- Android add control is labeled "Add panel", not `add`. Shared `tap-add-panel.yaml` branches.
- Finish is hidden when `panels.length === 0` or not in wizard mode (`shouldShowWizardFinish`).
- Android Finish visual is Skia (`AndroidWizardFinishGlyph.android.tsx`), not RN `Text`. `2b98df6`: one Finish a11y node, but `tapOn: Finish` deselected the panel and collapsed the Host to Add — the canvas `GestureDetector` got the coordinates (#80: a11y box ≠ clickable hit). Finish is a last-child `box-none` overlay on `canvas-container` with an RNGH Pressable whose width/height fill that a11y box (`ANDROID_WIZARD_FINISH_HIT_*`, elevation 16). Official happy path stays one `tapOn: "Finish"`. On press the same control flips to `Tapped` then Redirect. Do not add a TextView or a second Finish tap.
- Android Finish / FINISH nodes before press (`listAndroidFinishA11yNodes`): **exactly one** — `AndroidWizardFinishButton` `accessibilityLabel="Finish"`. No RN TextView with Finish. iOS `WizardFinishButton` is not mounted on Android. Do **not** add a second Finish tap, `navigate`, `reset`, or retry.
- Finish records `/production` and Custom renders `<Redirect>` (same Expo-owned path as Welcome). Do **not** `router.push` / `navigation.navigate` / `navigation.reset` / same-tap retry — those leave the file route at `/custom?wizard=true` so one tap still shows Layout + FINISH. Persist `wizardCompleted` in `useProductionMonitor`.
- Welcome Redirect is launch-time only (`useState(getWizardCompleted)`). A live `useConfigStore` subscription must not mount Redirect when the flag flips.
- `Stack.Toolbar.Badge` is only on the header-right link button when `unlinkedCount > 0`. Android omits `accessibilityLabel` on that Badge button.
- Compass toggle is a different feature ([compass-help.md](compass-help.md)).
- Collision uses an 8px gap. Overlap on drag-release is app behavior; Maestro cannot see it.
