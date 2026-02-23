import { Fragment } from 'react';
import { useRouter } from 'expo-router';
import {
  Host, ModalBottomSheet, Card, ListItem, Divider, Button, Icon,
  Text as UIText, Column,
} from '@expo/ui/jetpack-compose';
import { paddingAll, fillMaxWidth, clickable } from '@expo/ui/jetpack-compose/modifiers';
import { useColors } from '@/utils/theme';
import { usePanelDetails } from '@/hooks/usePanelDetails';

export default function PanelDetailsScreen() {
  const colors = useColors();
  const router = useRouter();
  const {
    isViewMode,
    currentInverter,
    availableInverters,
    handleLink,
    handleUnlink,
  } = usePanelDetails();

  return (
    <Host matchContents>
      <ModalBottomSheet onDismissRequest={() => router.back()}>
        <Column modifiers={[paddingAll(16), fillMaxWidth()]} verticalArrangement={{ spacedBy: 16 }}>

          <UIText style={{ typography: 'titleMedium', fontWeight: '700', textAlign: 'center' }} color={colors.text.primary} modifiers={[fillMaxWidth()]}>
            Panel Details
          </UIText>

          {currentInverter ? (
            <Card variant="elevated" color={colors.background.primary}>
              <Column modifiers={[fillMaxWidth(), paddingAll(8)]}>
                <UIText style={{ typography: 'labelMedium', letterSpacing: 0.5 }} color={colors.text.secondary} modifiers={[paddingAll(8)]}>
                  LINKED INVERTER
                </UIText>
                <ListItem headline="Serial Number">
                  <ListItem.Trailing>
                    <UIText style={{ typography: 'bodyMedium' }} color={colors.text.secondary}>
                      {currentInverter.serialNumber}
                    </UIText>
                  </ListItem.Trailing>
                </ListItem>
                <Divider />
                <ListItem headline="Efficiency">
                  <ListItem.Trailing>
                    <UIText style={{ typography: 'bodyMedium' }} color={colors.text.secondary}>
                      {`${Math.round(currentInverter.efficiency)}%`}
                    </UIText>
                  </ListItem.Trailing>
                </ListItem>
                {!isViewMode && (
                  <>
                    <Divider />
                    <ListItem
                      headline="Unlink Inverter"
                      modifiers={[clickable(handleUnlink)]}
                      colors={{ headlineColor: colors.system.red }}
                    >
                      <ListItem.Leading>
                        <Icon source={require('@/assets/symbols/link_off.xml')} tintColor={colors.system.red} />
                      </ListItem.Leading>
                    </ListItem>
                  </>
                )}
              </Column>
            </Card>
          ) : !isViewMode && availableInverters.length > 0 ? (
            <Card variant="elevated" color={colors.background.primary}>
              <Column modifiers={[fillMaxWidth(), paddingAll(8)]}>
                <UIText style={{ typography: 'labelMedium', letterSpacing: 0.5 }} color={colors.text.secondary}>
                  AVAILABLE INVERTERS
                </UIText>
                {availableInverters.map((inv, idx) => (
                  <Fragment key={inv.id}>
                    {idx > 0 && <Divider />}
                    <ListItem
                      headline={inv.serialNumber}
                      supportingText={`${Math.round(inv.efficiency)}% efficiency`}
                      modifiers={[clickable(() => handleLink(inv.id))]}
                    >
                      <ListItem.Trailing>
                        <Icon
                          source={require('@/assets/symbols/chevron_right.xml')}
                          tintColor={colors.text.tertiary}
                        />
                      </ListItem.Trailing>
                    </ListItem>
                  </Fragment>
                ))}
                <UIText style={{ typography: 'bodySmall' }} color={colors.text.secondary}>
                  Select a micro-inverter to link to this panel.
                </UIText>
              </Column>
            </Card>
          ) : !isViewMode ? (
            <Card variant="elevated" color={colors.background.primary}>
              <Column modifiers={[fillMaxWidth(), paddingAll(16)]} horizontalAlignment="center">
                <UIText style={{ typography: 'headlineSmall', fontWeight: '700' }} color={colors.text.primary}>
                  No Available Inverters
                </UIText>
                <UIText style={{ typography: 'bodyMedium', textAlign: 'center' }} color={colors.text.secondary}>
                  All inverters are assigned. Unlink a panel first or add a new inverter.
                </UIText>
                <Button leadingIcon="filled.Add" variant="borderless" onPress={() => router.push('/config')}>
                  Add Inverter
                </Button>
              </Column>
            </Card>
          ) : null}

        </Column>
      </ModalBottomSheet>
    </Host>
  );
}
