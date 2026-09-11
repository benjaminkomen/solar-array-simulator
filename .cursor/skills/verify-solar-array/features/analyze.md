# Analyze

After a photo pick (`/analyze?imageUri=…`), the user chooses a vision model, runs Bedrock analysis, or Skips to the canvas.

## Sub-features

- `analyze-select-model` lists Claude Sonnet 4.6 (Default), Claude Opus 4.6, Amazon Nova Pro, plus Nova Premier / Pixtral / Llama rows.
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

- **Model list + Skip.** `run-flow analyze-skip` after a gallery pick: wait for the Analyze header (`wait-analyze-header.yaml`: iOS "Select AI Model", Android "SELECT AI MODEL"), assert "Claude Sonnet 4.6 (Default)", "Claude Opus 4.6", "Amazon Nova Pro", tap "Skip", wait for `id: canvas-container`.
- **Run analysis.** On the model screen tap "Analyze". Processing overlay is intermediate; results show "`N` panel(s) detected" and the model name. Retry returns to select_model. Continue goes to Custom with detections applied.
- **Proof.** For picker/Skip: Maestro asserts above plus a screenshot of the model list. For a real Analyze: results badges, not the `/api/analyze` status code. Missing AWS → record `verified-unreachable` for `analyze-run` and prove Skip instead.

## Gotchas

- Shared `analyze.tsx` is a stub. iOS copy is "Select AI Model"; Android is "SELECT AI MODEL". `wait-analyze-header.yaml` branches. Gallery picker chrome in `analyze-skip.yaml` is still iOS Photos (`Photos` + `17%,25%`).
- Maestro asserts three model rows, not the full `MODELS` list in `useAnalyzeFlow.ts`.
- Analyze without `imageUri` shows an empty preview — not a user path.
- Processing can take tens of seconds. Wait on results copy, not a fixed sleep.
