import { SegmentedChips } from "@/components/SegmentedChips";
import { SEASONS } from "@/hooks/useSimulationControls";
import type { SeasonPickerProps } from "./types";

/**
 * One season control. `@expo/ui/community/segmented-control` is the real
 * platform segmented row (SwiftUI segmented / Material
 * `SingleChoiceSegmentedButtonRow`), not universal `Picker` menu/wheel.
 * Analyze model pick stays a menu `Picker` — do not reuse this there.
 */
export function SeasonPicker({ season, onChange }: SeasonPickerProps) {
  return <SegmentedChips options={SEASONS} value={season} onChange={onChange} />;
}
