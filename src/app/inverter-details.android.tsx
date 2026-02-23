import {useState, useCallback} from 'react';
import {StyleSheet, View} from 'react-native';
import {Stack, useLocalSearchParams, useRouter} from 'expo-router';
import * as Haptics from 'expo-haptics';
import {useConfigStore} from '@/hooks/useConfigStore';
import {
  Host,
  Column,
  Row,
  Text,
  TextInput,
  Slider,
  Card,
  Spacer,
} from '@expo/ui/jetpack-compose';
import {paddingAll, padding, weight} from '@expo/ui/jetpack-compose/modifiers';

function generateSerialNumber(): string {
  return Math.floor(10000000 + Math.random() * 90000000).toString();
}

export default function InverterDetailsScreen() {
  const {mode, inverterId} = useLocalSearchParams<{
    mode: 'add' | 'edit';
    inverterId?: string;
  }>();
  const isAddMode = mode === 'add';
  const router = useRouter();

  const {
    config,
    addInverterWithDetails,
    updateInverterSerialNumber,
    updateInverterEfficiency,
  } = useConfigStore();

  // Find existing inverter for edit mode
  const existingInverter =
    !isAddMode && inverterId
      ? config.inverters.find((inv) => inv.id === inverterId)
      : null;

  // Local state for form fields
  const [serial, setSerial] = useState(() =>
    isAddMode ? generateSerialNumber() : existingInverter?.serialNumber ?? ''
  );
  const [efficiency, setEfficiency] = useState(() =>
    isAddMode ? 95 : existingInverter?.efficiency ?? 95
  );

  // Handle save action
  const handleSave = useCallback(() => {
    if (isAddMode) {
      addInverterWithDetails(serial, efficiency);
    } else if (inverterId) {
      updateInverterSerialNumber(inverterId, serial);
      updateInverterEfficiency(inverterId, efficiency);
    }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    router.back();
  }, [
    isAddMode,
    serial,
    efficiency,
    inverterId,
    addInverterWithDetails,
    updateInverterSerialNumber,
    updateInverterEfficiency,
    router,
  ]);

  // Handle cancel action
  const handleCancel = useCallback(() => {
    router.back();
  }, [router]);

  return (
    <>
      <Stack.Screen
        options={{
          title: isAddMode ? 'New Micro-inverter' : 'Edit Micro-inverter',
        }}
      />
      <Stack.Toolbar placement="left">
        <Stack.Toolbar.Button icon="xmark" onPress={handleCancel} accessibilityLabel="Cancel" />
      </Stack.Toolbar>
      <Stack.Toolbar placement="right">
        <Stack.Toolbar.Button icon="checkmark" onPress={handleSave} accessibilityLabel="Save" />
      </Stack.Toolbar>
      <View style={styles.container}>
        <Host style={styles.host}>
          <Column
            verticalArrangement={{spacedBy: 16}}
            modifiers={[paddingAll(16)]}
          >
            {/* Details Section */}
            <Card variant="outlined">
              <Column modifiers={[paddingAll(16)]} verticalArrangement={{spacedBy: 12}}>
                <Text style={{fontSize: 12, fontWeight: "600", letterSpacing: 0.5}} color="#999999">
                  DETAILS
                </Text>
                <Row verticalAlignment="center">
                  <Text modifiers={[weight(1)]}>Serial Number</Text>
                  <TextInput
                    defaultValue={serial}
                    onChangeText={setSerial}
                    keyboardType="numeric"
                    modifiers={[weight(1)]}
                  />
                </Row>
              </Column>
            </Card>

            {/* Efficiency Section */}
            <Card variant="outlined">
              <Column modifiers={[paddingAll(16)]} verticalArrangement={{spacedBy: 12}}>
                <Text style={{fontSize: 12, fontWeight: "600", letterSpacing: 0.5}} color="#999999">
                  EFFICIENCY
                </Text>
                <Row verticalAlignment="center">
                  <Text>Current</Text>
                  <Spacer modifiers={[weight(1)]} />
                  <Text style={{fontWeight: "bold"}}>{Math.round(efficiency)}%</Text>
                </Row>
                <Slider
                  value={efficiency / 100}
                  onValueChange={(val) => setEfficiency(val * 100)}
                  min={0}
                  max={1}
                />
                <Text color="#999999" style={{fontSize: 13}}>
                  {isAddMode
                    ? 'Set the expected efficiency for this micro-inverter.'
                    : 'Adjust for shading, dirt, or other obstructions.'}
                </Text>
              </Column>
            </Card>
          </Column>
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
