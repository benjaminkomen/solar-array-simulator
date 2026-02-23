import {useCallback, useState, useEffect} from 'react';
import {StyleSheet, View} from 'react-native';
import {Link, Stack, useLocalSearchParams, useRouter} from 'expo-router';
import * as Haptics from 'expo-haptics';
import {useConfigStore} from '@/hooks/useConfigStore';
import {usePanelsContext} from '@/contexts/PanelsContext';
import {getPanelStore, subscribe} from '@/utils/panelStore';
import {
  Host,
  Column,
  Row,
  Text,
  TextButton,
  ListItem,
  Card,
  Spacer,
  Button,
  LazyColumn,
} from '@expo/ui/jetpack-compose';
import {paddingAll, weight, alpha} from '@expo/ui/jetpack-compose/modifiers';

export default function PanelDetailsScreen() {
  const { panelId, mode } = useLocalSearchParams<{
    panelId: string;
    mode?: 'edit' | 'view';
  }>();
  const isViewMode = mode === 'view';

  const { config } = useConfigStore();
  const { linkInverter } = usePanelsContext();
  const router = useRouter();

  // Read from store instead of SharedValues
  const [storeData, setStoreData] = useState(() => getPanelStore());

  // Subscribe to store updates
  useEffect(() => {
    const unsubscribe = subscribe((data) => {
      setStoreData(data);
    });
    return unsubscribe;
  }, []);

  // Get current panel and its linked inverter
  const selectedPanel = storeData.panels.find(p => p.id === panelId);
  const currentInverterId = selectedPanel?.inverterId ?? null;
  const currentInverter = config.inverters.find(
    inv => inv.id === currentInverterId
  );

  // Get list of available (unassigned) inverters (only needed in edit mode)
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
          title: "Panel Details",
        }}
      />
      <View style={styles.container}>
        <Host style={styles.host}>
          <Column
            verticalArrangement={{spacedBy: 16}}
            modifiers={[paddingAll(16)]}
          >
            {currentInverter ? (
              // Show currently linked inverter
              <Card variant="outlined">
                <Column modifiers={[paddingAll(16)]} verticalArrangement={{spacedBy: 12}}>
                  <Text style={{fontSize: 12, fontWeight: "600", letterSpacing: 0.5}} color="#999999">
                    LINKED INVERTER
                  </Text>
                  <Row verticalAlignment="center">
                    <Text>Serial Number</Text>
                    <Spacer modifiers={[weight(1)]} />
                    <Text>{currentInverter.serialNumber}</Text>
                  </Row>
                  <Row verticalAlignment="center">
                    <Text>Efficiency</Text>
                    <Spacer modifiers={[weight(1)]} />
                    <Text>{Math.round(currentInverter.efficiency)}%</Text>
                  </Row>
                  {!isViewMode && (
                    <TextButton onPress={handleUnlink} color="#FF3B30">
                      Unlink Inverter
                    </TextButton>
                  )}
                </Column>
              </Card>
            ) : !isViewMode && availableInverters.length > 0 ? (
              // Show list of available inverters (edit mode only)
              <Card variant="outlined">
                <Column modifiers={[paddingAll(16)]} verticalArrangement={{spacedBy: 8}}>
                  <Text style={{fontSize: 12, fontWeight: "600", letterSpacing: 0.5}} color="#999999">
                    AVAILABLE INVERTERS
                  </Text>
                  <LazyColumn verticalArrangement={{spacedBy: 4}}>
                    {availableInverters.map((inv) => (
                      <ListItem
                        key={inv.id}
                        headline={inv.serialNumber}
                        supportingText={`${Math.round(inv.efficiency)}% efficiency`}
                        onPress={() => handleLink(inv.id)}
                      />
                    ))}
                  </LazyColumn>
                  <Text color="#999999" style={{fontSize: 13}}>
                    Select a micro-inverter to link to this panel.
                  </Text>
                </Column>
              </Card>
            ) : !isViewMode ? (
              // Empty state - no available inverters (edit mode only)
              <Card variant="outlined">
                <Column
                  horizontalAlignment="center"
                  verticalArrangement={{spacedBy: 16}}
                  modifiers={[paddingAll(24)]}
                >
                  <Text style={{fontSize: 40}}>
                    {"\u26A0\uFE0F"}
                  </Text>
                  <Text style={{fontSize: 20, fontWeight: "bold"}}>
                    No Available Inverters
                  </Text>
                  <Text color="#999999" style={{fontSize: 15, textAlign: "center"}}>
                    All inverters are assigned. Unlink a panel first or add a new inverter.
                  </Text>
                  <Link href="/config" asChild>
                    <Button color="#007AFF">
                      Add Inverter
                    </Button>
                  </Link>
                </Column>
              </Card>
            ) : null}
          </Column>
        </Host>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  host: {
    flex: 1,
  },
});
