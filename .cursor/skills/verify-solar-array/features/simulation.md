# Simulation

3D WebGPU scene (`/simulation`) of the array, with time-of-day slider and season picker. Opened from Production.

## Sub-features

- `simulation-open` title "Simulation", "Total Output", season segments Spring / Summer / Fall / Winter.
- `simulation-time` hour slider between sunrise and sunset; large current-time label.
- `simulation-scene` lazy `SimulationView` (fallback "Loading 3D scene...").

## How to get to it (user POV)

- Production → Simulate (sun button labeled "Simulate" on iOS and Android).
- Back returns to Production.

## Driving it with the harness

Preconditions:

- Production reached via `shared/wizard-to-production.yaml`.
- WebGPU/R3F must start on the device. A timeout on "Simulation" after tap is a product or GPU issue, not a missing testID.

- **Navigate.** `run-flow simulation-nav`: tap "Simulate", wait up to 15s for "Simulation", assert "Total Output", "Spring", "Summer", "Fall", "Winter".
- **Season.** Tap "Winter" (or another segment). "Total Output" remains. Time bounds may change with season/location.
- **Time slider.** Native slider — Maestro may not key it reliably. If you cannot drag it, prove the chrome and record the slider as `verified-unreachable` unless the change is the slider itself (then you need a device you can gesture).
- **Proof.** Screenshot showing the Simulation title, Total Output, and season row. Do not treat a unit test of `getSolarPosition` as this screen.

## Gotchas

- `simulation-nav.yaml` uses `tap-simulate.yaml` ("Simulate" on both platforms). Android needs the `development` APK + Metro at `10.0.2.2:8081`.
- Location defaults to null lat/long in config; Simulation still opens with hook fallbacks. Setting a city on Config is not required for chrome proof, but output numbers will differ.
- "Loading 3D scene..." is a Suspense fallback. Waiting only for that string is incomplete — wait for "Total Output" / seasons.
- Shared `simulation.tsx` exists; product UI is `simulation.ios.tsx` / `simulation.android.tsx`.
