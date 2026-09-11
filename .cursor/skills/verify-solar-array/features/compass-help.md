# Compass help

Form sheet explaining array orientation. Opened from the Custom canvas compass, not from a tab. Body lives in one route file (`src/app/compass-help.tsx`). Native chrome stays in `_layout` (iOS `formSheet` detent `0.3` vs Android `transparentModal`).

## Sub-features

- `compass-toggle` Custom toolbar (`location.north.circle` / "Toggle compass") shows the compass overlay and, on first show, opens this sheet.
- `compass-tap` tapping the compass overlay also pushes `/compass-help`.
- `compass-sheet` copy: "Array Orientation" and the drag-the-arrow explanation.

## How to get to it (user POV)

- Custom → toolbar Toggle compass (first tap also opens the sheet).
- Custom → with compass visible, tap the compass control.

## Driving it with the harness

Preconditions:

- On Custom (`id: canvas-container`), typically after Upload Skip.
- **No committed Maestro flow.** Compose a short drive; do not wait for a new YAML unless this change is the sheet.

- **Open from toolbar.** From Custom, tap "Toggle compass" (iOS SF Symbol; accessibilityLabel). Sheet shows "Array Orientation".
- **Open from compass.** If the sheet is dismissed and the overlay is still visible, tap the compass. Same sheet.
- **Dismiss.** Swipe down / system back. Custom canvas remains; compass overlay stays if it was shown.
- **Proof.** Visible "Array Orientation" (and the facing-direction paragraph) after a user tap from Custom. Screenshot the sheet. Product copy is `src/app/compass-help.tsx`. Stub text ("Compass help is not yet implemented") and the old `compass-help.ios.tsx` / `compass-help.android.tsx` forks are gone.

## Gotchas

- First toolbar tap both shows the overlay **and** pushes the sheet (`handleCompassToggle`). A second toolbar tap hides the overlay and does not reopen the sheet.
- Production's compass is read-only and does **not** open this sheet.
- Presentation chrome stays in `_layout`: iOS `formSheet` + grabber + detent `0.3`; Android `transparentModal`. Do not put `ModalBottomSheet` / SwiftUI `Host` sheet chrome in the route body. Assert copy, not the presentation style.
- No testID on the sheet. Use the heading text.
- Drive both platforms: Custom → compass toggle → help → dismiss → back to canvas.
