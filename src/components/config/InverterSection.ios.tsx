/**
 * Each inverter is a FieldGroup.Section row so a tap opens edit. Universal
 * List has no swipe-delete; iOS uses SwipeActions (Android: SwipeToDismissBox).
 * List.ForEach as a single Section child packed every row into one Form cell
 * and left the Spacer untappable, so row taps often did nothing.
 */
import { PlatformColor } from 'react-native';
import { FieldGroup } from '@expo/ui';
import {
  Button,
  HStack,
  Image,
  Spacer,
  SwipeActions,
  Text,
  VStack,
} from '@expo/ui/swift-ui';
import {
  buttonStyle,
  contentShape,
  font,
  foregroundStyle,
  frame,
  opacity,
  shapes,
} from '@expo/ui/swift-ui/modifiers';
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
        <Text>Tap to edit efficiency. Swipe left to delete.</Text>
      </FieldGroup.SectionFooter>
      {inverters.map((inverter) => (
        <SwipeActions key={inverter.id}>
          <Button
            testID={inverterRowTestId(inverter.id)}
            onPress={() => onEdit(inverter)}
            modifiers={[buttonStyle('plain')]}
          >
            <HStack
              modifiers={[
                frame({ maxWidth: Infinity, alignment: 'leading' }),
                contentShape(shapes.rectangle()),
              ]}
            >
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
          <SwipeActions.Actions edge="trailing">
            <Button
              role="destructive"
              systemImage="trash"
              label="Delete"
              onPress={() => onDeleteInverter(inverter)}
            />
          </SwipeActions.Actions>
        </SwipeActions>
      ))}
    </FieldGroup.Section>
  );
}
