import { useState, useCallback } from 'react';
import { StyleSheet, View, ScrollView, Text, Pressable } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { Image } from "expo-image";
import * as Haptics from 'expo-haptics';
import { useConfigStore } from '@/hooks/useConfigStore';
import { Host, Slider, TextInput } from '@expo/ui/jetpack-compose';
import { useColors } from '@/utils/theme';

function generateSerialNumber(): string {
  return Math.floor(10000000 + Math.random() * 90000000).toString();
}

export default function InverterDetailsScreen() {
  const { mode, inverterId } = useLocalSearchParams<{
    mode: 'add' | 'edit';
    inverterId?: string;
  }>();
  const isAddMode = mode === 'add';
  const router = useRouter();
  const colors = useColors();

  const {
    config,
    addInverterWithDetails,
    updateInverterSerialNumber,
    updateInverterEfficiency,
  } = useConfigStore();

  const existingInverter =
    !isAddMode && inverterId
      ? config.inverters.find((inv) => inv.id === inverterId)
      : null;

  const [serial, setSerial] = useState(() =>
    isAddMode ? generateSerialNumber() : existingInverter?.serialNumber ?? ''
  );
  const [efficiency, setEfficiency] = useState(() =>
    isAddMode ? 95 : existingInverter?.efficiency ?? 95
  );

  const handleSave = useCallback(() => {
    if (isAddMode) {
      addInverterWithDetails(serial, efficiency);
    } else if (inverterId) {
      updateInverterSerialNumber(inverterId, serial);
      updateInverterEfficiency(inverterId, efficiency);
    }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    router.back();
  }, [
    isAddMode,
    serial,
    efficiency,
    inverterId,
    addInverterWithDetails,
    updateInverterSerialNumber,
    updateInverterEfficiency,
    router,
  ]);

  const handleCancel = useCallback(() => {
    router.back();
  }, [router]);

  return (
    <>
      <Stack.Screen
        options={{
          title: isAddMode ? 'New Micro-inverter' : 'Edit Micro-inverter',
          sheetAllowedDetents: [0.6, 1.0],
          headerLeft: () => (
            <Pressable onPress={handleCancel} style={styles.headerButton} accessibilityLabel="Cancel">
              <Image source="sf:xmark" style={styles.headerIcon} tintColor={colors.text.primary} />
            </Pressable>
          ),
          headerRight: () => (
            <Pressable onPress={handleSave} style={styles.headerButton} accessibilityLabel="Save">
              <Image source="sf:checkmark" style={styles.headerIcon} tintColor={colors.primary} />
            </Pressable>
          ),
        }}
      />
      <ScrollView
        style={[styles.container, { backgroundColor: colors.background.secondary }]}
        contentContainerStyle={styles.scrollContent}
        keyboardDismissMode="on-drag"
      >
        {/* Details */}
        <View style={[styles.card, { backgroundColor: colors.background.primary, borderColor: colors.border.light }]}>
          <Text style={[styles.sectionHeader, { color: colors.text.secondary }]}>Details</Text>
          <View style={styles.fieldRow}>
            <Text style={[styles.fieldLabel, { color: colors.text.primary }]}>Serial Number</Text>
          </View>
          <Host style={styles.textInputHost}>
            <TextInput
              defaultValue={serial}
              onChangeText={setSerial}
              keyboardType="numeric"
            />
          </Host>
        </View>

        {/* Efficiency */}
        <View style={[styles.card, { backgroundColor: colors.background.primary, borderColor: colors.border.light }]}>
          <Text style={[styles.sectionHeader, { color: colors.text.secondary }]}>Efficiency</Text>
          <View style={styles.fieldRow}>
            <Text style={[styles.fieldLabel, { color: colors.text.primary }]}>Current</Text>
            <Text style={[styles.fieldValue, { color: colors.text.primary }]}>
              {Math.round(efficiency)}%
            </Text>
          </View>
          <Host style={styles.sliderHost}>
            <Slider
              value={efficiency / 100}
              onValueChange={(val) => setEfficiency(val * 100)}
              min={0}
              max={1}
            />
          </Host>
          <Text style={[styles.footer, { color: colors.text.secondary }]}>
            {isAddMode
              ? 'Set the expected efficiency for this micro-inverter.'
              : 'Adjust for shading, dirt, or other obstructions.'}
          </Text>
        </View>
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
    gap: 16,
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
  fieldRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 4,
  },
  fieldLabel: {
    fontSize: 15,
  },
  fieldValue: {
    fontSize: 17,
    fontWeight: "700",
  },
  textInputHost: {
    height: 48,
  },
  sliderHost: {
    height: 48,
  },
  footer: {
    fontSize: 13,
    marginTop: 8,
    lineHeight: 18,
  },
  headerButton: {
    padding: 8,
  },
  headerIcon: {
    width: 22,
    height: 22,
  },
});
