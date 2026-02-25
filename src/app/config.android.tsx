import {Fragment, useState} from 'react';
import {StyleSheet, useColorScheme, View} from 'react-native';
import {
  Box,
  Card,
  Column,
  Divider,
  HorizontalFloatingToolbar,
  Host,
  Icon,
  LazyColumn,
  ListItem,
  Picker,
  Slider,
  Text as UIText, TextButton,
  TextInput,
} from '@expo/ui/jetpack-compose';
import {
  align,
  clickable, fillMaxSize,
  fillMaxWidth,
  offset,
  paddingAll,
} from '@expo/ui/jetpack-compose/modifiers';
import {Stack} from "expo-router";
import {WizardProgress} from "@/components/WizardProgress";
import {useColors} from "@/utils/theme";
import {ROOF_TYPES, useConfigForm} from "@/hooks/useConfigForm";

export default function ConfigScreen() {
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
    handleOpenAddSheet,
    handleOpenEditSheet,
    handleContinue,
    handleLocationSearch,
    handleSelectLocation,
  } = useConfigForm();

  const handleSelectLocationAndReset = (result: Parameters<typeof handleSelectLocation>[0]) => {
    handleSelectLocation(result);
    setLocationSelectCount(c => c + 1);
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: "Configuration",
          headerTitleAlign: 'center',
        }}
      />
      {isWizardMode && <WizardProgress currentStep={1}/>}
      <View style={styles.container}>
        <Host style={styles.host} colorScheme={colorScheme ?? undefined}>
          <Box modifiers={[fillMaxSize()]} floatingToolbarExitAlwaysScrollBehavior="bottom">
            <LazyColumn
              verticalArrangement={{spacedBy: 8}}
              contentPadding={{start: 16, top: 16, end: 16, bottom: 80}}
            >
              {/* Panel Settings */}
              <UIText style={{fontSize: 15, fontWeight: '600'}} color={colors.text.secondary}>
                Panel Settings
              </UIText>
              <Card variant="elevated" color={colors.background.primary}>
                <Column modifiers={[fillMaxWidth(), paddingAll(16)]}>
                  <UIText style={{typography: 'bodyLarge'}} color={colors.text.primary}>
                    Default Production
                  </UIText>
                  <TextInput
                    defaultValue={config.defaultMaxWattage.toString()}
                    onChangeText={handleWattageChange}
                    keyboardType="numeric"
                    modifiers={[fillMaxWidth()]}
                  />
                </Column>
              </Card>
              <UIText style={{fontSize: 13}} color={colors.text.secondary}>
                Configure the default wattage each micro-inverter and solar panel will produce at maximum production.
              </UIText>

              {/* Location */}
              <UIText style={{fontSize: 15, fontWeight: '600'}} color={colors.text.secondary}>
                Location
              </UIText>
              <Card variant="elevated" color={colors.background.primary}>
                <Column modifiers={[fillMaxWidth(), paddingAll(16)]}>
                  <UIText style={{typography: 'bodyLarge'}} color={colors.text.primary}>
                    City
                  </UIText>
                  {/* @ts-ignore - placeholder not in TextInput types but passed to native component */}
                  <TextInput
                    key={locationSelectCount}
                    defaultValue={locationQuery}
                    onChangeText={handleLocationSearch}
                    placeholder="e.g. Amsterdam, Netherlands"
                    modifiers={[fillMaxWidth()]}
                  />
                  {isSearching && (
                    <UIText style={{typography: 'bodySmall'}} color={colors.text.secondary}>
                      Searching...
                    </UIText>
                  )}
                  {locationResults.map((result) => (
                    <ListItem
                      key={`${result.latitude}-${result.longitude}`}
                      headline={result.displayName.split(', ').slice(0, 2).join(', ')}
                      supportingText={result.displayName}
                      modifiers={[clickable(() => handleSelectLocationAndReset(result))]}
                    />
                  ))}
                </Column>
              </Card>
              <UIText style={{fontSize: 13}} color={colors.text.secondary}>
                {config.locationName
                  ? `Current: ${config.locationName} (${config.latitude?.toFixed(2)}\u00B0, ${config.longitude?.toFixed(2)}\u00B0)`
                  : 'Search for your city to enable realistic solar simulation.'}
              </UIText>

              {/* Roof */}
              <UIText style={{fontSize: 15, fontWeight: '600'}} color={colors.text.secondary}>
                Roof
              </UIText>
              <Card variant="elevated" color={colors.background.primary}>
                <Column modifiers={[fillMaxWidth(), paddingAll(16)]}>
                  <UIText style={{typography: 'bodyLarge'}} color={colors.text.primary}>
                    Roof Type
                  </UIText>
                  <Picker
                    options={ROOF_TYPES.map(rt => rt.label)}
                    selectedIndex={ROOF_TYPES.findIndex(rt => rt.value === config.roofType)}
                    onOptionSelected={({nativeEvent: {index}}) => {
                      const selected = ROOF_TYPES[index];
                      if (selected) updateRoofType(selected.value);
                    }}
                    variant="segmented"
                  />
                  <UIText style={{typography: 'bodyLarge'}} color={colors.text.primary}>
                    {`Tilt Angle: ${Math.round(config.panelTiltAngle)}\u00B0`}
                  </UIText>
                  <Slider
                    value={config.panelTiltAngle}
                    min={0}
                    max={90}
                    steps={18}
                    onValueChange={updatePanelTiltAngle}
                  />
                </Column>
              </Card>
              <UIText style={{fontSize: 13}} color={colors.text.secondary}>
                Select your roof shape for the 3D simulation view.
              </UIText>

              {/* Micro-inverters */}
              <UIText style={{fontSize: 15, fontWeight: '600'}} color={colors.text.secondary}>
                {`Micro-inverters (${config.inverters.length})`}
              </UIText>
              <Card variant="elevated" color={colors.background.primary}>
                <Column modifiers={[fillMaxWidth(), paddingAll(8)]}>
                  {config.inverters.map((inverter, idx) => (
                    <Fragment key={inverter.id}>
                      {idx > 0 && <Divider/>}
                      <ListItem
                        headline={inverter.serialNumber}
                        supportingText={`${Math.round(inverter.efficiency)}% efficiency`}
                        modifiers={[clickable(() => handleOpenEditSheet(inverter))]}
                      >
                        <ListItem.Trailing>
                          <Icon
                            source={require('@/assets/symbols/chevron_right.xml')}
                            tintColor={colors.text.tertiary}
                          />
                        </ListItem.Trailing>
                      </ListItem>
                    </Fragment>
                  ))}
                </Column>
              </Card>
              <UIText style={{fontSize: 13}} color={colors.text.secondary}>
                Tap to edit efficiency.
              </UIText>
            </LazyColumn>

            <HorizontalFloatingToolbar variant="standard" modifiers={[align('bottomCenter'), offset(0, -16)]}>
              {isWizardMode && (
                <TextButton onPress={handleContinue}>Continue</TextButton>
              )}
              <HorizontalFloatingToolbar.FloatingActionButton onPress={handleOpenAddSheet}>
                <Icon
                  source={require('@/assets/symbols/add.xml')}
                  tintColor={colors.text.inverse}
                />
              </HorizontalFloatingToolbar.FloatingActionButton>
            </HorizontalFloatingToolbar>
          </Box>
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
