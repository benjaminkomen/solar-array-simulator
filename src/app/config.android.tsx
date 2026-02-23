import { Fragment, useState, useCallback, useRef } from 'react';
import { StyleSheet, View, ScrollView, Text, Pressable } from 'react-native';
import {
  Host, Picker, Slider, TextInput,
  Card, ListItem, Divider, Button,
  Text as UIText, Column,
  HorizontalFloatingToolbar,
} from '@expo/ui/jetpack-compose';
import { paddingAll } from '@expo/ui/jetpack-compose/modifiers';
import { useConfigStore } from '@/hooks/useConfigStore';
import type { InverterConfig, RoofType } from '@/utils/configStore';
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
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
              <Text style={[styles.headerButtonText, { color: colors.primary }]}>Add</Text>
            </Pressable>
          ),
        }}
      />
      {isWizardMode && <WizardProgress currentStep={1} />}
      <View style={styles.outerContainer}>
        <ScrollView
          style={[styles.scrollView, { backgroundColor: colors.background.secondary }]}
          contentContainerStyle={[styles.scrollContent, isWizardMode && styles.scrollContentWithToolbar]}
          keyboardDismissMode="on-drag"
        >
          {/* Panel Settings */}
          <Host matchContents>
            <Card variant="outlined">
              <Column modifiers={[paddingAll(16)]}>
                <UIText style={{ typography: 'labelMedium', letterSpacing: 0.5 }} color={colors.text.secondary}>
                  PANEL SETTINGS
                </UIText>
                <UIText style={{ typography: 'bodyLarge' }} color={colors.text.primary}>
                  Default Production
                </UIText>
                <TextInput
                  defaultValue={config.defaultMaxWattage.toString()}
                  onChangeText={handleWattageChange}
                  keyboardType="numeric"
                />
                <UIText style={{ typography: 'bodySmall' }} color={colors.text.secondary}>
                  Configure the default wattage each micro-inverter and solar panel will produce at maximum production.
                </UIText>
              </Column>
            </Card>
          </Host>

          {/* Location */}
          <Host matchContents>
            <Card variant="outlined">
              <Column modifiers={[paddingAll(16)]}>
                <UIText style={{ typography: 'labelMedium', letterSpacing: 0.5 }} color={colors.text.secondary}>
                  LOCATION
                </UIText>
                <UIText style={{ typography: 'bodyLarge' }} color={colors.text.primary}>
                  City
                </UIText>
                <TextInput
                  defaultValue={locationQuery || config.locationName || ''}
                  onChangeText={handleLocationSearch}
                />
                {isSearching && (
                  <UIText style={{ typography: 'bodySmall' }} color={colors.text.secondary}>
                    Searching...
                  </UIText>
                )}
                {locationResults.map((result) => (
                  <ListItem
                    key={`${result.latitude}-${result.longitude}`}
                    headline={result.displayName.split(', ').slice(0, 2).join(', ')}
                    supportingText={result.displayName}
                    onPress={() => handleSelectLocation(result)}
                  />
                ))}
                <UIText style={{ typography: 'bodySmall' }} color={colors.text.secondary}>
                  {config.locationName
                    ? `Current: ${config.locationName} (${config.latitude?.toFixed(2)}\u00B0, ${config.longitude?.toFixed(2)}\u00B0)`
                    : 'Search for your city to enable realistic solar simulation.'}
                </UIText>
              </Column>
            </Card>
          </Host>

          {/* Roof */}
          <Host matchContents>
            <Card variant="outlined">
              <Column modifiers={[paddingAll(16)]}>
                <UIText style={{ typography: 'labelMedium', letterSpacing: 0.5 }} color={colors.text.secondary}>
                  ROOF
                </UIText>
                <UIText style={{ typography: 'bodyLarge' }} color={colors.text.primary}>
                  Roof Type
                </UIText>
                <Picker
                  options={ROOF_TYPES.map(rt => rt.label)}
                  selectedIndex={ROOF_TYPES.findIndex(rt => rt.value === config.roofType)}
                  onOptionSelected={({ nativeEvent: { index } }) => {
                    const selected = ROOF_TYPES[index];
                    if (selected) updateRoofType(selected.value);
                  }}
                  variant="segmented"
                />
                <UIText style={{ typography: 'bodyLarge' }} color={colors.text.primary}>
                  {`Tilt Angle: ${Math.round(config.panelTiltAngle)}\u00B0`}
                </UIText>
                <Slider
                  value={config.panelTiltAngle}
                  min={0}
                  max={90}
                  steps={18}
                  onValueChange={updatePanelTiltAngle}
                />
                <UIText style={{ typography: 'bodySmall' }} color={colors.text.secondary}>
                  Select your roof shape for the 3D simulation view.
                </UIText>
              </Column>
            </Card>
          </Host>

          {/* Micro-inverters */}
          <Host matchContents>
            <Card variant="outlined">
              <Column modifiers={[paddingAll(16)]}>
                <UIText style={{ typography: 'labelMedium', letterSpacing: 0.5 }} color={colors.text.secondary}>
                  {`MICRO-INVERTERS (${config.inverters.length})`}
                </UIText>
                {config.inverters.map((inverter, idx) => (
                  <Fragment key={inverter.id}>
                    {idx > 0 && <Divider />}
                    <ListItem
                      headline={inverter.serialNumber}
                      supportingText={`${Math.round(inverter.efficiency)}% efficiency`}
                      onPress={() => handleOpenEditSheet(inverter)}
                    >
                      <ListItem.Trailing>
                        <Button
                          leadingIcon="filled.Delete"
                          variant="borderless"
                          onPress={() => handleDeleteInverter(inverter)}
                        />
                      </ListItem.Trailing>
                    </ListItem>
                  </Fragment>
                ))}
                <UIText style={{ typography: 'bodySmall' }} color={colors.text.secondary}>
                  Tap to edit efficiency.
                </UIText>
              </Column>
            </Card>
          </Host>
        </ScrollView>

        {/* Floating toolbar */}
        {isWizardMode && (
          <View style={styles.floatingToolbarContainer}>
            <Host matchContents>
              <HorizontalFloatingToolbar variant="vibrant">
                <HorizontalFloatingToolbar.FloatingActionButton onPress={handleContinue}>
                  <UIText style={{ typography: 'labelLarge', fontWeight: '600' }}>Continue</UIText>
                </HorizontalFloatingToolbar.FloatingActionButton>
              </HorizontalFloatingToolbar>
            </Host>
          </View>
        )}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  outerContainer: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    gap: 16,
    paddingBottom: 32,
  },
  scrollContentWithToolbar: {
    paddingBottom: 96,
  },
  floatingToolbarContainer: {
    position: "absolute",
    bottom: 24,
    left: 0,
    right: 0,
    alignItems: "center",
  },
  headerButton: {
    padding: 8,
  },
  headerButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
});
