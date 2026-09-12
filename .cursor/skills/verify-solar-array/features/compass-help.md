# Compass help

Form sheet explaining array orientation. Opened from the Custom canvas compass, not from a tab. Product copy lives in `src/utils/compassHelpCopy.ts`. `src/app/compass-help.tsx` is a thin leftover re-export of `CompassHelpScreen.*`. iOS stays Router `formSheet` (detent `0.3`). Android is `transparentModal` + Compose `ModalBottomSheet` (default drag handle, swipe / back / scrim dismiss) — the same layer as inverter/panel details. Do not replace this route with in-tree `@expo/ui` `BottomSheet` (`isPresented`). Stub text ("Compass help is not yet implemented") and the old `compass-help.ios.tsx` / `compass-help.android.tsx` forks are gone (#60).

## Sub-features

- `compass-toggle` Custom toolbar ("Toggle compass") shows the compass overlay and, on first show, opens this sheet.
- `compass-tap` tapping the compass overlay also pushes `/compass-help`.
- `compass-sheet` copy: "Array Orientation" and the drag-the-arrow explanation.

## How to get to it (user POV)

- Custom → toolbar Toggle compass (first tap also opens the sheet).
- Custom → with compass visible, tap the compass control.

## Driving it with the harness

Preconditions:

- On Custom (`id: canvas-container`), typically after Upload Skip.
- `run-flow full-app-tour` opens this sheet (Toggle compass → "Array Orientation") before adding a panel. There is no dedicated top-level YAML besides that tour.

- **Open from toolbar.** From Custom, tap "Toggle compass" (accessibilityLabel on both platforms; iOS also exposes SF `location.north.circle`). Sheet shows "Array Orientation". iOS header-right must keep this button as a direct `Stack.Toolbar.Button` next to link+Badge and Snap — a wrapper is dropped by Expo Router's iOS header-item filter.
- **Open from compass.** If the sheet is dismissed and the overlay is still visible, tap the compass. Same sheet.
- **Dismiss.** Swipe the sheet / drag handle / system back. Custom canvas remains; compass overlay stays if it was shown.
- **Proof.** Visible "Array Orientation" (and the facing-direction paragraph) after a user tap from Custom. Screenshot the sheet. Product copy is `src/utils/compassHelpCopy.ts`. Android must look like the inverter/panel Material sheet (handle + dimmed Custom behind), not a full-screen page.

## Gotchas

- Leftover chrome: `src/components/screens/CompassHelpScreen.ios.tsx` (RN `CompassHelpBody` in Router `formSheet`) and `CompassHelpScreen.android.tsx` (`Host` + `ModalBottomSheet`). Do not put sheet chrome in `src/app/compass-help.tsx`. Do not use in-tree `BottomSheet` (`isPresented`).
- Android `_layout` `contentStyle` is not an opaque full-page fill — the Compose sheet supplies the scrim.
- First toolbar tap both shows the overlay **and** pushes the sheet (`handleCompassToggle`). A second toolbar tap hides the overlay and does not reopen the sheet.
- Production's compass is read-only and does **not** open this sheet.
- No testID on the sheet. Use the heading text "Array Orientation".
- Android toolbar a11y is "Toggle compass" (Navigation XML), not the SF symbol name. iOS uses both the SF icon and the same accessibilityLabel.
- Drive both platforms: Custom → compass toggle → help sheet → dismiss → back to canvas. Android is a Material sheet, not a full-screen page. This Linux VM cannot drive a device; the next Mac `full-app-tour` is the visual proof.
