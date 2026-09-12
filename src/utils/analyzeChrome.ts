import type { Phase } from "@/hooks/useAnalyzeFlow";

/** Shared Analyze model-section title. Same copy on iOS and Android. */
export const ANALYZE_MODEL_SECTION_TITLE = "Select AI Model";

/** Visible when Analyze opens without an imageUri (empty gallery / fixture path). */
export const ANALYZE_EMPTY_PREVIEW_LABEL = "No photo selected";

/** Upload fixture that opens Analyze without the system photo picker. */
export const ANALYZE_CONTINUE_WITHOUT_PHOTO_LABEL = "Continue without photo";
export const ANALYZE_CONTINUE_WITHOUT_PHOTO_TEST_ID = "analyze-empty-state-button";

export function hasAnalyzeImage(imageUri: string | undefined): boolean {
  return Boolean(imageUri && imageUri.length > 0);
}

export function modelPickerLabel(model: { name: string; isDefault: boolean }): string {
  return model.isDefault ? `${model.name} (Default)` : model.name;
}

export function shouldShowAnalyzeSkip(isWizardMode: boolean, phase: Phase): boolean {
  return isWizardMode && phase !== "processing";
}

export function shouldShowAnalyzeAction(phase: Phase): boolean {
  return phase === "select_model";
}
