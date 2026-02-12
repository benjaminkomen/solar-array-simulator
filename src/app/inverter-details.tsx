import {useState, useCallback} from 'react';
import {StyleSheet, View, Keyboard, TouchableWithoutFeedback} from 'react-native';
import {Stack, useLocalSearchParams, useRouter} from 'expo-router';
import * as Haptics from 'expo-haptics';
import {useConfigStore} from '@/hooks/useConfigStore';
import {
  Form,
  Host,
  LabeledContent,
  Section,
  Slider,
  Text,
  TextField,
} from '@expo/ui/swift-ui';
import {
  bold,
  scrollDismissesKeyboard,
} from '@expo/ui/swift-ui/modifiers';

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
          sheetAllowedDetents: [0.6, 1.0],
        }}
      />
      <Stack.Toolbar placement="left">
        <Stack.Toolbar.Button icon="xmark" onPress={handleCancel} />
      </Stack.Toolbar>
      <Stack.Toolbar placement="right">
        <Stack.Toolbar.Button icon="checkmark" onPress={handleSave} />
      </Stack.Toolbar>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <View style={styles.container}>
          <Host style={styles.host}>
            <Form modifiers={[scrollDismissesKeyboard('interactively')]}>
              {/* Serial Number Section */}
              <Section header={<Text>Details</Text>}>
                <LabeledContent label="Serial Number">
                  <TextField
                    defaultValue={serial}
                    onChangeText={setSerial}
                    placeholder="Enter serial number"
                    keyboardType="numeric"
                  />
                </LabeledContent>
              </Section>

              {/* Efficiency Section */}
              <Section
                header={<Text>Efficiency</Text>}
                footer={
                  <Text>
                    {isAddMode
                      ? 'Set the expected efficiency for this micro-inverter.'
                      : 'Adjust for shading, dirt, or other obstructions.'}
                  </Text>
                }
              >
                <LabeledContent label="Current">
                  <Text modifiers={[bold()]}>{Math.round(efficiency)}%</Text>
                </LabeledContent>
                <Slider
                  value={efficiency / 100}
                  onValueChange={(val) => setEfficiency(val * 100)}
                  min={0}
                  max={1}
                />
              </Section>
            </Form>
          </Host>
        </View>
      </TouchableWithoutFeedback>
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
