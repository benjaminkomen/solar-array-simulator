import { useState } from 'react';
import { Platform, Pressable, StyleSheet, Text as RNText, useColorScheme, View } from 'react-native';
import { Stack } from 'expo-router';
import {
  Column,
  FieldGroup,
  Host,
  Row,
  Slider,
  Text,
  TextInput,
  useNativeState,
} from '@expo/ui';
import Add from '@expo/material-symbols/add.xml';
import { WizardProgress } from '@/components/WizardProgress';
import { InverterSection } from '@/components/config/InverterSection';
import { RoofTypePicker } from '@/components/config/RoofTypePicker';
import { useConfigForm } from '@/hooks/useConfigForm';
import { useMarkInteractive } from '@/hooks/useMarkInteractive';
import { useColors } from '@/utils/theme';

export default function ConfigScreen() {
  useMarkInteractive();
  const colors = useColors();
  const colorScheme = useColorScheme();
  const [locationSelectCount, setLocationSelectCount] = useState(0);
  const {
    isWizardMode,
    config,
    locationQuery,
    locationResults,
    isSearching,
    updatePanelTiltAngle,
    updateRoofType,
    handleWattageChange,
    handleDelete,
    handleOpenAddSheet,
    handleOpenEditSheet,
    handleContinue,
    handleLocationSearch,
    handleSelectLocation,
    handleDeleteInverter,
  } = useConfigForm();

  const wattageState = useNativeState(config.defaultMaxWattage.toString());
  const locationState = useNativeState(locationQuery || config.locationName || '');

  const handleSelectLocationAndReset = (result: Parameters<typeof handleSelectLocation>[0]) => {
    handleSelectLocation(result);
    setLocationSelectCount((c) => c + 1);
  };

  const locationFooter = config.locationName
    ? `Current: ${config.locationName} (${config.latitude?.toFixed(2)}\u00B0, ${config.longitude?.toFixed(2)}\u00B0)`
    : 'Search for your city to enable realistic solar simulation.';

  return (
    <>
      {isWizardMode && <WizardProgress currentStep={1} />}
      <View style={styles.container}>
        <Host style={styles.host} colorScheme={colorScheme ?? undefined}>
          <FieldGroup>
            <FieldGroup.Section title="Panel Settings">
              <FieldGroup.SectionFooter>
                <Text>
                  Configure the default wattage each micro-inverter and solar panel will produce at
                  maximum production.
                </Text>
              </FieldGroup.SectionFooter>
              <Column spacing={8}>
                <Text textStyle={{ fontWeight: '600' }}>Default Production</Text>
                <Row alignment="center" spacing={8}>
                  <TextInput
                    value={wattageState}
                    onChangeText={handleWattageChange}
                    placeholder="430"
                    keyboardType="number-pad"
                    returnKeyType="done"
                  />
                  <Text testID="text-input-unit">W</Text>
                </Row>
              </Column>
            </FieldGroup.Section>

            <FieldGroup.Section title="Location">
              <FieldGroup.SectionFooter>
                <Text>{locationFooter}</Text>
              </FieldGroup.SectionFooter>
              <Column spacing={8}>
                <Text textStyle={{ fontWeight: '600' }}>City</Text>
                <TextInput
                  key={locationSelectCount}
                  value={locationState}
                  onChangeText={handleLocationSearch}
                  placeholder="e.g. Amsterdam, Netherlands"
                  returnKeyType="search"
                />
              </Column>
              {isSearching ? <Text>Searching...</Text> : null}
              {locationResults.map((result) => {
                const shortName = result.displayName.split(', ').slice(0, 2).join(', ');
                return (
                  <Column
                    key={`${result.latitude}-${result.longitude}`}
                    spacing={2}
                    onPress={() => handleSelectLocationAndReset(result)}
                  >
                    <Text>{shortName}</Text>
                    <Text textStyle={{ fontSize: 12 }}>{result.displayName}</Text>
                  </Column>
                );
              })}
            </FieldGroup.Section>

            <FieldGroup.Section title="Roof">
              <FieldGroup.SectionFooter>
                <Text>Select your roof shape for the 3D simulation view.</Text>
              </FieldGroup.SectionFooter>
              <RoofTypePicker roofType={config.roofType} onChange={updateRoofType} />
              <Column spacing={8}>
                <Text>{`Tilt Angle: ${Math.round(config.panelTiltAngle)}\u00B0`}</Text>
                <Slider
                  value={config.panelTiltAngle}
                  min={0}
                  max={90}
                  step={5}
                  onValueChange={updatePanelTiltAngle}
                />
              </Column>
            </FieldGroup.Section>

            <InverterSection
              inverters={config.inverters}
              onEdit={handleOpenEditSheet}
              onDeleteIndices={handleDelete}
              onDeleteInverter={handleDeleteInverter}
            />
          </FieldGroup>
        </Host>
      </View>
      <Stack.Toolbar placement="bottom">
        {Platform.OS === 'android' ? (
          <Stack.Toolbar.View hidden={!isWizardMode}>
            <Pressable style={styles.toolbarTextButton} onPress={handleContinue}>
              <RNText style={[styles.toolbarTextButtonLabel, { color: colors.primary as string }]}>
                Continue
              </RNText>
            </Pressable>
          </Stack.Toolbar.View>
        ) : (
          isWizardMode && (
            <Stack.Toolbar.Button onPress={handleContinue}>Continue</Stack.Toolbar.Button>
          )
        )}
        <Stack.Toolbar.Button
          icon={Platform.OS === 'ios' ? 'plus' : Add}
          onPress={handleOpenAddSheet}
          accessibilityLabel="Add inverter"
        />
      </Stack.Toolbar>
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
  toolbarTextButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    minHeight: 36,
    justifyContent: 'center',
  },
  toolbarTextButtonLabel: {
    fontSize: 14,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});
