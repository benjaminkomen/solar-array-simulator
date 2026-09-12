/**
 * Android Config FieldGroup is a Compose LazyColumn. The community
 * segmented-control drop-in wraps its own RN Host — nesting that Host
 * (or an RN host bridge + percent width) crashes Compose
 * (`FieldCastException` int vs String) and is not the chips path that
 * visually passed before #78.
 *
 * Keep the real Material 3 `SingleChoiceSegmentedButtonRow` with
 * `fillMaxWidth()` (numeric dp modifiers, no percent strings).
 */
import { Column, SegmentedButton, SingleChoiceSegmentedButtonRow, Text } from "@expo/ui/jetpack-compose";
import { fillMaxWidth } from "@expo/ui/jetpack-compose/modifiers";
import { ROOF_TYPES } from "@/hooks/useConfigForm";
import { useColors } from "@/utils/theme";
import type { RoofTypePickerProps } from "./types";

export function RoofTypePicker({ roofType, onChange }: RoofTypePickerProps) {
  const colors = useColors();

  return (
    <Column modifiers={[fillMaxWidth()]} verticalArrangement={{ spacedBy: 8 }}>
      <Text style={{ typography: "bodyLarge" }} color={colors.text.primary as string}>
        Roof Type
      </Text>
      <SingleChoiceSegmentedButtonRow>
        {ROOF_TYPES.map((rt) => (
          <SegmentedButton
            key={rt.value}
            selected={rt.value === roofType}
            onClick={() => onChange(rt.value)}
          >
            <SegmentedButton.Label>
              <Text>{rt.label}</Text>
            </SegmentedButton.Label>
          </SegmentedButton>
        ))}
      </SingleChoiceSegmentedButtonRow>
    </Column>
  );
}
