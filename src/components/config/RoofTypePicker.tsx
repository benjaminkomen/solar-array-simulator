import { SegmentedChips } from "@/components/SegmentedChips";
import { ROOF_TYPES } from "@/hooks/useConfigForm";
import type { RoofTypePickerProps } from "./types";

/**
 * iOS / web roof-type control. `@expo/ui/community/segmented-control` is the
 * real SwiftUI segmented row, not universal `Picker` menu/wheel.
 * Android resolves `RoofTypePicker.android.tsx`, which keeps the same
 * community control inside FieldGroup via `RNHostView`.
 * Analyze model pick stays a menu `Picker`.
 */
export function RoofTypePicker({ roofType, onChange }: RoofTypePickerProps) {
  return <SegmentedChips options={ROOF_TYPES} value={roofType} onChange={onChange} />;
}
