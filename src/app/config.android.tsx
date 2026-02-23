import {Fragment} from 'react';
import {ScrollView, StyleSheet, Text, useWindowDimensions, View} from 'react-native';
import {
  Button,
  Card,
  Column,
  Divider,
  HorizontalFloatingToolbar,
  Host,
  Icon,
  ListItem,
  Picker,
  Row,
  Slider,
  Text as UIText, TextButton,
  TextInput,
} from '@expo/ui/jetpack-compose';
import {fillMaxWidth, paddingAll, width as widthModifier} from '@expo/ui/jetpack-compose/modifiers';
import {Stack} from "expo-router";
import {WizardProgress} from "@/components/WizardProgress";
import {useColors} from "@/utils/theme";
import {ROOF_TYPES, useConfigForm} from "@/hooks/useConfigForm";

export default function ConfigScreen() {
  const colors = useColors();
  const {width: screenWidth} = useWindowDimensions();
  const cardWidth = screenWidth - 32; // 16dp padding on each side
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
          headerTitleAlign: 'center',
        }}
      />
      {isWizardMode && <WizardProgress currentStep={1}/>}
      <View style={styles.outerContainer}>
        <ScrollView
          style={[styles.scrollView, {backgroundColor: colors.background.secondary}]}
          contentContainerStyle={[styles.scrollContent, isWizardMode && styles.scrollContentWithToolbar]}
          keyboardDismissMode="on-drag"
        >
          <Text style={[styles.sectionHeader, {color: colors.text.secondary}]}>Panel Settings</Text>
          <Host matchContents>
            <Card variant="elevated" color={colors.background.primary} modifiers={[widthModifier(cardWidth)]}>
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
          </Host>
          <Text style={[styles.sectionFooter, {color: colors.text.secondary}]}>
            Configure the default wattage each micro-inverter and solar panel will produce at maximum production.
          </Text>

          <Text style={[styles.sectionHeader, {color: colors.text.secondary}]}>Location</Text>
          <Host matchContents>
            <Card variant="elevated" color={colors.background.primary} modifiers={[widthModifier(cardWidth)]}>
              <Column modifiers={[fillMaxWidth(), paddingAll(16)]}>
                <UIText style={{typography: 'bodyLarge'}} color={colors.text.primary}>
                  City
                </UIText>
                {/* @ts-ignore - placeholder not in TextInput types but passed to native component */}
                <TextInput
                  defaultValue={locationQuery || config.locationName || ''}
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
                    onPress={() => handleSelectLocation(result)}
                  />
                ))}
              </Column>
            </Card>
          </Host>
          <Text style={[styles.sectionFooter, {color: colors.text.secondary}]}>
            {config.locationName
              ? `Current: ${config.locationName} (${config.latitude?.toFixed(2)}\u00B0, ${config.longitude?.toFixed(2)}\u00B0)`
              : 'Search for your city to enable realistic solar simulation.'}
          </Text>

          <Text style={[styles.sectionHeader, {color: colors.text.secondary}]}>Roof</Text>
          <Host matchContents>
            <Card variant="elevated" color={colors.background.primary} modifiers={[widthModifier(cardWidth)]}>
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
          </Host>
          <Text style={[styles.sectionFooter, {color: colors.text.secondary}]}>
            Select your roof shape for the 3D simulation view.
          </Text>

          <Text style={[styles.sectionHeader, {color: colors.text.secondary}]}>
            {`Micro-inverters (${config.inverters.length})`}
          </Text>
          <Host matchContents>
            <Card variant="elevated" color={colors.background.primary} modifiers={[widthModifier(cardWidth)]}>
              <Column modifiers={[fillMaxWidth()]}>
                {config.inverters.map((inverter, idx) => (
                  <Fragment key={inverter.id}>
                    {idx > 0 && <Divider/>}
                    <ListItem
                      headline={inverter.serialNumber}
                      supportingText={`${Math.round(inverter.efficiency)}% efficiency`}
                      onPress={() => handleOpenEditSheet(inverter)}
                    >
                      <ListItem.Trailing>
                        <Row>
                          <Icon
                            source={require('@/assets/symbols/chevron_right.xml')}
                            tintColor={colors.text.tertiary}
                          />
                          <Button
                            leadingIcon="filled.Delete"
                            variant="borderless"
                            onPress={() => handleDeleteInverter(inverter)}
                          />
                        </Row>
                      </ListItem.Trailing>
                    </ListItem>
                  </Fragment>
                ))}
              </Column>
            </Card>
          </Host>
          <Text style={[styles.sectionFooter, {color: colors.text.secondary}]}>
            Tap to edit efficiency.
          </Text>
        </ScrollView>

        {isWizardMode && (
          <View style={styles.floatingToolbarContainer} pointerEvents="box-none">
            <Host matchContents>
              <HorizontalFloatingToolbar variant="standard">
                <TextButton onPress={handleContinue}>Continue</TextButton>
                <HorizontalFloatingToolbar.FloatingActionButton onPress={handleOpenAddSheet}>
                  <UIText style={{typography: 'labelLarge', fontWeight: '600'}}>Add</UIText>
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
  sectionHeader: {
    fontSize: 15,
    fontWeight: '600',
  },
  sectionFooter: {
    fontSize: 13,
    lineHeight: 18,
    marginTop: -8,
  },
  floatingToolbarContainer: {
    position: "absolute",
    bottom: 24,
    left: 0,
    right: 0,
    alignItems: "center",
    zIndex: 20,
  },
});
