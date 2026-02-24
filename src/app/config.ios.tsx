import {StyleSheet, View} from 'react-native';
import {
  Button,
  Form,
  Host,
  HStack,
  Image,
  LabeledContent,
  List,
  Picker,
  Section,
  Slider,
  Spacer,
  Text,
  TextField,
  VStack,
} from '@expo/ui/swift-ui';
import {
  buttonStyle,
  font,
  foregroundStyle,
  opacity,
  pickerStyle,
  scrollDismissesKeyboard,
  submitLabel,
  tag,
} from '@expo/ui/swift-ui/modifiers';
import type {RoofType} from '@/utils/configStore';
import {Stack} from "expo-router";
import {WizardProgress} from "@/components/WizardProgress";
import { useConfigForm, ROOF_TYPES } from "@/hooks/useConfigForm";

export default function ConfigScreen() {
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
  } = useConfigForm();

  return (
    <>
      <Stack.Screen.BackButton displayMode="minimal"/>
      {isWizardMode && <WizardProgress currentStep={1}/>}
      <View style={styles.container}>
        <Host style={styles.form}>
            <Form modifiers={[scrollDismissesKeyboard('immediately')]}>
              <Section
                header={<Text>Panel Settings</Text>}
                footer={
                  <Text>
                    Configure the default wattage each micro-inverter and solar panel will produce at
                    maximum production.
                  </Text>
                }
              >
                <LabeledContent label="Default Production">
                  <HStack>
                    <TextField
                      keyboardType="numbers-and-punctuation"
                      defaultValue={config.defaultMaxWattage.toString()}
                      onChangeText={handleWattageChange}
                      placeholder="430"
                      modifiers={[submitLabel('done')]}
                    />
                    <Spacer/>
                    <Text testID='text-input-unit'>W</Text>
                  </HStack>
                </LabeledContent>
              </Section>

              <Section
                header={<Text>Location</Text>}
                footer={
                  <Text>
                    {config.locationName
                      ? `Current: ${config.locationName} (${config.latitude?.toFixed(2)}\u00B0, ${config.longitude?.toFixed(2)}\u00B0)`
                      : 'Search for your city to enable realistic solar simulation.'}
                  </Text>
                }
              >
                <LabeledContent label="City">
                  <TextField
                    defaultValue={locationQuery || config.locationName || ''}
                    onChangeText={handleLocationSearch}
                    placeholder="e.g. Amsterdam, Netherlands"
                    modifiers={[submitLabel('search')]}
                  />
                </LabeledContent>
                {isSearching && (
                  <LabeledContent label="">
                    <Text modifiers={[opacity(0.6)]}>Searching...</Text>
                  </LabeledContent>
                )}
                {locationResults.map((result) => (
                  <Button
                    key={`${result.latitude}-${result.longitude}`}
                    onPress={() => handleSelectLocation(result)}
                    modifiers={[buttonStyle('plain')]}
                  >
                    <VStack alignment="leading" spacing={2}>
                      <Text modifiers={[foregroundStyle({type: 'hierarchical', style: 'primary'})]}>
                        {result.displayName.split(', ').slice(0, 2).join(', ')}
                      </Text>
                      <Text modifiers={[opacity(0.6), font({size: 12})]}>
                        {result.displayName}
                      </Text>
                    </VStack>
                  </Button>
                ))}
              </Section>

              <Section
                header={<Text>Roof</Text>}
                footer={
                  <Text>
                    Select your roof shape for the 3D simulation view.
                  </Text>
                }
              >
                <Picker
                  label="Roof Type"
                  selection={config.roofType}
                  onSelectionChange={(value) => {
                    if (value) updateRoofType(value as RoofType);
                  }}
                  modifiers={[pickerStyle('segmented')]}
                >
                  {ROOF_TYPES.map((rt) => (
                    <Text key={rt.value} modifiers={[tag(rt.value)]}>
                      {rt.label}
                    </Text>
                  ))}
                </Picker>
                <LabeledContent label={`Tilt Angle: ${Math.round(config.panelTiltAngle)}\u00B0`}>
                  <Slider
                    value={config.panelTiltAngle}
                    min={0}
                    max={90}
                    step={5}
                    onValueChange={updatePanelTiltAngle}
                  />
                </LabeledContent>
              </Section>

              <Section
                header={<Text>Micro-inverters ({config.inverters.length})</Text>}
                footer={
                  <Text>
                    Tap to edit efficiency. Swipe left to delete.
                  </Text>
                }
              >
                <List.ForEach onDelete={handleDelete}>
                  {config.inverters.map((inverter) => (
                    <Button key={inverter.id} onPress={() => handleOpenEditSheet(inverter)}
                            modifiers={[buttonStyle('plain')]}>
                      <HStack>
                        <VStack alignment="leading" spacing={2}>
                          <Text modifiers={[foregroundStyle({type: 'hierarchical', style: 'primary'})]}>
                            {inverter.serialNumber}
                          </Text>
                          <Text
                            modifiers={[
                              opacity(0.6),
                              font({size: 14}),
                            ]}
                          >
                            {Math.round(inverter.efficiency)}% efficiency
                          </Text>
                        </VStack>
                        <Spacer/>
                        <Image systemName="chevron.right" size={14} color="#C7C7CC"/>
                      </HStack>
                    </Button>
                  ))}
                </List.ForEach>
              </Section>
            </Form>
          </Host>
        </View>
      <Stack.Toolbar placement="bottom">
        {isWizardMode && (
          <Stack.Toolbar.Button onPress={handleContinue}>
            Continue
          </Stack.Toolbar.Button>
        )}
        <Stack.Toolbar.Button icon="plus" onPress={handleOpenAddSheet} accessibilityLabel="Add inverter" />
      </Stack.Toolbar>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  form: {
    flex: 1,
  },
});
