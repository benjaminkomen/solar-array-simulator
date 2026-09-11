# Analyze

After a photo pick (`/analyze?imageUri=…`), or the empty-state fixture (`/analyze?wizard=true` with no image), the user chooses a vision model, runs Bedrock analysis, or Skips to the canvas.

One route: `src/app/analyze.tsx` (#61). Model control is universal `@expo/ui` `Picker` (menu/dropdown). One `Stack.Toolbar` at the bottom (Skip + Analyze, `hidden` by phase). Do not paper this as still-split.

## Sub-features

- `analyze-select-model` section title **Select AI Model** (same copy on both platforms). Default selected label is Claude Sonnet 4.6 (Default). Other rows (Claude Opus 4.6, Amazon Nova Pro, plus Nova Premier / Pixtral / Llama) appear after opening the picker — they are not an always-visible radio list.
- `analyze-empty-state` when there is no `imageUri`: **No photo selected** preview, same picker + toolbar. Reached from Upload **Continue without photo** (`id: analyze-empty-state-button`) — does not open the system gallery.
- `analyze-skip` toolbar Skip → `/custom` (keeps `wizard=true` when present).
- `analyze-run` toolbar Analyze → processing overlay → results (count badge, reasoning, Retry / Continue).
- `analyze-results-continue` writes the detection into the canvas and goes to Custom.

## How to get to it (user POV)

- Upload → Take Photo or Choose from Gallery, then grant permission and pick/capture.
- Upload → **Continue without photo** (empty gallery / emulator fixture). Same Analyze chrome; preview is empty.
- Not reachable via Skip on Upload (Skip goes to Custom).

## Driving it with the harness

Preconditions:

- iOS gallery pick needs a real Photos library. Android AVDs (`emulator-5554`) are often empty — do **not** open the system picker as the Android Analyze path.
- Skip does **not** need AWS keys. Analyze-run does (`AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` / `AWS_REGION` on the API route) and needs a real `imageUri`.

- **Model picker + Skip (iOS).** `run-flow analyze-skip`: gallery pick (`Photos` + `17%,25%`), wait for **Select AI Model**, assert "Claude Sonnet 4.6 (Default)", open the picker, change to Opus, tap "Skip", wait for `id: canvas-container`.
- **Model picker + Skip (Android).** Same flow, but tap `id: analyze-empty-state-button` instead of gallery. Assert **No photo selected** plus the picker/toolbar steps. Do not tap `choose-gallery-button` on an empty AVD.
- **Run analysis.** On the model screen with a real image, tap "Analyze". Processing overlay is intermediate; results show "`N` panel(s) detected" and the model name. Retry returns to select_model. Continue goes to Custom with detections applied. Empty-state Analyze-run is `verified-unreachable` (no image).
- **Proof.** For picker/Skip: Maestro asserts above plus a screenshot of the open picker. For a real Analyze: results badges, not the `/api/analyze` status code. Missing AWS → record `verified-unreachable` for `analyze-run` and prove Skip instead.

## Gotchas

- Do not re-fork `analyze.ios.tsx` / `analyze.android.tsx`. Universal Picker has no `inline` appearance. Menu/dropdown is the cross-platform control. Android `Picker` does not forward `testID` — tap the selected label text.
- Skip / Analyze: iOS `Stack.Toolbar.Button`; Android `Stack.Toolbar.View` + RN `Pressable` with visible text and `accessibilityLabel`. `Stack.Toolbar.Button` text children are not in the Android a11y tree and are not Maestro-visible.
- `wait-analyze-header.yaml` waits for **Select AI Model** on both platforms. Do not wait for `SELECT AI MODEL`.
- Empty emulator gallery is not an Android Analyze fail. Use **Continue without photo**. iOS gallery chrome stays `Photos` + `17%,25%`.
- Maestro asserts three models after opening the picker, not the full `MODELS` list in `useAnalyzeFlow.ts`.
- Processing can take tens of seconds. Wait on results copy, not a fixed sleep.
- In-body "N panels detected" chips are **not** `Stack.Toolbar.Badge`. Badge exists only on Custom unlinked count.
