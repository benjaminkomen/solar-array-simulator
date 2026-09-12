import { Platform } from "react-native";
import { Column, Text } from "@expo/ui";
import { SegmentedChips } from "@/components/SegmentedChips";
import { ROOF_TYPES } from "@/hooks/useConfigForm";
import type { RoofTypePickerProps } from "./types";

/**
 * One roof-type control. `@expo/ui/community/segmented-control` is the
 * real platform segmented row (SwiftUI segmented / Material
 * `SingleChoiceSegmentedButtonRow`), not universal `Picker` menu/wheel.
 * Analyze model pick stays a menu `Picker` — do not reuse this there.
 */
export function RoofTypePicker({ roofType, onChange }: RoofTypePickerProps) {
  const chips = (
    <SegmentedChips options={ROOF_TYPES} value={roofType} onChange={onChange} />
  );

  if (Platform.OS !== "android") {
    return chips;
  }

  return (
    <Column spacing={8}>
      <Text>Roof Type</Text>
      {chips}
    </Column>
  );
}
