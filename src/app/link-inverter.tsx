import {useCallback, useState, useEffect} from 'react';
import {ScrollView, View, Text, Pressable, StyleSheet} from 'react-native';
import {Link, useLocalSearchParams, useRouter} from 'expo-router';
import * as Haptics from 'expo-haptics';
import {useConfigStore} from '@/hooks/useConfigStore';
import {usePanelsContext} from '@/contexts/PanelsContext';
import {getPanelStore, subscribe} from '@/utils/panelStore';
import {Ionicons} from '@expo/vector-icons';

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
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
    >
      {currentInverter ? (
        // Show currently linked inverter
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>LINKED INVERTER</Text>
          <View style={styles.card}>
            <View style={styles.infoRow}>
              <Text style={styles.label}>Serial Number</Text>
              <Text style={styles.value}>{currentInverter.serialNumber}</Text>
            </View>
            <View style={styles.separator} />
            <View style={styles.infoRow}>
              <Text style={styles.label}>Efficiency</Text>
              <Text style={styles.value}>{Math.round(currentInverter.efficiency)}%</Text>
            </View>
            <View style={styles.separator} />
            <Pressable
              style={({pressed}) => [
                styles.unlinkButton,
                pressed && styles.unlinkButtonPressed
              ]}
              onPress={handleUnlink}
            >
              <Ionicons name="unlink" size={20} color="#FF3B30" />
              <Text style={styles.unlinkButtonText}>Unlink Inverter</Text>
            </Pressable>
          </View>
        </View>
      ) : availableInverters.length > 0 ? (
        // Show list of available inverters
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>AVAILABLE INVERTERS</Text>
          <View style={styles.card}>
            {availableInverters.map((inv, index) => (
              <View key={inv.id}>
                {index > 0 && <View style={styles.separator} />}
                <Pressable
                  style={({pressed}) => [
                    styles.inverterItem,
                    pressed && styles.inverterItemPressed
                  ]}
                  onPress={() => handleLink(inv.id)}
                >
                  <View style={styles.inverterInfo}>
                    <Text style={styles.serialNumber}>{inv.serialNumber}</Text>
                    <Text style={styles.efficiency}>{Math.round(inv.efficiency)}% efficiency</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="#C7C7CC" />
                </Pressable>
              </View>
            ))}
          </View>
          <Text style={styles.sectionFooter}>Select a micro-inverter to link to this panel.</Text>
        </View>
      ) : (
        // Empty state - no available inverters
        <View style={styles.section}>
          <View style={styles.emptyState}>
            <Ionicons name="warning" size={56} color="#8E8E93" />
            <Text style={styles.emptyTitle}>No Available Inverters</Text>
            <Text style={styles.emptyDescription}>
              All inverters are assigned. Unlink a panel first or add a new inverter.
            </Text>
          </View>
          <View style={styles.buttonContainer}>
            <Link href="/config" asChild>
              <Pressable
                style={({pressed}) => [
                  styles.addButton,
                  pressed && styles.addButtonPressed
                ]}
              >
                <View style={styles.buttonContent}>
                  <Ionicons name="add-circle" size={22} color="#fff" />
                  <Text style={styles.addButtonText}>Add Inverter</Text>
                </View>
              </Pressable>
            </Link>
          </View>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.75)',
  },
  contentContainer: {
    padding: 16,
    paddingTop: 24,
  },
  section: {
    marginBottom: 32,
  },
  sectionHeader: {
    fontSize: 13,
    fontWeight: '600',
    color: '#8E8E93',
    marginBottom: 8,
    marginLeft: 16,
    letterSpacing: -0.08,
  },
  sectionFooter: {
    fontSize: 13,
    color: '#8E8E93',
    marginTop: 8,
    marginLeft: 16,
    lineHeight: 18,
  },
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.75)',
    borderRadius: 10,
    borderCurve: 'continuous',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08)',
    overflow: 'hidden',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  label: {
    fontSize: 17,
    color: '#000',
  },
  value: {
    fontSize: 17,
    color: '#8E8E93',
    fontWeight: '600',
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#C6C6C8',
    marginLeft: 16,
  },
  unlinkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    gap: 8,
  },
  unlinkButtonPressed: {
    backgroundColor: '#F2F2F7',
  },
  unlinkButtonText: {
    fontSize: 17,
    color: '#FF3B30',
    fontWeight: '600',
  },
  inverterItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  inverterItemPressed: {
    backgroundColor: '#F2F2F7',
  },
  inverterInfo: {
    flex: 1,
    gap: 2,
  },
  serialNumber: {
    fontSize: 17,
    color: '#000',
    fontWeight: '400',
  },
  efficiency: {
    fontSize: 15,
    color: '#8E8E93',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 32,
    gap: 16,
    borderRadius: 16,
    borderCurve: 'continuous',
    marginHorizontal: 16,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000',
    textAlign: 'center',
  },
  emptyDescription: {
    fontSize: 15,
    color: '#3C3C43',
    textAlign: 'center',
    lineHeight: 20,
    fontWeight: '500',
  },
  buttonContainer: {
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 16,
    marginHorizontal: 16,
    backgroundColor: 'rgb(0, 122, 255)',
  },
  addButton: {
    backgroundColor: 'rgb(0, 122, 255)',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    borderCurve: 'continuous',
    boxShadow: '0 4px 12px rgba(0, 122, 255, 0.6)',
    overflow: 'hidden',
  },
  addButtonPressed: {
    opacity: 0.8,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  addButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
  },
});
