/**
 * Universal `@expo/ui` Picker only supports `appearance: 'menu' | 'wheel'`.
 * Segmented is not in that API — this is the real Material 3
 * `SingleChoiceSegmentedButtonRow`, not a dropdown Picker.
 */
import { SegmentedButton, SingleChoiceSegmentedButtonRow, Text } from '@expo/ui/jetpack-compose';
import { SEASONS } from '@/hooks/useSimulationControls';
import type { SeasonPickerProps } from './types';

export function SeasonPicker({ season, onChange }: SeasonPickerProps) {
  return (
    <SingleChoiceSegmentedButtonRow>
      {SEASONS.map((s) => (
        <SegmentedButton
          key={s.value}
          selected={s.value === season}
          onClick={() => onChange(s.value)}
        >
          <SegmentedButton.Label>
            <Text>{s.label}</Text>
          </SegmentedButton.Label>
        </SegmentedButton>
      ))}
    </SingleChoiceSegmentedButtonRow>
  );
}
