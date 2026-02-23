import {StyleSheet, View} from 'react-native';
import {useState, useCallback, useRef} from 'react';
import {
  Host,
  Column,
  Row,
  Text,
  TextInput,
  Picker,
  Slider,
  Spacer,
  TextButton,
  Card,
  ListItem,
  LazyColumn,
} from '@expo/ui/jetpack-compose';
import {paddingAll, weight} from '@expo/ui/jetpack-compose/modifiers';
import {useConfigStore} from '@/hooks/useConfigStore';
import type {InverterConfig, RoofType} from '@/utils/configStore';
import {Stack, useLocalSearchParams, useRouter} from "expo-router";
import {WizardProgress} from "@/components/WizardProgress";
import {searchCity, type GeocodingResult} from "@/utils/geocoding";
import * as Haptics from "expo-haptics";

const ROOF_TYPES: { value: RoofType; label: string }[] = [
  {value: 'gable', label: 'Gable'},
  {value: 'hip', label: 'Hip'},
  {value: 'flat', label: 'Flat'},
  {value: 'shed', label: 'Shed'},
];

export default function ConfigScreen() {
  const router = useRouter();
  const {wizard} = useLocalSearchParams<{ wizard?: string }>();
  const isWizardMode = wizard === 'true';

  const {config, updateDefaultWattage, removeInverter, updateLocation, updatePanelTiltAngle, updateRoofType} = useConfigStore();

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
    // Debounce: 1 second (Nominatim rate limit)
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

  const handleDeleteInverter = (inverter: InverterConfig) => {
    removeInverter(inverter.id);
  };

  const roofTypeIndex = ROOF_TYPES.findIndex((rt) => rt.value === config.roofType);

  return (
    <>
      <Stack.Screen.BackButton displayMode="minimal"/>
      {isWizardMode && <WizardProgress currentStep={1}/>}
      <View style={styles.container}>
        <Host style={styles.form}>
          <LazyColumn
            verticalArrangement={{spacedBy: 16}}
            contentPadding={{start: 16, top: 16, end: 16, bottom: 16}}
          >
            {/* Panel Settings Section */}
            <Card variant="outlined">
              <Column modifiers={[paddingAll(16)]} verticalArrangement={{spacedBy: 12}}>
                <Text style={{fontSize: 12, fontWeight: "600", letterSpacing: 0.5}} color="#999999">
                  PANEL SETTINGS
                </Text>
                <Row verticalAlignment="center">
                  <Text modifiers={[weight(1)]}>Default Production</Text>
                  <TextInput
                    keyboardType="numeric"
                    defaultValue={config.defaultMaxWattage.toString()}
                    onChangeText={handleWattageChange}
                    modifiers={[weight(1)]}
                  />
                  <Text> W</Text>
                </Row>
                <Text color="#999999" style={{fontSize: 13}}>
                  Configure the default wattage each micro-inverter and solar panel will produce at
                  maximum production.
                </Text>
              </Column>
            </Card>

            {/* Location Section */}
            <Card variant="outlined">
              <Column modifiers={[paddingAll(16)]} verticalArrangement={{spacedBy: 12}}>
                <Text style={{fontSize: 12, fontWeight: "600", letterSpacing: 0.5}} color="#999999">
                  LOCATION
                </Text>
                <Row verticalAlignment="center">
                  <Text modifiers={[weight(1)]}>City</Text>
                  <TextInput
                    defaultValue={locationQuery || config.locationName || ''}
                    onChangeText={handleLocationSearch}
                    modifiers={[weight(2)]}
                  />
                </Row>
                {isSearching && (
                  <Text color="#999999">Searching...</Text>
                )}
                {locationResults.map((result) => (
                  <TextButton
                    key={`${result.latitude}-${result.longitude}`}
                    onPress={() => handleSelectLocation(result)}
                  >
                    {result.displayName.split(', ').slice(0, 2).join(', ')}
                  </TextButton>
                ))}
                <Text color="#999999" style={{fontSize: 13}}>
                  {config.locationName
                    ? `Current: ${config.locationName} (${config.latitude?.toFixed(2)}\u00B0, ${config.longitude?.toFixed(2)}\u00B0)`
                    : 'Search for your city to enable realistic solar simulation.'}
                </Text>
              </Column>
            </Card>

            {/* Roof Type Section */}
            <Card variant="outlined">
              <Column modifiers={[paddingAll(16)]} verticalArrangement={{spacedBy: 12}}>
                <Text style={{fontSize: 12, fontWeight: "600", letterSpacing: 0.5}} color="#999999">
                  ROOF
                </Text>
                <Picker
                  options={ROOF_TYPES.map((rt) => rt.label)}
                  selectedIndex={roofTypeIndex}
                  onOptionSelected={(e) => {
                    const selected = ROOF_TYPES[e.nativeEvent.index];
                    if (selected) updateRoofType(selected.value);
                  }}
                  variant="segmented"
                />
                <Row verticalAlignment="center">
                  <Text>{`Tilt Angle: ${Math.round(config.panelTiltAngle)}\u00B0`}</Text>
                  <Spacer modifiers={[weight(1)]} />
                </Row>
                <Slider
                  value={config.panelTiltAngle}
                  min={0}
                  max={90}
                  steps={18}
                  onValueChange={updatePanelTiltAngle}
                />
                <Text color="#999999" style={{fontSize: 13}}>
                  Select your roof shape for the 3D simulation view.
                </Text>
              </Column>
            </Card>

            {/* Micro-inverters Section */}
            <Card variant="outlined">
              <Column modifiers={[paddingAll(16)]} verticalArrangement={{spacedBy: 8}}>
                <Text style={{fontSize: 12, fontWeight: "600", letterSpacing: 0.5}} color="#999999">
                  MICRO-INVERTERS ({config.inverters.length})
                </Text>
                <LazyColumn verticalArrangement={{spacedBy: 4}}>
                  {config.inverters.map((inverter) => (
                    <ListItem
                      key={inverter.id}
                      headline={inverter.serialNumber}
                      supportingText={`${Math.round(inverter.efficiency)}% efficiency`}
                      onPress={() => handleOpenEditSheet(inverter)}
                    >
                      <ListItem.Trailing>
                        <TextButton
                          onPress={() => handleDeleteInverter(inverter)}
                          color="#FF3B30"
                        >
                          Delete
                        </TextButton>
                      </ListItem.Trailing>
                    </ListItem>
                  ))}
                </LazyColumn>
                <Text color="#999999" style={{fontSize: 13}}>
                  Tap to edit efficiency. Use Delete to remove.
                </Text>
              </Column>
            </Card>
          </LazyColumn>
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
