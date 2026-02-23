import { useCallback, useState, useEffect } from 'react';
import { StyleSheet, View, Text, ScrollView, Pressable } from 'react-native';
import { Link, Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { Image } from "expo-image";
import * as Haptics from 'expo-haptics';
import { useConfigStore } from '@/hooks/useConfigStore';
import { usePanelsContext } from '@/contexts/PanelsContext';
import { getPanelStore, subscribe } from '@/utils/panelStore';
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
          <View style={[styles.card, { backgroundColor: colors.background.primary, borderColor: colors.border.light }]}>
            <Text style={[styles.sectionHeader, { color: colors.text.secondary }]}>Linked Inverter</Text>
            <View style={styles.row}>
              <Text style={[styles.label, { color: colors.text.secondary }]}>Serial Number</Text>
              <Text style={[styles.value, { color: colors.text.primary }]}>{currentInverter.serialNumber}</Text>
            </View>
            <View style={[styles.divider, { backgroundColor: colors.border.light }]} />
            <View style={styles.row}>
              <Text style={[styles.label, { color: colors.text.secondary }]}>Efficiency</Text>
              <Text style={[styles.value, { color: colors.text.primary }]}>{Math.round(currentInverter.efficiency)}%</Text>
            </View>
            {!isViewMode && (
              <>
                <View style={[styles.divider, { backgroundColor: colors.border.light }]} />
                <Pressable onPress={handleUnlink} style={styles.actionRow}>
                  <Image source="sf:link.badge.plus" style={styles.actionIcon} tintColor={colors.system.red} />
                  <Text style={[styles.actionText, { color: colors.system.red }]}>
                    Unlink Inverter
                  </Text>
                </Pressable>
              </>
            )}
          </View>
        ) : !isViewMode && availableInverters.length > 0 ? (
          <View style={[styles.card, { backgroundColor: colors.background.primary, borderColor: colors.border.light }]}>
            <Text style={[styles.sectionHeader, { color: colors.text.secondary }]}>Available Inverters</Text>
            {availableInverters.map((inv, idx) => (
              <View key={inv.id}>
                {idx > 0 && <View style={[styles.divider, { backgroundColor: colors.border.light }]} />}
                <Pressable onPress={() => handleLink(inv.id)} style={styles.inverterRow}>
                  <View style={styles.inverterInfo}>
                    <Text style={[styles.inverterSerial, { color: colors.text.primary }]}>
                      {inv.serialNumber}
                    </Text>
                    <Text style={[styles.inverterEfficiency, { color: colors.text.secondary }]}>
                      {Math.round(inv.efficiency)}% efficiency
                    </Text>
                  </View>
                  <Image source="sf:chevron.right" style={styles.chevron} tintColor={colors.text.tertiary} />
                </Pressable>
              </View>
            ))}
            <Text style={[styles.footer, { color: colors.text.secondary }]}>
              Select a micro-inverter to link to this panel.
            </Text>
          </View>
        ) : !isViewMode ? (
          <View style={[styles.card, styles.emptyCard, { backgroundColor: colors.background.primary, borderColor: colors.border.light }]}>
            <Image source="sf:exclamationmark.triangle" style={styles.emptyIcon} tintColor={colors.text.tertiary} />
            <Text style={[styles.emptyTitle, { color: colors.text.primary }]}>No Available Inverters</Text>
            <Text style={[styles.emptyDescription, { color: colors.text.secondary }]}>
              All inverters are assigned. Unlink a panel first or add a new inverter.
            </Text>
            <Link href="/config" asChild>
              <Pressable style={styles.addRow}>
                <Image source="sf:plus.circle" style={styles.addIcon} tintColor={colors.primary} />
                <Text style={[styles.addText, { color: colors.primary }]}>
                  Add Inverter
                </Text>
              </Pressable>
            </Link>
          </View>
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
  card: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
  },
  sectionHeader: {
    fontSize: 13,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.3,
    marginBottom: 12,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
  },
  label: {
    fontSize: 15,
  },
  value: {
    fontSize: 15,
    fontWeight: "500",
  },
  divider: {
    height: 1,
  },
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 10,
  },
  actionIcon: {
    width: 20,
    height: 20,
  },
  actionText: {
    fontSize: 16,
    fontWeight: "600",
  },
  inverterRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
  },
  inverterInfo: {
    flex: 1,
    gap: 2,
  },
  inverterSerial: {
    fontSize: 16,
  },
  inverterEfficiency: {
    fontSize: 14,
  },
  chevron: {
    width: 14,
    height: 14,
  },
  footer: {
    fontSize: 13,
    marginTop: 8,
  },
  emptyCard: {
    alignItems: "center",
    gap: 12,
    paddingVertical: 32,
  },
  emptyIcon: {
    width: 56,
    height: 56,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "700",
  },
  emptyDescription: {
    fontSize: 15,
    textAlign: "center",
    paddingHorizontal: 16,
  },
  addRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 8,
  },
  addIcon: {
    width: 22,
    height: 22,
  },
  addText: {
    fontSize: 16,
    fontWeight: "600",
  },
});
