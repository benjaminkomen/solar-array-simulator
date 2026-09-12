# Upload

Wizard step 2 (`/upload?wizard=true`): take a photo, pick from the gallery, or Skip. A successful pick navigates to Analyze; Skip goes to Custom.

## Sub-features

- `upload-chrome` shows "Take or Select Photo" and the two pickers.
- `upload-camera` requests camera permission and opens the system camera (`id: take-photo-button`).
- `upload-gallery` opens the system photo picker (`id: choose-gallery-button`).
- `upload-continue-without-photo` (`id: analyze-empty-state-button`) → Analyze empty-state (no system picker). Use this on empty AVD galleries.
- `upload-skip` toolbar Skip → `/custom?wizard=true` without an image.

## How to get to it (user POV)

- Config (wizard) → Continue.
- Deep link `/upload?wizard=true` is not a user path — do not use it as primary proof.

## Driving it with the harness

Preconditions:

- Arrived via Config Continue so wizard chrome (step 2, Skip) is present.
- Gallery/camera tests need a real Photos library / camera permission. Cloud VMs usually have neither.

- **Land on Upload.** `run-flow wizard-happy-path` after Continue: "Take or Select Photo", `id: take-photo-button`, `id: choose-gallery-button`.
- **Skip (no photo).** Tap "Skip". Wait for `id: canvas-container`. This is the default happy path and does **not** prove Analyze.
- **Gallery → Analyze (iOS).** `run-flow analyze-skip`: tap `id: choose-gallery-button`, wait for system "Photos", tap `point: 17%,25%` (first grid tile), wait for "Select AI Model". Then that flow taps Analyze Skip — stop earlier if Upload→Analyze is the claim.
- **Empty gallery → Analyze (Android).** `run-flow analyze-skip`: tap `id: analyze-empty-state-button` ("Continue without photo"). Do **not** open the system picker on an empty AVD. Wait for "Select AI Model" and "No photo selected".
- **Camera.** Tap `id: take-photo-button`. System permission modal or camera UI must appear. Coordinate-tapping a captured photo is OS chrome; treat as `verified-unreachable` without a device camera.
- **Proof.** Screenshot or assert the Upload title plus both testIDs before Skip/pick. If you picked a photo, the next screen must be Analyze, not Custom.

## Gotchas

- Shared `src/app/upload.tsx` is the product UI on iOS and Android. Do not add `upload.ios.tsx` / `upload.android.tsx`.
- Header back-button options live in `_layout`. Do not put `Host` (or Reanimated `entering`) on Upload first paint — Config→Upload LogBox.
- Skip: iOS `Stack.Toolbar.Button`; Android `Stack.Toolbar.View` + Pressable (same a11y class as Custom Add / Config Continue). Hidden when not wizard. Non-wizard `/upload` has no visible Skip.
- Wizard-only **Continue without photo** (`id: analyze-empty-state-button`) opens Analyze empty-state. `analyze-skip` iOS still uses Photos (`Photos` + `17%,25%`). Android must tap that fixture — do not open the system picker on an empty AVD.
- Permission modal (`PermissionModal`) can intercept the first camera/gallery tap. Dismiss or Allow before asserting Analyze.
