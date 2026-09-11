import type { Phase } from "@/hooks/useAnalyzeFlow";

/** Shared Analyze model-section title. Same copy on iOS and Android. */
export const ANALYZE_MODEL_SECTION_TITLE = "Select AI Model";

export function modelPickerLabel(model: { name: string; isDefault: boolean }): string {
  return model.isDefault ? `${model.name} (Default)` : model.name;
}

export function shouldShowAnalyzeSkip(isWizardMode: boolean, phase: Phase): boolean {
  return isWizardMode && phase !== "processing";
}

export function shouldShowAnalyzeAction(phase: Phase): boolean {
  return phase === "select_model";
}
