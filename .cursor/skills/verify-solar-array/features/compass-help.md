# Compass help

Form sheet explaining array orientation. Opened from the Custom canvas compass, not from a tab.

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
- **Dismiss.** Swipe down / system close. Custom canvas remains; compass overlay stays if it was shown.
- **Proof.** Visible "Array Orientation" (and the facing-direction paragraph) after a user tap from Custom. Screenshot the sheet. `src/app/compass-help.tsx` stub text ("Compass help is not yet implemented") is **not** success — that file is the non-iOS/Android fallback. Product copy is `compass-help.ios.tsx` (Android has `compass-help.android.tsx`).

## Gotchas

- First toolbar tap both shows the overlay **and** pushes the sheet (`handleCompassToggle`). A second toolbar tap hides the overlay and does not reopen the sheet.
- Production's compass is read-only and does **not** open this sheet.
- iOS presents as `formSheet` with detent `0.3`. Android is a `transparentModal`. Assert copy, not the presentation style.
- No testID on the sheet. Use the heading text.
