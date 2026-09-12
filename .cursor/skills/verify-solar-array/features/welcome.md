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
- Personal devices: Mac iOS Simulator and/or `emulator-5554`.

- **Launch to Welcome.** Run `node .cursor/skills/verify-solar-array/control.mjs smoke` (wraps `.maestro/smoke-test.yaml`: `shared/launch-fresh.yaml`). "Solar Array Simulator" is visible and `id: get-started-button` is visible.
- **Get Started.** The smoke flow taps `id: get-started-button` and waits for "Panel Settings". That is Config, not Welcome — capture Welcome **before** the tap if the change is the hero copy or the button.
- **Full first-run chrome.** `run-flow wizard-happy-path` asserts the subtitle and `get-started-button` before navigating. `run-flow full-app-tour` starts the same way (long walk; iPhone 17 video is Mac-side).
- **Returning-user skip.** After Production exists, relaunch **without** `clearState`. The Welcome title must not remain; "Total Array Output" is the proof. `launch-fresh` cannot prove this — it always clears. Drive manually or add a one-off Maestro flow that omits `clearState`.
- **Reset entry.** From Production, `run-flow production-menu` ends on Welcome (`get-started-button` after Delete Configuration).
- **Proof.** Screenshot or Maestro assert: title + subtitle + `get-started-button` on a cleared launch. Receipt in `.agents/evidence/verify-solar-array/`.

## Gotchas

- Returning Redirect is **launch-time only**: `useState(getWizardCompleted)` then `<Redirect href="/production" />`. Index must not subscribe to `useConfigStore` for this flag. Finish writing `wizardCompleted` while Custom is showing remounted buried Welcome and dropped the first Android navigation (#69 / #71). If smoke cannot find Get Started, state was not cleared.
- `launch-fresh` branches: iOS deep-links `127.0.0.1:8081` and waits for Continue (do not tap Cancel); Android waits for Dev Client Home (`DEVELOPMENT SERVERS`) before `openLink` to `http://10.0.2.2:8081` (`disableOnboarding=1`), then Recently Opened / typed Connect if still on Home. After attach, SDK 57 may show Continue **or** the full Dev Menu (`Reload` / `Go home`) over Welcome — dismiss the menu (`Close` / `50%,15%`), open the Tools FAB if needed, swipe the sheet up (Tools button is below Fast Refresh), tap **Tools button** once, do not tap Go home, then wait for "Solar Array Simulator". Those taps are Dev Client chrome, not app UI. Stock `launch-fresh.android` has historically lost the Home race; Recently Opened then Continue is the workaround if the race regresses. The FAB sits on Custom's trailing Finish if the hide is skipped.
- Route files: `src/app/index.tsx` is already the shared Welcome for iOS and Android. No collapse hook.
- There is no web-first verification path. EAS Simulator is Generac-only — do not start it from this skill.
