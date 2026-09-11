# Simulation

3D WebGPU scene (`/simulation`) of the array, with time-of-day slider and season picker. Opened from Production.

## Sub-features

- `simulation-open` title "Simulation", "Total Output", season segments Spring / Summer / Fall / Winter.
- `simulation-time` hour slider between sunrise and sunset; large current-time label.
- `simulation-scene` lazy `SimulationView` (fallback "Loading 3D scene..."). If WebGPU/`RNWebGPU` is missing, the canvas shows "3D view unavailable" + "Go Back" (`webgpu-unavailable`) instead of a redbox; chrome stays mounted.

## How to get to it (user POV)

- Production → Simulate (iOS sun button labeled "Simulate").
- Back returns to Production.

## Driving it with the harness

Preconditions:

- Production reached via `shared/wizard-to-production.yaml`.
- Chrome (title / Total Output / seasons) must appear even when WebGPU cannot start. A timeout on "Simulation" after tap is a product or navigation issue, not a missing testID. A redbox (`RNWebGPU`) is a regression.

- **Navigate.** `run-flow simulation-nav`: tap "Simulate", wait up to 15s for "Simulation", assert "Total Output", "Spring", "Summer", "Fall", "Winter".
- **Season.** Tap "Winter" (or another segment). "Total Output" remains. Time bounds may change with season/location.
- **Time slider.** Native slider — Maestro may not key it reliably. If you cannot drag it, prove the chrome and record the slider as `verified-unreachable` unless the change is the slider itself (then you need a device you can gesture).
- **Proof.** Screenshot showing the Simulation title, Total Output, and season row. Do not treat a unit test of `getSolarPosition` as this screen.

## Gotchas

- Android Production has no "Simulate" accessibility label. `simulation-nav.yaml` is iOS-first.
- Location defaults to null lat/long in config; Simulation still opens with hook fallbacks. Setting a city on Config is not required for chrome proof, but output numbers will differ.
- "Loading 3D scene..." is a Suspense fallback. Waiting only for that string is incomplete — wait for "Total Output" / seasons.
- Shared `simulation.tsx` exists; product UI is `simulation.ios.tsx` / `simulation.android.tsx`.
- `react-native-wgpu@0.4.x` throws `Property 'RNWebGPU' doesn't exist` if imported before native `install()`. 0.4.x `install()` also fails on Expo 56 bridgeless (`RCTCxxBridge` / `getCatalystInstance()`). This app uses `react-native-webgpu@0.10` (podspec + static `libwebgpu_dawn.a` for ios-arm64 and ios-simulator, Android `.so`) plus a SimulationView probe. SDK 56 New Architecture is always on — do not add `newArchEnabled`. After the native upgrade, Benjamin must rebuild `eas build --profile development-simulator` (iOS) and `eas build --profile development` (Android). Dawn will not appear as `Frameworks/RNWebGPU.framework`.
- "3D view unavailable" is a canvas fallback, not a failed navigation. Maestro should still see "Simulation" / "Total Output" / seasons.
