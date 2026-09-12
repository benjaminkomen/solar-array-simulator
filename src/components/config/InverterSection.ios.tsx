/**
 * Universal `@expo/ui` List has no swipe-to-delete. This keeps the real
 * SwiftUI `List.ForEach` `onDelete` gesture instead of dropping delete.
 */
import { PlatformColor } from 'react-native';
import { FieldGroup } from '@expo/ui';
import {
  Button,
  HStack,
  Image,
  List,
  Spacer,
  Text,
  VStack,
} from '@expo/ui/swift-ui';
import { buttonStyle, font, foregroundStyle, opacity } from '@expo/ui/swift-ui/modifiers';
import { inverterRowTestId } from '@/utils/detailsReachability';
import type { InverterSectionProps } from './types';

export function InverterSection({
  inverters,
  onEdit,
  onDeleteIndices,
}: InverterSectionProps) {
  return (
    <FieldGroup.Section title={`Micro-inverters (${inverters.length})`}>
      <FieldGroup.SectionFooter>
        <Text>Tap to edit efficiency. Swipe left to delete.</Text>
      </FieldGroup.SectionFooter>
      <List.ForEach onDelete={onDeleteIndices}>
        {inverters.map((inverter) => (
          <Button
            key={inverter.id}
            testID={inverterRowTestId(inverter.id)}
            onPress={() => onEdit(inverter)}
            modifiers={[buttonStyle('plain')]}
          >
            <HStack>
              <VStack alignment="leading" spacing={2}>
                <Text modifiers={[foregroundStyle({ type: 'hierarchical', style: 'primary' })]}>
                  {inverter.serialNumber}
                </Text>
                <Text modifiers={[opacity(0.6), font({ size: 14 })]}>
                  {`${Math.round(inverter.efficiency)}% efficiency`}
                </Text>
              </VStack>
              <Spacer />
              <Image systemName="chevron.right" size={14} color={PlatformColor('tertiaryLabel')} />
            </HStack>
          </Button>
        ))}
      </List.ForEach>
    </FieldGroup.Section>
  );
}
