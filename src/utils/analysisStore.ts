/**
 * Simple module-level store for passing analysis results between screens.
 * Avoids putting large JSON in URL search params.
 */

interface PanelResult {
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: 0 | 90;
  label: string;
}

interface AnalysisResult {
  panels: PanelResult[];
  imageWidth: number;
  imageHeight: number;
}

let pendingResult: AnalysisResult | null = null;

export function setAnalysisResult(result: AnalysisResult) {
  pendingResult = result;
}

/**
 * Consume the pending analysis result (returns it once, then clears).
 */
export function consumeAnalysisResult(): AnalysisResult | null {
  const result = pendingResult;
  pendingResult = null;
  return result;
}
