/**
 * Universal `@expo/ui` List has no swipe-to-delete. This keeps the real
 * `SwipeToDismissBox` gesture instead of dropping delete. The whole list is
 * one FieldGroup.Section child so Android's per-row ListItem wrapper does
 * not swallow the swipe target.
 */
import { Fragment } from 'react';
import { FieldGroup } from '@expo/ui';
import {
  Box,
  Column,
  HorizontalDivider,
  Icon,
  ListItem,
  Text,
} from '@expo/ui/jetpack-compose';
import {
  background,
  clickable,
  fillMaxSize,
  fillMaxWidth,
  padding,
  paddingAll,
  testID as testIDModifier,
} from '@expo/ui/jetpack-compose/modifiers';
import { SwipeToDismissBox } from 'expo-ui-swipe-to-dismiss-box';
import ChevronRight from '@expo/material-symbols/chevron_right.xml';
import Delete from '@expo/material-symbols/delete.xml';
import { inverterRowTestId } from '@/utils/detailsReachability';
import { useColors } from '@/utils/theme';
import type { InverterSectionProps } from './types';

export function InverterSection({
  inverters,
  onEdit,
  onDeleteInverter,
}: InverterSectionProps) {
  const colors = useColors();

  return (
    <FieldGroup.Section title={`Micro-inverters (${inverters.length})`}>
      <FieldGroup.SectionFooter>
        <Text style={{ fontSize: 13 }} color={colors.text.secondary as string}>
          Tap to edit efficiency. Swipe left to delete.
        </Text>
      </FieldGroup.SectionFooter>
      <Column modifiers={[fillMaxWidth(), padding(0, 0, 0, 64)]}>
        {inverters.map((inverter, idx) => (
          <Fragment key={inverter.id}>
            {idx > 0 && <HorizontalDivider />}
            <SwipeToDismissBox
              enableDismissFromStartToEnd={false}
              onEndToStart={() => onDeleteInverter(inverter)}
            >
              <SwipeToDismissBox.BackgroundEndToStart>
                <Box
                  contentAlignment="centerEnd"
                  modifiers={[
                    fillMaxSize(),
                    background(colors.system.errorContainer as string),
                    paddingAll(16),
                  ]}
                >
                  <Icon source={Delete} size={24} tint={colors.system.onErrorContainer} />
                </Box>
              </SwipeToDismissBox.BackgroundEndToStart>
              <ListItem
                modifiers={[
                  clickable(() => onEdit(inverter)),
                  testIDModifier(inverterRowTestId(inverter.id)),
                ]}
              >
                <ListItem.HeadlineContent>
                  <Text>{inverter.serialNumber}</Text>
                </ListItem.HeadlineContent>
                <ListItem.SupportingContent>
                  <Text>{`${Math.round(inverter.efficiency)}% efficiency`}</Text>
                </ListItem.SupportingContent>
                <ListItem.TrailingContent>
                  <Icon source={ChevronRight} tint={colors.text.tertiary} />
                </ListItem.TrailingContent>
              </ListItem>
            </SwipeToDismissBox>
          </Fragment>
        ))}
      </Column>
    </FieldGroup.Section>
  );
}
