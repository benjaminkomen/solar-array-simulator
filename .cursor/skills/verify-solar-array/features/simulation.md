# Simulation

3D WebGPU scene (`/simulation`) of the array, with time-of-day slider and season picker. Opened from Production.

## Sub-features

- `simulation-open` title "Simulation", "Total Output", season segments Spring / Summer / Fall / Winter.
- `simulation-time` hour slider between sunrise and sunset; large current-time label. Hour commits to wattage after a 150ms debounce on every platform.
- `simulation-scene` lazy `SimulationView` (fallback "Loading 3D scene..."). If WebGPU/`RNWebGPU` is missing, the canvas shows "3D view unavailable" + "Go Back" (`webgpu-unavailable`) instead of a redbox; chrome stays mounted. An empty array still gets one seeded 3D panel (`panelsForSimulationScene`) so the viewport is panel + sun — chrome-only / empty-array deeplink is not enough.

## How to get to it (user POV)

- Production → Simulate (sun button labeled "Simulate" on iOS and Android).
- Back returns to Production.

## Driving it with the harness

Preconditions:

- Production reached via `shared/wizard-to-production.yaml`.
- Chrome (title / Total Output / seasons) must appear even when WebGPU cannot start. A timeout on "Simulation" after tap is a product or navigation issue, not a missing testID. A redbox (`RNWebGPU`) is a regression.

- **Navigate.** `run-flow simulation-nav`: tap "Simulate", wait up to 15s for "Simulation", assert "Total Output", "Spring", "Summer", "Fall", "Winter", then take `sim-3d-proof` immediately (short settle only) while that chrome is still visible. Do not treat a black canvas as "WebGPU unavailable" when chrome is up.
- **Season.** Tap "Winter" (or another segment). "Total Output" remains. Time bounds may change with season/location.
- **Time slider.** Native slider (`simulation-hour-slider`) — Maestro may not key it reliably. If you cannot drag it, prove the chrome and record the slider as `verified-unreachable` unless the change is the slider itself (then you need a device you can gesture).
- **Proof.** `sim-3d-proof` taken while "Simulation" / "Total Output" are still visible. Required: **panel + sun** in the WebGPU view (seeded if the canvas array is empty). A black first frame is GPU settle — wait, then re-check. Chrome-only or an empty-array Production deeplink is not proof. The AVD launcher is not proof. Do not treat a unit test of `getSolarPosition` as this screen.

## Gotchas

- `simulation-nav.yaml` uses `tap-simulate.yaml` ("Simulate" on both platforms). Android needs the `development` APK + Metro at `10.0.2.2:8081`.
- Skia/WebGPU pixels are not Maestro-accessible. A black canvas with "Simulation" / seasons / "Total Output" visible means Dawn has not painted yet, not that `RNWebGPU` is missing (`WebGPUUnavailable` shows "3D view unavailable"). Take `sim-3d-proof` right after chrome asserts. Do not wait on `webgpu-scene-painted` — that id is not in the tree; a long optional wait can leave the app and screenshot the launcher.
- Location defaults to null lat/long in config; Simulation still opens with hook fallbacks. Setting a city on Config is not required for chrome proof, but output numbers will differ.
- "Loading 3D scene..." is a Suspense fallback. Waiting only for that string is incomplete — wait for "Total Output" / seasons.
- Product UI is one `src/app/simulation.tsx`. Controls live in `SimulationControls` (universal `@expo/ui` `Host` / `Slider`). Season uses a documented platform segmented control (`SeasonPicker.ios.tsx` / `.android.tsx`) because universal `Picker` has no `segmented` appearance — same reason Config uses `RoofTypePicker`. `SimulationView` stays the WebGPU surface — do not stub it or rewrite WebGPU/Skia. Empty arrays are seeded in `useSimulationControls` via `panelsForSimulationScene`, not inside `SimulationView`.
- `react-native-wgpu@0.4.x` throws `Property 'RNWebGPU' doesn't exist` if imported before native `install()`. 0.4.x `install()` also fails on Expo 56+ bridgeless (`RCTCxxBridge` / `getCatalystInstance()`). This app uses `react-native-webgpu@0.10` (podspec + static `libwebgpu_dawn.a` for ios-arm64 and ios-simulator, Android `.so`) plus a SimulationView probe. SDK 57 New Architecture is always on — do not add `newArchEnabled`. After the native upgrade, Benjamin must rebuild `eas build --profile development-simulator` (iOS) and `eas build --profile development` (Android). Dawn will not appear as `Frameworks/RNWebGPU.framework`.
- "3D view unavailable" is a canvas fallback, not a failed navigation. Maestro should still see "Simulation" / "Total Output" / seasons.
