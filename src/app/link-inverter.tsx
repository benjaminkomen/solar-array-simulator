import {useCallback, useState, useEffect} from 'react';
import {StyleSheet, View} from 'react-native';
import {Link, useLocalSearchParams, useRouter} from 'expo-router';
import * as Haptics from 'expo-haptics';
import {useConfigStore} from '@/hooks/useConfigStore';
import {usePanelsContext} from '@/contexts/PanelsContext';
import {getPanelStore, subscribe} from '@/utils/panelStore';
import {
  Button,
  Form,
  Host,
  HStack,
  Image,
  LabeledContent,
  List,
  Section,
  Spacer,
  Text,
  VStack,
} from '@expo/ui/swift-ui';
import {
  bold,
  buttonStyle,
  font,
  foregroundStyle,
  opacity,
} from '@expo/ui/swift-ui/modifiers';

export default function LinkInverterScreen() {
  const { panelId } = useLocalSearchParams<{ panelId: string }>();
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

  // Get list of available (unassigned) inverters
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
    <View style={styles.container}>
      <Host style={styles.host}>
        <Form>
          {currentInverter ? (
            // Show currently linked inverter
            <Section
              header={<Text>Linked Inverter</Text>}
            >
              <LabeledContent label="Serial Number">
                <Text>{currentInverter.serialNumber}</Text>
              </LabeledContent>
              <LabeledContent label="Efficiency">
                <Text>{Math.round(currentInverter.efficiency)}%</Text>
              </LabeledContent>
              <Button onPress={handleUnlink} modifiers={[buttonStyle('plain')]}>
                <HStack spacing={8}>
                  <Image systemName="link.badge.plus" size={20} color="#FF3B30" />
                  <Text modifiers={[foregroundStyle({type: 'color', color: '#FF3B30'}), bold()]}>
                    Unlink Inverter
                  </Text>
                </HStack>
              </Button>
            </Section>
          ) : availableInverters.length > 0 ? (
            // Show list of available inverters
            <Section
              header={<Text>Available Inverters</Text>}
              footer={<Text>Select a micro-inverter to link to this panel.</Text>}
            >
              <List.ForEach>
                {availableInverters.map((inv) => (
                  <Button key={inv.id} onPress={() => handleLink(inv.id)} modifiers={[buttonStyle('plain')]}>
                    <HStack>
                      <VStack alignment="leading" spacing={2}>
                        <Text modifiers={[foregroundStyle({type: 'hierarchical', style: 'primary'})]}>
                          {inv.serialNumber}
                        </Text>
                        <Text modifiers={[opacity(0.6), font({size: 14})]}>
                          {Math.round(inv.efficiency)}% efficiency
                        </Text>
                      </VStack>
                      <Spacer />
                      <Image systemName="chevron.right" size={14} color="#C7C7CC" />
                    </HStack>
                  </Button>
                ))}
              </List.ForEach>
            </Section>
          ) : (
            // Empty state - no available inverters
            <Section>
              <VStack spacing={16}>
                <Image systemName="exclamationmark.triangle" size={56} color="#8E8E93" />
                <Text modifiers={[bold(), font({size: 20})]}>No Available Inverters</Text>
                <Text modifiers={[opacity(0.6), font({size: 15})]}>
                  All inverters are assigned. Unlink a panel first or add a new inverter.
                </Text>
                <Link href="/config" asChild>
                  <Button>
                    <HStack>
                      <Image systemName="plus.circle" size={22} color="#007AFF" />
                      <Text modifiers={[foregroundStyle({type: 'color', color: '#007AFF'}), bold()]}>
                        Add Inverter
                      </Text>
                    </HStack>
                  </Button>
                </Link>
              </VStack>
            </Section>
          )}
        </Form>
      </Host>
    </View>
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
