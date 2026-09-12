/**
 * Web / typecheck fallback. Universal List has no swipe-to-delete, so this
 * keeps an explicit delete control. Native builds resolve
 * `InverterSection.ios.tsx` / `InverterSection.android.tsx` for the real
 * platform swipe gestures.
 */
import { FieldGroup, ListItem, Text } from '@expo/ui';
import { inverterRowTestId } from '@/utils/detailsReachability';
import type { InverterSectionProps } from './types';

export function InverterSection({
  inverters,
  onEdit,
  onDeleteInverter,
}: InverterSectionProps) {
  return (
    <FieldGroup.Section title={`Micro-inverters (${inverters.length})`}>
      <FieldGroup.SectionFooter>
        <Text>Tap to edit efficiency. Tap delete to remove.</Text>
      </FieldGroup.SectionFooter>
      {inverters.map((inverter) => (
        <ListItem
          key={inverter.id}
          testID={inverterRowTestId(inverter.id)}
          onPress={() => onEdit(inverter)}
          supportingText={`${Math.round(inverter.efficiency)}% efficiency`}
          trailing={
            <Text
              onPress={() => onDeleteInverter(inverter)}
              testID={`delete-inverter-${inverter.id}`}
            >
              Delete
            </Text>
          }
        >
          {inverter.serialNumber}
        </ListItem>
      ))}
    </FieldGroup.Section>
  );
}
