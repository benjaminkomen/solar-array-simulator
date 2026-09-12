# Simulation

3D WebGPU scene (`/simulation`) of the array, with time-of-day slider and season picker. Opened from Production.

One route: `src/app/simulation.tsx` (#65). Season chips are one `SeasonPicker.tsx` over `@expo/ui/community/segmented-control` (#75; #67 restored chips after the #65 menu veto). Universal `Picker` has no `segmented` appearance. Empty arrays seed one 3D panel (`panelsForSimulationScene`) so the viewport is panel + sun. Do not paper this as still-split.

## Sub-features

- `simulation-open` title "Simulation", "Total Output", season segments Spring / Summer / Fall / Winter.
- `simulation-time` hour slider between sunrise and sunset; large current-time label. Hour commits to wattage after a 150ms debounce on every platform.
- `simulation-scene` lazy `SimulationView` (fallback "Loading 3D scene..."). If WebGPU/`RNWebGPU` is missing, the canvas shows "3D view unavailable" + "Go Back" (`webgpu-unavailable`) instead of a redbox; chrome stays mounted. An empty array still gets one seeded 3D panel.

## How to get to it (user POV)

- Production → Simulate (sun button labeled "Simulate" on iOS and Android).
- Back returns to Production.

## Driving it with the harness

Preconditions:

- Production reached via `shared/wizard-to-production.yaml`.
- Chrome (title / Total Output / seasons) must appear even when WebGPU cannot start. A timeout on "Simulation" after tap is a product or navigation issue, not a missing testID. A redbox (`RNWebGPU`) is a regression.
- GPU paints late. A black first frame with chrome up is settle, not "WebGPU unavailable".

- **Navigate.** `run-flow simulation-nav` (also the last act of `full-app-tour`): tap "Simulate", wait up to 15s for "Simulation", assert "Total Output", "Spring", "Summer", "Fall", "Winter", then take `sim-3d-proof` immediately (short settle only) while that chrome is still visible. Proof is **panel + sun** (seeded if the canvas array is empty). Chrome-only or an empty-array Production deeplink is not enough. The AVD launcher is not proof.
- **Season.** Tap "Winter" (or another segment). "Total Output" remains. Time bounds may change with season/location.
- **Time slider.** Native slider (`simulation-hour-slider`) — Maestro may not key it reliably. If you cannot drag it, prove the chrome and record the slider as `verified-unreachable` unless the change is the slider itself.
- **Proof.** `sim-3d-proof` taken while "Simulation" / "Total Output" are still visible. Required: panel + sun.

## Gotchas

- `simulation-nav.yaml` uses `tap-simulate.yaml` ("Simulate" on both platforms). Android needs the `development` APK + Metro at `10.0.2.2:8081` on `emulator-5554`.
- Do not wait on `webgpu-scene-painted` — that id is not in the tree; a long optional wait can leave the app and screenshot the launcher.
- Location defaults to null lat/long in config; Simulation still opens with hook fallbacks.
- "Loading 3D scene..." is a Suspense fallback. Waiting only for that string is incomplete — wait for "Total Output" / seasons.
- Product UI is one `src/app/simulation.tsx`. Controls live in `SimulationControls` (universal `@expo/ui` `Host` / `Slider`). Season is one `SeasonPicker.tsx` over `@expo/ui/community/segmented-control` in its own Host (not inside FieldGroup); the season row stretches full width so Android chips do not wrap. `SimulationView` stays the WebGPU surface — do not stub it. Empty arrays are seeded in `useSimulationControls` via `panelsForSimulationScene`, not inside `SimulationView`.
- `react-native-webgpu@0.10` (not `react-native-wgpu@0.4.x`). SDK 57 New Architecture is always on — do not add `newArchEnabled`. After a native upgrade, rebuild `development-simulator` (iOS) and `development` (Android).
- "3D view unavailable" is a canvas fallback, not a failed navigation. Maestro should still see "Simulation" / "Total Output" / seasons.
