# Production

Post-wizard home: live-ish total wattage, a read-only canvas, compass, Edit/Delete configuration, and Simulate.

## Sub-features

- `production-output` shows "Total Array Output" and a formatted wattage.
- `production-simulate` header sun control → `/simulation`.
- `production-edit` Production menu → Edit Configuration → Config (wizard).
- `production-delete` Production menu → Delete Configuration → Welcome.
- `production-panel-view` tap a linked panel → Panel Details `mode=view`.

## How to get to it (user POV)

- Custom (wizard) → one Finish tap (`<Redirect href="/production" />`). Production persists `wizardCompleted` on mount. Do not deeplink this as the primary proof.
- Cold launch after the wizard has been completed (Welcome redirects here).
- Returning from Simulation via back.

## Driving it with the harness

Preconditions:

- At least one panel (Finish is hidden otherwise). Shared flow: `wizard-to-production.yaml`.
- Android Dev Client Tools overlay must already be off (`launch-fresh.android` opens the FAB if needed, swipes the Dev Menu up, taps **Tools button** once, dismisses).

- **Arrive via wizard.** `run-flow wizard-happy-path` ends on "Total Array Output". `run-flow full-app-tour` also lands here before Simulation.
- **Simulate.** `run-flow simulation-nav` taps "Simulate" (`tap-simulate.yaml`), waits for "Simulation".
- **Edit / delete.** `run-flow production-menu`: tap the Production menu (`tap-more-options.yaml`: iOS "More options", Android header "Configuration options" next to Simulate), "Edit Configuration" → "Panel Settings" / "Default Production" (and **not** Reload / Go home); resume to Production via `wizard-resume-to-production.yaml`; then "Delete Configuration" → "Solar Array Simulator" + `get-started-button`.
- **Returning launch.** After Finish, kill and relaunch **without** `clearState`. Production must show, not Welcome.
- **Proof.** "Total Array Output" visible after Finish, plus the menu or Simulate path you changed. Wattage text is selectable; asserting the label is enough unless the change is the formatter.

## Gotchas

- One universal route: `src/app/production.tsx` (no `production.ios.tsx` / `production.android.tsx` — #55 landed). Icons, a11y, and the output-card inset fork via `Platform` / `productionChrome` helpers. Do not wrap this screen in `@expo/ui` `Host`. Shared a11y constants live in `src/utils/productionChrome.ts`.
- Simulate = iOS `accessibilityLabel="Simulate"` / Android Icon `contentDescription="Simulate"` (same string).
- Menu a11y is a **product** split: iOS `More options` (`PRODUCTION_MENU_A11Y_IOS`) / Android `Configuration options` (`PRODUCTION_MENU_A11Y_ANDROID`) on `Stack.Toolbar.Menu` in the right header (sibling of Simulate). Do not flatten these strings. Dev Client AppBar overflow is also "More options" — that is why Android uses a different label. If the header ⋮ opens Reload / Go home / Tools, the Dev Client **Tools button** toggle is still on — turn it off (Dev Menu row or `hideDevClientToolsButton`), do not move the menu onto the card. Same action titles: "Edit Configuration", "Delete Configuration".
- `production-menu` must assert `Reload` and `Go home` are **not** visible after the overflow tap. Seeing them is a launch/Tools failure, not a missing Production feature.
- Delete calls `resetAllData` + `clearPanels` + `replace("/")`. Subsequent launches show Welcome.
- Edit Configuration pushes `/config?wizard=true`, so Continue/Skip/Finish are back. `wizard-resume-to-production.yaml` assumes you are already on Config and does **not** re-add a panel (Finish is already available).
- Tapping an **unlinked** panel does nothing. View sheet only opens when `inverterId` is set.
- Card inset differs (iOS `insets.top + IOS_CARD_INSET_EXTRA`, Android `insets.top + ANDROID_APPBAR_HEIGHT + ANDROID_CARD_INSET_EXTRA`). That is layout, not a missing menu.
