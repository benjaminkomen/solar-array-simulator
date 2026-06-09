import {Fragment, useState} from 'react';
import {Pressable, StyleSheet, Text, useColorScheme, View} from 'react-native';
import {
  Box,
  Column,
  ElevatedCard,
  HorizontalDivider,
  Host,
  Icon,
  LazyColumn,
  ListItem,
  SegmentedButton,
  SingleChoiceSegmentedButtonRow,
  Slider,
  OutlinedTextField,
  Text as UIText,
  useNativeState,
} from '@expo/ui/jetpack-compose';
import {
  background,
  clickable,
  fillMaxSize,
  fillMaxWidth,
  paddingAll,
} from '@expo/ui/jetpack-compose/modifiers';
import {SwipeToDismissBox} from 'expo-ui-swipe-to-dismiss-box';
import {Stack} from "expo-router";
import ChevronRight from '@expo/material-symbols/chevron_right.xml';
import Delete from '@expo/material-symbols/delete.xml';
import Add from '@expo/material-symbols/add.xml';
import {WizardProgress} from "@/components/WizardProgress";
import {useColors} from "@/utils/theme";
import {ROOF_TYPES, useConfigForm} from "@/hooks/useConfigForm";
import { useMarkInteractive } from "@/hooks/useMarkInteractive";

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
    handleDeleteInverter,
    handleOpenAddSheet,
    handleOpenEditSheet,
    handleContinue,
    handleLocationSearch,
    handleSelectLocation,
  } = useConfigForm();

  const wattageState = useNativeState(config.defaultMaxWattage.toString());
  const locationState = useNativeState(locationQuery);

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
          <LazyColumn
            verticalArrangement={{spacedBy: 8}}
            contentPadding={{start: 16, top: 16, end: 16, bottom: 80}}
          >
            {/* Panel Settings */}
            <UIText style={{fontSize: 15, fontWeight: '600'}} color={colors.text.secondary as string}>
              Panel Settings
            </UIText>
            <ElevatedCard>
              <Column modifiers={[fillMaxWidth(), paddingAll(16)]}>
                <UIText style={{typography: 'bodyLarge'}} color={colors.text.primary as string}>
                  Default Production
                </UIText>
                <OutlinedTextField
                  value={wattageState}
                  onValueChange={handleWattageChange}
                  keyboardOptions={{keyboardType: 'number'}}
                  modifiers={[fillMaxWidth()]}
                />
              </Column>
            </ElevatedCard>
            <UIText style={{fontSize: 13}} color={colors.text.secondary as string}>
              Configure the default wattage each micro-inverter and solar panel will produce at maximum production.
            </UIText>

            {/* Location */}
            <UIText style={{fontSize: 15, fontWeight: '600'}} color={colors.text.secondary as string}>
              Location
            </UIText>
            <ElevatedCard>
              <Column modifiers={[fillMaxWidth(), paddingAll(16)]}>
                <UIText style={{typography: 'bodyLarge'}} color={colors.text.primary as string}>
                  City
                </UIText>
                <OutlinedTextField
                  key={locationSelectCount}
                  value={locationState}
                  onValueChange={handleLocationSearch}
                  modifiers={[fillMaxWidth()]}
                >
                  <OutlinedTextField.Placeholder>
                    <UIText>e.g. Amsterdam, Netherlands</UIText>
                  </OutlinedTextField.Placeholder>
                </OutlinedTextField>
                {isSearching && (
                  <UIText style={{typography: 'bodySmall'}} color={colors.text.secondary as string}>
                    Searching...
                  </UIText>
                )}
                {locationResults.map((result) => (
                  <ListItem
                    key={`${result.latitude}-${result.longitude}`}
                    modifiers={[clickable(() => handleSelectLocationAndReset(result))]}
                  >
                    <ListItem.HeadlineContent>
                      <UIText>{result.displayName.split(', ').slice(0, 2).join(', ')}</UIText>
                    </ListItem.HeadlineContent>
                    <ListItem.SupportingContent>
                      <UIText>{result.displayName}</UIText>
                    </ListItem.SupportingContent>
                  </ListItem>
                ))}
              </Column>
            </ElevatedCard>
            <UIText style={{fontSize: 13}} color={colors.text.secondary as string}>
              {config.locationName
                ? `Current: ${config.locationName} (${config.latitude?.toFixed(2)}\u00B0, ${config.longitude?.toFixed(2)}\u00B0)`
                : 'Search for your city to enable realistic solar simulation.'}
            </UIText>

            {/* Roof */}
            <UIText style={{fontSize: 15, fontWeight: '600'}} color={colors.text.secondary as string}>
              Roof
            </UIText>
            <ElevatedCard>
              <Column modifiers={[fillMaxWidth(), paddingAll(16)]}>
                <UIText style={{typography: 'bodyLarge'}} color={colors.text.primary as string}>
                  Roof Type
                </UIText>
                <SingleChoiceSegmentedButtonRow>
                  {ROOF_TYPES.map((rt) => (
                    <SegmentedButton
                      key={rt.value}
                      selected={rt.value === config.roofType}
                      onClick={() => updateRoofType(rt.value)}
                    >
                      <SegmentedButton.Label>
                        <UIText>{rt.label}</UIText>
                      </SegmentedButton.Label>
                    </SegmentedButton>
                  ))}
                </SingleChoiceSegmentedButtonRow>
                <UIText style={{typography: 'bodyLarge'}} color={colors.text.primary as string}>
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
            </ElevatedCard>
            <UIText style={{fontSize: 13}} color={colors.text.secondary as string}>
              Select your roof shape for the 3D simulation view.
            </UIText>

            {/* Micro-inverters */}
            <UIText style={{fontSize: 15, fontWeight: '600'}} color={colors.text.secondary as string}>
              {`Micro-inverters (${config.inverters.length})`}
            </UIText>
            <ElevatedCard>
              <Column modifiers={[fillMaxWidth(), paddingAll(8)]}>
                {config.inverters.map((inverter, idx) => (
                  <Fragment key={inverter.id}>
                    {idx > 0 && <HorizontalDivider/>}
                    <SwipeToDismissBox
                      enableDismissFromStartToEnd={false}
                      onEndToStart={() => handleDeleteInverter(inverter)}
                    >
                      <SwipeToDismissBox.BackgroundEndToStart>
                        <Box contentAlignment="centerEnd" modifiers={[fillMaxSize(), background(colors.system.errorContainer as string), paddingAll(16)]}>
                          <Icon source={Delete} size={24} tint={colors.system.onErrorContainer} />
                        </Box>
                      </SwipeToDismissBox.BackgroundEndToStart>
                      <ListItem
                        modifiers={[clickable(() => handleOpenEditSheet(inverter))]}
                      >
                        <ListItem.HeadlineContent>
                          <UIText>{inverter.serialNumber}</UIText>
                        </ListItem.HeadlineContent>
                        <ListItem.SupportingContent>
                          <UIText>{`${Math.round(inverter.efficiency)}% efficiency`}</UIText>
                        </ListItem.SupportingContent>
                        <ListItem.TrailingContent>
                          <Icon source={ChevronRight} tint={colors.text.tertiary} />
                        </ListItem.TrailingContent>
                      </ListItem>
                    </SwipeToDismissBox>
                  </Fragment>
                ))}
              </Column>
            </ElevatedCard>
            <UIText style={{fontSize: 13}} color={colors.text.secondary as string}>
              Tap to edit efficiency. Swipe left to delete.
            </UIText>
          </LazyColumn>
        </Host>
      </View>

      <Stack.Toolbar placement="bottom">
        <Stack.Toolbar.View hidden={!isWizardMode}>
          <Pressable style={styles.toolbarTextButton} onPress={handleContinue}>
            <Text style={[styles.toolbarTextButtonLabel, {color: colors.primary as string}]}>Continue</Text>
          </Pressable>
        </Stack.Toolbar.View>
        <Stack.Toolbar.Button icon={Add} onPress={handleOpenAddSheet} accessibilityLabel="Add inverter" />
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
