# Analyze

After a photo pick (`/analyze?imageUri=…`), the user chooses a vision model, runs Bedrock analysis, or Skips to the canvas.

One route: `src/app/analyze.tsx`. Model control is universal `@expo/ui` `Picker` (menu/dropdown). One `Stack.Toolbar` at the bottom (Skip + Analyze, `hidden` by phase).

## Sub-features

- `analyze-select-model` section title **Select AI Model** (same copy on both platforms). Default selected label is Claude Sonnet 4.6 (Default). Other rows (Claude Opus 4.6, Amazon Nova Pro, plus Nova Premier / Pixtral / Llama) appear after opening the picker — they are not an always-visible radio list.
- `analyze-skip` toolbar Skip → `/custom` (keeps `wizard=true` when present).
- `analyze-run` toolbar Analyze → processing overlay → results (count badge, reasoning, Retry / Continue).
- `analyze-results-continue` writes the detection into the canvas and goes to Custom.

## How to get to it (user POV)

- Upload → Take Photo or Choose from Gallery, then grant permission and pick/capture.
- Not reachable via Skip on Upload.

## Driving it with the harness

Preconditions:

- A real image URI from Upload. Do not fabricate `imageUri` as the primary proof.
- Skip does **not** need AWS keys. Analyze-run does (`AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` / `AWS_REGION` on the API route).

- **Model picker + Skip.** `run-flow analyze-skip` after a gallery pick: wait for **Select AI Model** (`wait-analyze-header.yaml`, both platforms), assert "Claude Sonnet 4.6 (Default)", tap that label to open the picker, assert "Claude Opus 4.6" and "Amazon Nova Pro", tap "Claude Opus 4.6" to change selection, tap "Skip", wait for `id: canvas-container`.
- **Run analysis.** On the model screen tap "Analyze". Processing overlay is intermediate; results show "`N` panel(s) detected" and the model name. Retry returns to select_model. Continue goes to Custom with detections applied.
- **Proof.** For picker/Skip: Maestro asserts above plus a screenshot of the open picker. For a real Analyze: results badges, not the `/api/analyze` status code. Missing AWS → record `verified-unreachable` for `analyze-run` and prove Skip instead.

## Gotchas

- Do not re-fork `analyze.ios.tsx` / `analyze.android.tsx`. Universal Picker has no `inline` appearance (iOS used to be an inline SwiftUI list; Android used RadioButtons). Menu/dropdown is the cross-platform control. Android `Picker` does not forward `testID` — tap the selected label text.
- `wait-analyze-header.yaml` no longer branches on "SELECT AI MODEL".
- Gallery picker chrome in `analyze-skip.yaml` is still iOS Photos (`Photos` + `17%,25%`).
- Maestro asserts three models after opening the picker, not the full `MODELS` list in `useAnalyzeFlow.ts`.
- Analyze without `imageUri` shows an empty preview — not a user path.
- Processing can take tens of seconds. Wait on results copy, not a fixed sleep.
