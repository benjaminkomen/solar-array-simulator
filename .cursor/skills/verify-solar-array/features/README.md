# Solar Array Simulator feature map

Behavior-level inventory for the Expo/React Native app (`com.bkomen.solararraysimulator`). Agents use this map to decide what to drive and what evidence counts. Humans use it as the regression checklist.

Surface: iOS and Android development builds. Maestro YAML in `.maestro/` is written against the **iOS** Expo dev client. Platform-stub routes (`src/app/*.tsx` without `.ios` / `.android`) show "not yet implemented" — do not treat those as the product.

## Baseline preconditions

- Installed development client (EAS profile `development` or `development-simulator`). Production/TestFlight binaries will not reconnect to Metro the way `launch-fresh` expects.
- Metro running (`bun start`) unless you are driving a fully bundled preview build.
- `node .cursor/skills/verify-solar-array/control.mjs doctor` has run. No device is OK for doctor; it is **not** OK for a claimed UI proof.
- Start recipes from a cleared app unless the file says otherwise. `.maestro/shared/launch-fresh.yaml` is the reset: `clearState: true`, deep-link local Metro, then Expo Dev Client chrome, then "Solar Array Simulator".
- Prefer testIDs and visible text already used by Maestro. Do not tap Skia/WebGPU canvas coordinates as the primary proof.
- `--backend=maestro` is the only implemented driver. `--backend=eas` and `--backend=mac` are stubs.

## Proof and skip reporting

- Exercise every reachable entry point the feature file lists for the change under test.
- Record the user action and the resulting visible state. Receipts land in `.agents/evidence/verify-solar-array/`.
- Mocks count only behind the same production boundary the missing dependency uses (e.g. no AWS keys → do not claim Analyze-with-Bedrock; Skip is a real user path).
- Unreachable paths: name the path, the unmet precondition (no sim, no Photos library, Android-only chrome), and the closest real path that remains. Do not report a skip as verified through a different entry point.

## Full sweep

Walk this list top to bottom for a broad regression. `wizard-happy-path` covers Welcome → Config → Upload (Skip) → Custom → Production in one device session; still open the per-feature file for entry points that flow does not hit.

## Features

- [Welcome](welcome.md): first-run hero, Get Started, returning-user redirect.
- [Config](config.md): wizard step 1 — panel wattage, location, roof, micro-inverters.
- [Upload](upload.md): wizard step 2 — camera, gallery, Skip.
- [Analyze](analyze.md): model picker, Skip, Analyze (Bedrock), results.
- [Custom](custom.md): canvas editor, add/rotate/delete/link panels, Finish.
- [Production](production.md): total output, edit/delete config, panel view sheet.
- [Simulation](simulation.md): 3D scene, time slider, seasons.
- [Compass help](compass-help.md): array-orientation sheet from the custom canvas.

## Entry contract

Every feature file uses the same four H2s:

1. `Sub-features`
2. `How to get to it (user POV)`
3. `Driving it with the harness`
4. `Gotchas`
