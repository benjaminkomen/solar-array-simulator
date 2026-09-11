/**
 * Universal `@expo/ui` Picker only supports `appearance: 'menu' | 'wheel'`.
 * Segmented is not in that API — this is the real SwiftUI segmented control
 * (`pickerStyle('segmented')`), not a menu Picker dressed up as chips.
 */
import { Picker, Text } from '@expo/ui/swift-ui';
import { pickerStyle, tag } from '@expo/ui/swift-ui/modifiers';
import { ROOF_TYPES } from '@/hooks/useConfigForm';
import type { RoofType } from '@/utils/configStore';
import type { RoofTypePickerProps } from './types';

export function RoofTypePicker({ roofType, onChange }: RoofTypePickerProps) {
  return (
    <Picker
      label="Roof Type"
      selection={roofType}
      onSelectionChange={(value) => {
        if (value) onChange(value as RoofType);
      }}
      modifiers={[pickerStyle('segmented')]}
    >
      {ROOF_TYPES.map((rt) => (
        <Text key={rt.value} modifiers={[tag(rt.value)]}>
          {rt.label}
        </Text>
      ))}
    </Picker>
  );
}
