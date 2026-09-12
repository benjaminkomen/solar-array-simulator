/**
 * Web / typecheck fallback. Universal Picker has no `segmented` appearance
 * (`menu` | `wheel` only). Native builds resolve `SeasonPicker.ios.tsx` /
 * `SeasonPicker.android.tsx` for the real platform segmented controls.
 */
import { Picker } from '@expo/ui';
import { SEASONS } from '@/hooks/useSimulationControls';
import type { Season } from '@/utils/solarCalculations';
import type { SeasonPickerProps } from './types';

export function SeasonPicker({ season, onChange }: SeasonPickerProps) {
  return (
    <Picker selectedValue={season} onValueChange={(value) => onChange(value as Season)}>
      {SEASONS.map((s) => (
        <Picker.Item key={s.value} label={s.label} value={s.value} />
      ))}
    </Picker>
  );
}
