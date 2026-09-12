/**
 * Universal `@expo/ui` Picker only supports `appearance: 'menu' | 'wheel'`.
 * Segmented is not in that API — this is the real SwiftUI segmented control
 * (`pickerStyle('segmented')`), not a menu Picker dressed up as chips.
 */
import { Picker, Text } from '@expo/ui/swift-ui';
import { pickerStyle, tag } from '@expo/ui/swift-ui/modifiers';
import { SEASONS } from '@/hooks/useSimulationControls';
import type { Season } from '@/utils/solarCalculations';
import type { SeasonPickerProps } from './types';

export function SeasonPicker({ season, onChange }: SeasonPickerProps) {
  return (
    <Picker
      selection={season}
      onSelectionChange={(value) => {
        if (value) onChange(value as Season);
      }}
      modifiers={[pickerStyle('segmented')]}
    >
      {SEASONS.map((s) => (
        <Text key={s.value} modifiers={[tag(s.value)]}>
          {s.label}
        </Text>
      ))}
    </Picker>
  );
}
