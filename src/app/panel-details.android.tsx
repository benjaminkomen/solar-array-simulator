import { Fragment, useCallback, useState, useEffect } from 'react';
import { StyleSheet, ScrollView } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useConfigStore } from '@/hooks/useConfigStore';
import { usePanelsContext } from '@/contexts/PanelsContext';
import { getPanelStore, subscribe } from '@/utils/panelStore';
import {
  Host, Card, ListItem, Divider, Button,
  Text as UIText, Column,
} from '@expo/ui/jetpack-compose';
import { paddingAll } from '@expo/ui/jetpack-compose/modifiers';
import { useColors } from '@/utils/theme';

export default function PanelDetailsScreen() {
  const { panelId, mode } = useLocalSearchParams<{
    panelId: string;
    mode?: 'edit' | 'view';
  }>();
  const isViewMode = mode === 'view';

  const { config } = useConfigStore();
  const { linkInverter } = usePanelsContext();
  const router = useRouter();
  const colors = useColors();

  const [storeData, setStoreData] = useState(() => getPanelStore());

  useEffect(() => {
    const unsubscribe = subscribe((data) => {
      setStoreData(data);
    });
    return unsubscribe;
  }, []);

  const selectedPanel = storeData.panels.find(p => p.id === panelId);
  const currentInverterId = selectedPanel?.inverterId ?? null;
  const currentInverter = config.inverters.find(
    inv => inv.id === currentInverterId
  );

  const assignedInverterIds = new Set(
    storeData.panels.map(p => p.inverterId).filter(Boolean)
  );
  const availableInverters = config.inverters.filter(
    inv => !assignedInverterIds.has(inv.id)
  );

  const handleLink = useCallback((inverterId: string) => {
    if (panelId) {
      linkInverter(panelId, inverterId);
      Haptics.notificationAsync(
        Haptics.NotificationFeedbackType.Success
      );
      router.back();
    }
  }, [panelId, linkInverter, router]);

  const handleUnlink = useCallback(() => {
    if (panelId) {
      linkInverter(panelId, null);
      Haptics.notificationAsync(
        Haptics.NotificationFeedbackType.Warning
      );
      router.back();
    }
  }, [panelId, linkInverter, router]);

  return (
    <>
      <Stack.Screen
        options={{
          sheetAllowedDetents: isViewMode ? [0.3] : [0.6, 1.0],
        }}
      />
      <ScrollView style={[styles.container, { backgroundColor: colors.background.secondary }]} contentContainerStyle={styles.scrollContent}>
        {currentInverter ? (
          <Host matchContents>
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
          </Host>
        ) : !isViewMode && availableInverters.length > 0 ? (
          <Host matchContents>
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
          </Host>
        ) : !isViewMode ? (
          <Host matchContents>
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
          </Host>
        ) : null}
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
});
