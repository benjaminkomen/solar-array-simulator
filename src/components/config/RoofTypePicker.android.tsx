/**
 * Universal `@expo/ui` Picker only supports `appearance: 'menu' | 'wheel'`.
 * Segmented is not in that API — this is the real Material 3
 * `SingleChoiceSegmentedButtonRow`, not a dropdown Picker.
 */
import { Column, SegmentedButton, SingleChoiceSegmentedButtonRow, Text } from '@expo/ui/jetpack-compose';
import { fillMaxWidth } from '@expo/ui/jetpack-compose/modifiers';
import { ROOF_TYPES } from '@/hooks/useConfigForm';
import { useColors } from '@/utils/theme';
import type { RoofTypePickerProps } from './types';

export function RoofTypePicker({ roofType, onChange }: RoofTypePickerProps) {
  const colors = useColors();

  return (
    <Column modifiers={[fillMaxWidth()]} verticalArrangement={{ spacedBy: 8 }}>
      <Text style={{ typography: 'bodyLarge' }} color={colors.text.primary as string}>
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
