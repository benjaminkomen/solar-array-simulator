import {StyleSheet, View} from 'react-native';
import {Stack} from 'expo-router';
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
  submitLabel,
} from '@expo/ui/swift-ui/modifiers';
import { useInverterForm } from '@/hooks/useInverterForm';

export default function InverterDetailsScreen() {
  const {
    isAddMode,
    serial,
    setSerial,
    efficiency,
    setEfficiency,
    handleSave,
    handleCancel,
  } = useInverterForm();

  return (
    <>
      <Stack.Screen
        options={{
          title: isAddMode ? 'New Micro-inverter' : 'Edit Micro-inverter',
          sheetAllowedDetents: [0.6, 1.0],
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
            <Form modifiers={[scrollDismissesKeyboard('immediately')]}>
              {/* Serial Number Section */}
              <Section header={<Text>Details</Text>}>
                <LabeledContent label="Serial Number">
                  <TextField
                    defaultValue={serial}
                    onChangeText={setSerial}
                    placeholder="Enter serial number"
                    keyboardType="numbers-and-punctuation"
                    modifiers={[submitLabel('done')]}
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
