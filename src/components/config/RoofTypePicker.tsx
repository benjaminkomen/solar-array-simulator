/**
 * Web / typecheck fallback. Universal Picker has no `segmented` appearance
 * (`menu` | `wheel` only). Native builds resolve `RoofTypePicker.ios.tsx` /
 * `RoofTypePicker.android.tsx` for the real platform segmented controls.
 */
import { Picker } from '@expo/ui';
import { ROOF_TYPES } from '@/hooks/useConfigForm';
import type { RoofType } from '@/utils/configStore';
import type { RoofTypePickerProps } from './types';

export function RoofTypePicker({ roofType, onChange }: RoofTypePickerProps) {
  return (
    <Picker selectedValue={roofType} onValueChange={(value) => onChange(value as RoofType)}>
      {ROOF_TYPES.map((rt) => (
        <Picker.Item key={rt.value} label={rt.label} value={rt.value} />
      ))}
    </Picker>
  );
}
