import { Fragment } from 'react';
import { StyleSheet, View, ScrollView, Text, Pressable } from 'react-native';
import {
  Host, Picker, Slider, TextInput,
  Card, ListItem, Divider, Button,
  Text as UIText, Column,
  HorizontalFloatingToolbar,
} from '@expo/ui/jetpack-compose';
import { paddingAll } from '@expo/ui/jetpack-compose/modifiers';
import type { RoofType } from '@/utils/configStore';
import { Stack } from "expo-router";
import { WizardProgress } from "@/components/WizardProgress";
import { useColors } from "@/utils/theme";
import { useConfigForm, ROOF_TYPES } from "@/hooks/useConfigForm";

export default function ConfigScreen() {
  const colors = useColors();
  const {
    isWizardMode,
    config,
    locationQuery,
    locationResults,
    isSearching,
    updatePanelTiltAngle,
    updateRoofType,
    handleWattageChange,
    handleOpenAddSheet,
    handleOpenEditSheet,
    handleContinue,
    handleLocationSearch,
    handleSelectLocation,
    handleDeleteInverter,
  } = useConfigForm();

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
