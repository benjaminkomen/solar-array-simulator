import {StyleSheet, View, useColorScheme} from 'react-native';
import {useState, useCallback, useRef} from 'react';
import {
  Host,
  Box,
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
  HorizontalFloatingToolbar,
  ModalBottomSheet,
} from '@expo/ui/jetpack-compose';
import {paddingAll, weight, fillMaxSize, align, offset, size, clip, Shapes, background, clickable} from '@expo/ui/jetpack-compose/modifiers';
import {useConfigStore} from '@/hooks/useConfigStore';
import type {InverterConfig, RoofType} from '@/utils/configStore';
import {Stack, useLocalSearchParams, useRouter} from "expo-router";
import {WizardProgress} from "@/components/WizardProgress";
import {searchCity, type GeocodingResult} from "@/utils/geocoding";
import * as Haptics from "expo-haptics";
import {useColors} from "@/utils/theme";

function generateSerialNumber(): string {
  return Math.floor(10000000 + Math.random() * 90000000).toString();
}

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
  const colors = useColors();
  const colorScheme = useColorScheme();

  const {
    config,
    updateDefaultWattage,
    removeInverter,
    addInverterWithDetails,
    updateLocation,
    updatePanelTiltAngle,
    updateRoofType,
  } = useConfigStore();

  const [locationQuery, setLocationQuery] = useState('');
  const [locationResults, setLocationResults] = useState<GeocodingResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Add inverter bottom sheet state
  const [showAddSheet, setShowAddSheet] = useState(false);
  const [newSerial, setNewSerial] = useState('');
  const [newEfficiency, setNewEfficiency] = useState(95);

  const handleWattageChange = (text: string) => {
    const wattage = parseInt(text, 10);
    if (!isNaN(wattage)) {
      updateDefaultWattage(wattage);
    }
  };

  const handleShowAddSheet = () => {
    setNewSerial(generateSerialNumber());
    setNewEfficiency(95);
    setShowAddSheet(true);
  };

  const handleSaveNewInverter = () => {
    addInverterWithDetails(newSerial, newEfficiency);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setShowAddSheet(false);
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

  const handleDeleteInverter = (inverter: InverterConfig) => {
    removeInverter(inverter.id);
  };

  const roofTypeIndex = ROOF_TYPES.findIndex((rt) => rt.value === config.roofType);

  return (
    <>
      <Stack.Screen.BackButton displayMode="minimal"/>
      {isWizardMode && <WizardProgress currentStep={1}/>}
      <View style={[styles.container, {backgroundColor: colors.background.primary}]}>
        <Host style={styles.form} colorScheme={colorScheme ?? undefined}>
          <Box modifiers={[fillMaxSize()]} floatingToolbarExitAlwaysScrollBehavior="bottom">
            <LazyColumn
              verticalArrangement={{spacedBy: 8}}
              contentPadding={{start: 16, top: 16, end: 16, bottom: 80}}
            >
              {/* Panel Settings Section */}
              <Text style={{fontSize: 14, fontWeight: "500"}} color={colors.primary}>
                Panel settings
              </Text>
              <Card variant="outlined">
                <Column modifiers={[paddingAll(16)]} verticalArrangement={{spacedBy: 12}}>
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
              <Text style={{fontSize: 14, fontWeight: "500"}} color={colors.primary}>
                Location
              </Text>
              <Card variant="outlined">
                <Column modifiers={[paddingAll(16)]} verticalArrangement={{spacedBy: 12}}>
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
              <Text style={{fontSize: 14, fontWeight: "500"}} color={colors.primary}>
                Roof
              </Text>
              <Card variant="outlined">
                <Column modifiers={[paddingAll(16)]} verticalArrangement={{spacedBy: 12}}>
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
                    steps={17}
                    onValueChange={updatePanelTiltAngle}
                  />
                  <Text color="#999999" style={{fontSize: 13}}>
                    Select your roof shape for the 3D simulation view.
                  </Text>
                </Column>
              </Card>

              {/* Micro-inverters Section */}
              <Text style={{fontSize: 14, fontWeight: "500"}} color={colors.primary}>
                Micro-inverters ({config.inverters.length})
              </Text>
              <Column verticalArrangement={{spacedBy: 0}}>
                {config.inverters.map((inverter) => (
                  <ListItem
                    key={inverter.id}
                    headline={inverter.serialNumber}
                    supportingText={`${Math.round(inverter.efficiency)}% efficiency`}
                    modifiers={[clickable(() => handleOpenEditSheet(inverter))]}
                  >
                    <ListItem.Leading>
                      <Box
                        contentAlignment="center"
                        modifiers={[size(40, 40), clip(Shapes.Circle), background('#E8DEF8')]}
                      >
                        <Text style={{fontSize: 18}}>{"\u26A1"}</Text>
                      </Box>
                    </ListItem.Leading>
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
              </Column>
              {config.inverters.length === 0 && (
                <Text color="#999999" style={{fontSize: 13}}>
                  No micro-inverters configured. Tap + to add one.
                </Text>
              )}
            </LazyColumn>
            <HorizontalFloatingToolbar
              variant="standard"
              modifiers={[align('bottomCenter'), offset(0, -16)]}
            >
              {isWizardMode && (
                <TextButton onPress={handleContinue}>Continue</TextButton>
              )}
              <HorizontalFloatingToolbar.FloatingActionButton onPress={handleShowAddSheet}>
                <Text style={{fontSize: 24}}>+</Text>
              </HorizontalFloatingToolbar.FloatingActionButton>
            </HorizontalFloatingToolbar>
          </Box>

          {showAddSheet && (
            <ModalBottomSheet onDismissRequest={() => setShowAddSheet(false)}>
              <Column modifiers={[paddingAll(24)]} verticalArrangement={{spacedBy: 16}}>
                <Text style={{fontSize: 20, fontWeight: "bold"}}>
                  New Micro-inverter
                </Text>
                <Row verticalAlignment="center">
                  <Text modifiers={[weight(1)]}>Serial Number</Text>
                  <TextInput
                    defaultValue={newSerial}
                    onChangeText={setNewSerial}
                    keyboardType="numeric"
                    modifiers={[weight(1)]}
                  />
                </Row>
                <Row verticalAlignment="center">
                  <Text>Efficiency: {Math.round(newEfficiency)}%</Text>
                  <Spacer modifiers={[weight(1)]} />
                </Row>
                <Slider
                  value={newEfficiency / 100}
                  onValueChange={(val) => setNewEfficiency(val * 100)}
                  min={0}
                  max={1}
                />
                <Row horizontalArrangement="end">
                  <TextButton onPress={() => setShowAddSheet(false)}>Cancel</TextButton>
                  <TextButton onPress={handleSaveNewInverter}>Save</TextButton>
                </Row>
              </Column>
            </ModalBottomSheet>
          )}
        </Host>
      </View>
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
