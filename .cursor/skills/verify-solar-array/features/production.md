# Production

Post-wizard home: live-ish total wattage, a read-only canvas, compass, Edit/Delete configuration, and Simulate.

## Sub-features

- `production-output` shows "Total Array Output" and a formatted wattage.
- `production-simulate` header sun control → `/simulation`.
- `production-edit` More options → Edit Configuration → Config (wizard).
- `production-delete` More options → Delete Configuration → Welcome.
- `production-panel-view` tap a linked panel → Panel Details `mode=view`.

## How to get to it (user POV)

- Custom (wizard) → Finish.
- Cold launch after the wizard has been completed (Welcome redirects here).
- Returning from Simulation via back.

## Driving it with the harness

Preconditions:

- At least one panel (Finish is disabled otherwise). Shared flow: `wizard-to-production.yaml`.

- **Arrive via wizard.** `run-flow wizard-happy-path` ends on "Total Array Output".
- **Simulate.** `run-flow simulation-nav` taps "Simulate" (`tap-simulate.yaml`), waits for "Simulation".
- **Edit / delete.** `run-flow production-menu`: tap the Production menu (`tap-more-options.yaml`: iOS "More options", Android "Configuration options"), "Edit Configuration" → "Panel Settings" / "Default Production"; resume to Production via `wizard-resume-to-production.yaml`; then "Delete Configuration" → "Solar Array Simulator" + `get-started-button`.
- **Returning launch.** After Finish, kill and relaunch **without** `clearState`. Production must show, not Welcome.
- **Proof.** "Total Array Output" visible after Finish, plus the menu or Simulate path you changed. Wattage text is selectable; asserting the label is enough unless the change is the formatter.

## Gotchas

- Simulate = iOS `accessibilityLabel="Simulate"` / Android Icon `contentDescription="Simulate"`.
- Menu = iOS `accessibilityLabel="More options"` / Android `accessibilityLabel="Configuration options"` (Dev Client AppBar overflow is also "More options" — do not reuse that string). Same action titles: "Edit Configuration", "Delete Configuration".
- Delete calls `resetAllData` + `clearPanels` + `replace("/")`. Subsequent launches show Welcome.
- Edit Configuration pushes `/config?wizard=true`, so Continue/Skip/Finish are back. `wizard-resume-to-production.yaml` assumes you are already on Config and does **not** re-add a panel (Finish is already available).
- Tapping an **unlinked** panel does nothing. View sheet only opens when `inverterId` is set.
