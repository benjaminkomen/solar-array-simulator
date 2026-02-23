import { Fragment } from 'react';
import { useRouter } from 'expo-router';
import {
  Host, ModalBottomSheet, Card, ListItem, Divider, Button,
  Text as UIText, Column,
} from '@expo/ui/jetpack-compose';
import { paddingAll } from '@expo/ui/jetpack-compose/modifiers';
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
        <Column modifiers={[paddingAll(16)]} verticalArrangement={{ spacedBy: 16 }}>

          {currentInverter ? (
            <Card variant="outlined">
              <Column modifiers={[paddingAll(16)]}>
                <UIText style={{ typography: 'labelMedium', letterSpacing: 0.5 }} color={colors.text.secondary}>
                  LINKED INVERTER
                </UIText>
                <ListItem headline="Serial Number" supportingText={currentInverter.serialNumber} />
                <Divider />
                <ListItem headline="Efficiency" supportingText={`${Math.round(currentInverter.efficiency)}%`} />
                {!isViewMode && (
                  <>
                    <Divider />
                    <Button
                      leadingIcon="filled.Delete"
                      variant="borderless"
                      onPress={handleUnlink}
                      elementColors={{ contentColor: colors.system.red }}
                    >
                      Unlink Inverter
                    </Button>
                  </>
                )}
              </Column>
            </Card>
          ) : !isViewMode && availableInverters.length > 0 ? (
            <Card variant="outlined">
              <Column modifiers={[paddingAll(16)]}>
                <UIText style={{ typography: 'labelMedium', letterSpacing: 0.5 }} color={colors.text.secondary}>
                  AVAILABLE INVERTERS
                </UIText>
                {availableInverters.map((inv, idx) => (
                  <Fragment key={inv.id}>
                    {idx > 0 && <Divider />}
                    <ListItem
                      headline={inv.serialNumber}
                      supportingText={`${Math.round(inv.efficiency)}% efficiency`}
                      onPress={() => handleLink(inv.id)}
                    />
                  </Fragment>
                ))}
                <UIText style={{ typography: 'bodySmall' }} color={colors.text.secondary}>
                  Select a micro-inverter to link to this panel.
                </UIText>
              </Column>
            </Card>
          ) : !isViewMode ? (
            <Card variant="outlined">
              <Column modifiers={[paddingAll(16)]} horizontalAlignment="center">
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
