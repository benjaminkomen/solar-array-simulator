import {useCallback, useState, useEffect} from 'react';
import {ScrollView, View, Text, Pressable, StyleSheet, useColorScheme} from 'react-native';
import {Link, useLocalSearchParams, useRouter} from 'expo-router';
import * as Haptics from 'expo-haptics';
import {useConfigStore} from '@/hooks/useConfigStore';
import {usePanelsContext} from '@/contexts/PanelsContext';
import {getPanelStore, subscribe} from '@/utils/panelStore';
import {Ionicons} from '@expo/vector-icons';
import {useColors} from '@/utils/theme';

export default function LinkInverterScreen() {
  const { panelId } = useLocalSearchParams<{ panelId: string }>();
  const { config } = useConfigStore();
  const { linkInverter } = usePanelsContext();
  const router = useRouter();
  const colors = useColors();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

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
      style={[styles.container, { backgroundColor: colors.background.secondary }]}
      contentContainerStyle={styles.contentContainer}
    >
      {currentInverter ? (
        // Show currently linked inverter
        <View style={styles.section}>
          <Text style={[styles.sectionHeader, { color: colors.text.secondary }]}>LINKED INVERTER</Text>
          <View style={[styles.card, { backgroundColor: colors.background.primary, boxShadow: isDark ? '0 1px 3px rgba(255, 255, 255, 0.2)' : '0 1px 3px rgba(0, 0, 0, 0.08)' }]}>
            <View style={styles.infoRow}>
              <Text style={[styles.label, { color: colors.text.primary }]}>Serial Number</Text>
              <Text style={[styles.value, { color: colors.text.secondary }]}>{currentInverter.serialNumber}</Text>
            </View>
            <View style={[styles.separator, { backgroundColor: colors.border.medium }]} />
            <View style={styles.infoRow}>
              <Text style={[styles.label, { color: colors.text.primary }]}>Efficiency</Text>
              <Text style={[styles.value, { color: colors.text.secondary }]}>{Math.round(currentInverter.efficiency)}%</Text>
            </View>
            <View style={[styles.separator, { backgroundColor: colors.border.medium }]} />
            <Pressable
              style={({pressed}) => [
                styles.unlinkButton,
                pressed && { backgroundColor: colors.background.tertiary }
              ]}
              onPress={handleUnlink}
            >
              <Ionicons name="unlink" size={20} color={colors.system.red} />
              <Text style={[styles.unlinkButtonText, { color: colors.system.red }]}>Unlink Inverter</Text>
            </Pressable>
          </View>
        </View>
      ) : availableInverters.length > 0 ? (
        // Show list of available inverters
        <View style={styles.section}>
          <Text style={[styles.sectionHeader, { color: colors.text.secondary }]}>AVAILABLE INVERTERS</Text>
          <View style={[styles.card, { backgroundColor: colors.background.primary, boxShadow: isDark ? '0 1px 3px rgba(255, 255, 255, 0.2)' : '0 1px 3px rgba(0, 0, 0, 0.08)' }]}>
            {availableInverters.map((inv, index) => (
              <View key={inv.id}>
                {index > 0 && <View style={[styles.separator, { backgroundColor: colors.border.medium }]} />}
                <Pressable
                  style={({pressed}) => [
                    styles.inverterItem,
                    pressed && { backgroundColor: colors.background.tertiary }
                  ]}
                  onPress={() => handleLink(inv.id)}
                >
                  <View style={styles.inverterInfo}>
                    <Text style={[styles.serialNumber, { color: colors.text.primary }]}>{inv.serialNumber}</Text>
                    <Text style={[styles.efficiency, { color: colors.text.secondary }]}>{Math.round(inv.efficiency)}% efficiency</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color={colors.text.tertiary} />
                </Pressable>
              </View>
            ))}
          </View>
          <Text style={[styles.sectionFooter, { color: colors.text.secondary }]}>Select a micro-inverter to link to this panel.</Text>
        </View>
      ) : (
        // Empty state - no available inverters
        <View style={styles.section}>
          <View style={styles.emptyState}>
            <Ionicons name="warning" size={56} color={colors.text.secondary} />
            <Text style={[styles.emptyTitle, { color: colors.text.primary }]}>No Available Inverters</Text>
            <Text style={[styles.emptyDescription, { color: colors.text.secondary }]}>
              All inverters are assigned. Unlink a panel first or add a new inverter.
            </Text>
          </View>
          <View style={[styles.buttonContainer, { backgroundColor: colors.primary }]}>
            <Link href="/config" asChild>
              <Pressable
                style={({pressed}) => [
                  styles.addButton,
                  { backgroundColor: colors.primary, boxShadow: isDark ? '0 4px 12px rgba(96, 165, 250, 0.6)' : '0 4px 12px rgba(59, 130, 246, 0.6)' },
                  pressed && styles.addButtonPressed
                ]}
              >
                <View style={styles.buttonContent}>
                  <Ionicons name="add-circle" size={22} color={colors.text.inverse} />
                  <Text style={[styles.addButtonText, { color: colors.text.inverse }]}>Add Inverter</Text>
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
    marginBottom: 8,
    marginLeft: 16,
    letterSpacing: -0.08,
  },
  sectionFooter: {
    fontSize: 13,
    marginTop: 8,
    marginLeft: 16,
    lineHeight: 18,
  },
  card: {
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
  },
  value: {
    fontSize: 17,
    fontWeight: '600',
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    marginLeft: 16,
  },
  unlinkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    gap: 8,
  },
  unlinkButtonText: {
    fontSize: 17,
    fontWeight: '600',
  },
  inverterItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  inverterInfo: {
    flex: 1,
    gap: 2,
  },
  serialNumber: {
    fontSize: 17,
    fontWeight: '400',
  },
  efficiency: {
    fontSize: 15,
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
    textAlign: 'center',
  },
  emptyDescription: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 20,
    fontWeight: '500',
  },
  buttonContainer: {
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 16,
    marginHorizontal: 16,
  },
  addButton: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    borderCurve: 'continuous',
    boxShadow: '0 4px 12px rgba(59, 130, 246, 0.6)',
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
  },
});
