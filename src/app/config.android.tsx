import { StyleSheet, View, ScrollView, Text, Pressable } from 'react-native';
import { useState, useCallback, useRef } from 'react';
import { Host, Picker, Slider, TextInput } from '@expo/ui/jetpack-compose';
import { useConfigStore } from '@/hooks/useConfigStore';
import type { InverterConfig, RoofType } from '@/utils/configStore';
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { Image } from "expo-image";
import { WizardProgress } from "@/components/WizardProgress";
import { searchCity, type GeocodingResult } from "@/utils/geocoding";
import * as Haptics from "expo-haptics";
import { useColors } from "@/utils/theme";

const ROOF_TYPES: { value: RoofType; label: string }[] = [
  { value: 'gable', label: 'Gable' },
  { value: 'hip', label: 'Hip' },
  { value: 'flat', label: 'Flat' },
  { value: 'shed', label: 'Shed' },
];

export default function ConfigScreen() {
  const router = useRouter();
  const { wizard } = useLocalSearchParams<{ wizard?: string }>();
  const isWizardMode = wizard === 'true';
  const colors = useColors();

  const { config, updateDefaultWattage, removeInverter, updateLocation, updatePanelTiltAngle, updateRoofType } = useConfigStore();

  const [locationQuery, setLocationQuery] = useState('');
  const [locationResults, setLocationResults] = useState<GeocodingResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleWattageChange = (text: string) => {
    const wattage = parseInt(text, 10);
    if (!isNaN(wattage)) {
      updateDefaultWattage(wattage);
    }
  };

  const handleOpenAddSheet = () => {
    router.push('/inverter-details?mode=add');
  };

  const handleOpenEditSheet = (inverter: InverterConfig) => {
    router.push(`/inverter-details?mode=edit&inverterId=${inverter.id}`);
  };

  const handleContinue = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push('/upload?wizard=true');
  };

  const handleLocationSearch = useCallback((text: string) => {
    setLocationQuery(text);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);

    if (text.trim().length < 2) {
      setLocationResults([]);
      return;
    }

    setIsSearching(true);
    searchTimeout.current = setTimeout(async () => {
      try {
        const results = await searchCity(text);
        setLocationResults(results);
        setIsSearching(false);
      } catch {
        setLocationResults([]);
        setIsSearching(false);
      }
    }, 1000);
  }, []);

  const handleSelectLocation = useCallback((result: GeocodingResult) => {
    const parts = result.displayName.split(', ');
    const shortName = parts.slice(0, 2).join(', ');
    updateLocation(result.latitude, result.longitude, shortName);
    setLocationQuery('');
    setLocationResults([]);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, [updateLocation]);

  const handleDeleteInverter = useCallback((inverter: InverterConfig) => {
    removeInverter(inverter.id);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
  }, [removeInverter]);

  return (
    <>
      <Stack.Screen
        options={{
          title: "Configuration",
          headerRight: () => (
            <Pressable onPress={handleOpenAddSheet} style={styles.headerButton} accessibilityLabel="Add inverter">
              <Image source="sf:plus" style={styles.headerIcon} tintColor={colors.primary} />
            </Pressable>
          ),
        }}
      />
      {isWizardMode && <WizardProgress currentStep={1} />}
      <ScrollView
        style={[styles.container, { backgroundColor: colors.background.secondary }]}
        contentContainerStyle={styles.scrollContent}
        keyboardDismissMode="on-drag"
      >
        {/* Panel Settings */}
        <View style={[styles.card, { backgroundColor: colors.background.primary, borderColor: colors.border.light }]}>
          <Text style={[styles.sectionHeader, { color: colors.text.secondary }]}>Panel Settings</Text>
          <View style={styles.fieldRow}>
            <Text style={[styles.fieldLabel, { color: colors.text.primary }]}>Default Production</Text>
            <View style={styles.inputWithUnit}>
              <Host style={styles.textInputHost}>
                <TextInput
                  defaultValue={config.defaultMaxWattage.toString()}
                  onChangeText={handleWattageChange}
                  keyboardType="numeric"
                />
              </Host>
              <Text testID="text-input-unit" style={[styles.unit, { color: colors.text.secondary }]}>W</Text>
            </View>
          </View>
          <Text style={[styles.footer, { color: colors.text.secondary }]}>
            Configure the default wattage each micro-inverter and solar panel will produce at
            maximum production.
          </Text>
        </View>

        {/* Location */}
        <View style={[styles.card, { backgroundColor: colors.background.primary, borderColor: colors.border.light }]}>
          <Text style={[styles.sectionHeader, { color: colors.text.secondary }]}>Location</Text>
          <View style={styles.fieldRow}>
            <Text style={[styles.fieldLabel, { color: colors.text.primary }]}>City</Text>
            <Host style={styles.textInputHost}>
              <TextInput
                defaultValue={locationQuery || config.locationName || ''}
                onChangeText={handleLocationSearch}
              />
            </Host>
          </View>
          {isSearching && (
            <Text style={[styles.searchingText, { color: colors.text.secondary }]}>Searching...</Text>
          )}
          {locationResults.map((result) => (
            <Pressable
              key={`${result.latitude}-${result.longitude}`}
              onPress={() => handleSelectLocation(result)}
              style={styles.locationResult}
            >
              <Text style={[styles.locationName, { color: colors.text.primary }]}>
                {result.displayName.split(', ').slice(0, 2).join(', ')}
              </Text>
              <Text style={[styles.locationFull, { color: colors.text.secondary }]}>
                {result.displayName}
              </Text>
            </Pressable>
          ))}
          <Text style={[styles.footer, { color: colors.text.secondary }]}>
            {config.locationName
              ? `Current: ${config.locationName} (${config.latitude?.toFixed(2)}\u00B0, ${config.longitude?.toFixed(2)}\u00B0)`
              : 'Search for your city to enable realistic solar simulation.'}
          </Text>
        </View>

        {/* Roof */}
        <View style={[styles.card, { backgroundColor: colors.background.primary, borderColor: colors.border.light }]}>
          <Text style={[styles.sectionHeader, { color: colors.text.secondary }]}>Roof</Text>
          <Text style={[styles.fieldLabel, { color: colors.text.primary, marginBottom: 8 }]}>Roof Type</Text>
          <Host style={styles.pickerHost}>
            <Picker
              options={ROOF_TYPES.map(rt => rt.label)}
              selectedIndex={ROOF_TYPES.findIndex(rt => rt.value === config.roofType)}
              onOptionSelected={({ nativeEvent: { index } }) => {
                const selected = ROOF_TYPES[index];
                if (selected) updateRoofType(selected.value);
              }}
              variant="segmented"
            />
          </Host>
          <View style={styles.fieldRow}>
            <Text style={[styles.fieldLabel, { color: colors.text.primary }]}>
              Tilt Angle: {Math.round(config.panelTiltAngle)}{'\u00B0'}
            </Text>
          </View>
          <Host style={styles.sliderHost}>
            <Slider
              value={config.panelTiltAngle}
              min={0}
              max={90}
              steps={18}
              onValueChange={updatePanelTiltAngle}
            />
          </Host>
          <Text style={[styles.footer, { color: colors.text.secondary }]}>
            Select your roof shape for the 3D simulation view.
          </Text>
        </View>

        {/* Micro-inverters */}
        <View style={[styles.card, { backgroundColor: colors.background.primary, borderColor: colors.border.light }]}>
          <Text style={[styles.sectionHeader, { color: colors.text.secondary }]}>
            Micro-inverters ({config.inverters.length})
          </Text>
          {config.inverters.map((inverter, idx) => (
            <View key={inverter.id}>
              {idx > 0 && <View style={[styles.divider, { backgroundColor: colors.border.light }]} />}
              <Pressable
                onPress={() => handleOpenEditSheet(inverter)}
                onLongPress={() => handleDeleteInverter(inverter)}
                style={styles.inverterRow}
              >
                <View style={styles.inverterInfo}>
                  <Text style={[styles.inverterSerial, { color: colors.text.primary }]}>
                    {inverter.serialNumber}
                  </Text>
                  <Text style={[styles.inverterEfficiency, { color: colors.text.secondary }]}>
                    {Math.round(inverter.efficiency)}% efficiency
                  </Text>
                </View>
                <Image source="sf:chevron.right" style={styles.chevron} tintColor={colors.text.tertiary} />
              </Pressable>
            </View>
          ))}
          <Text style={[styles.footer, { color: colors.text.secondary }]}>
            Tap to edit efficiency. Long press to delete.
          </Text>
        </View>
      </ScrollView>

      {/* Bottom bar replacing Stack.Toolbar */}
      {isWizardMode && (
        <View style={[styles.bottomBar, { backgroundColor: colors.background.primary, borderTopColor: colors.border.light }]}>
          <Pressable onPress={handleContinue} style={[styles.continueButton, { backgroundColor: colors.primary }]}>
            <Text style={[styles.continueText, { color: colors.text.inverse }]}>Continue</Text>
          </Pressable>
        </View>
      )}
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
    paddingBottom: 32,
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
  inputWithUnit: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  textInputHost: {
    height: 44,
    minWidth: 100,
    flex: 1,
  },
  pickerHost: {
    height: 48,
    marginBottom: 8,
  },
  sliderHost: {
    height: 48,
  },
  unit: {
    fontSize: 15,
    fontWeight: "500",
  },
  footer: {
    fontSize: 13,
    marginTop: 8,
    lineHeight: 18,
  },
  searchingText: {
    fontSize: 14,
    paddingVertical: 8,
  },
  locationResult: {
    paddingVertical: 10,
    gap: 2,
  },
  locationName: {
    fontSize: 16,
  },
  locationFull: {
    fontSize: 12,
  },
  divider: {
    height: 1,
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
  bottomBar: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
  },
  continueButton: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  continueText: {
    fontSize: 17,
    fontWeight: "600",
  },
  headerButton: {
    padding: 8,
  },
  headerIcon: {
    width: 22,
    height: 22,
  },
});
