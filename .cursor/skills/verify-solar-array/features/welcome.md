# Welcome

First-run landing: title, three-step promise, and Get Started. Returning users who already finished the wizard never see this screen — they are redirected to Production.

## Sub-features

- `welcome-first-run` shows "Solar Array Simulator", "Configure your solar panel array in 3 easy steps", and Get Started.
- `welcome-get-started` pushes `/config?wizard=true`.
- `welcome-returning` redirects to `/production` when `wizardCompleted` is set.

## How to get to it (user POV)

- Cold-launch the app with no completed wizard (fresh install or after Delete Configuration).
- Finish the wizard, then Delete Configuration from Production → the Production menu (iOS "More options", Android "Configuration options"); land back here.

## Driving it with the harness

Preconditions:

- Development client + Metro, or a later wired backend.
- Cleared app state (otherwise you will land on Production).
- `doctor` has run on `--backend=maestro`.

- **Launch to Welcome.** Run `node .cursor/skills/verify-solar-array/control.mjs smoke` (wraps `.maestro/smoke-test.yaml`: `shared/launch-fresh.yaml`). "Solar Array Simulator" is visible and `id: get-started-button` is visible.
- **Get Started.** The smoke flow taps `id: get-started-button` and waits for "Panel Settings". That is Config, not Welcome — capture Welcome **before** the tap if the change is the hero copy or the button.
- **Full first-run chrome.** `run-flow wizard-happy-path` asserts the subtitle and `get-started-button` before navigating.
- **Returning-user skip.** After Production exists, relaunch **without** `clearState`. The Welcome title must not remain; "Total Array Output" is the proof. `launch-fresh` cannot prove this — it always clears. Drive manually or add a one-off Maestro flow that omits `clearState`.
- **Reset entry.** From Production, `run-flow production-menu` ends on Welcome (`get-started-button` after Delete Configuration).
- **Proof.** Screenshot or Maestro assert: title + subtitle + `get-started-button` on a cleared launch. Receipt in `.agents/evidence/verify-solar-array/`.

## Gotchas

- `getWizardCompleted()` true → `<Redirect href="/production" />`. If smoke cannot find Get Started, state was not cleared.
- `launch-fresh` branches: iOS deep-links `127.0.0.1:8081` and waits for Continue (do not tap Cancel); Android waits for Dev Client Home (`DEVELOPMENT SERVERS`) before `openLink` to `10.0.2.2:8081` (`disableOnboarding=1`), then Recently Opened / typed Connect if still on Home. After attach, Android may show Continue **or** the full Dev Menu (`Reload` / `Go home`) over Welcome — dismiss the menu (`Close` / `50%,15%`), do not tap Go home, then wait for "Solar Array Simulator". Those taps are Dev Client chrome, not app UI.
- There is no web-first verification path. `src/app/index.tsx` is the shared Welcome for iOS and Android.
