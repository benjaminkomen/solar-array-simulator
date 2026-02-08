import { useState } from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import {
  Host,
  TextField,
  List,
  Form,
  Section,
  LabeledContent,
  Text,
  Button,
  BottomSheet,
  VStack,
  HStack,
  Slider,
  Spacer,
  Image,
} from '@expo/ui/swift-ui';
import {
  foregroundStyle,
  bold,
  font,
  presentationDetents,
  presentationDragIndicator,
} from '@expo/ui/swift-ui/modifiers';
import { Ionicons } from '@expo/vector-icons';
import { useConfigStore } from '@/hooks/useConfigStore';
import type { InverterConfig } from '@/utils/configStore';

function generateSerialNumber(): string {
  return Math.floor(10000000 + Math.random() * 90000000).toString();
}

export default function ConfigScreen() {
  const { config, updateDefaultWattage, updateInverterEfficiency, updateInverterSerialNumber, addInverterWithDetails, removeInverter } =
    useConfigStore();

  // Add sheet state
  const [showAddSheet, setShowAddSheet] = useState(false);
  const [newSerial, setNewSerial] = useState('');
  const [newEfficiency, setNewEfficiency] = useState(95);

  // Edit sheet state
  const [editingInverter, setEditingInverter] = useState<InverterConfig | null>(null);
  const [editSerial, setEditSerial] = useState('');
  const [editEfficiency, setEditEfficiency] = useState(0);

  const handleWattageChange = (text: string) => {
    const wattage = parseInt(text, 10);
    if (!isNaN(wattage)) {
      updateDefaultWattage(wattage);
    }
  };

  const handleDelete = (indices: number[]) => {
    indices.forEach((i) => {
      const inverter = config.inverters[i];
      if (inverter) removeInverter(inverter.id);
    });
  };

  const handleOpenAddSheet = () => {
    setNewSerial(generateSerialNumber());
    setNewEfficiency(95);
    setShowAddSheet(true);
  };

  const handleAddInverter = () => {
    addInverterWithDetails(newSerial, newEfficiency);
    setShowAddSheet(false);
  };

  const handleOpenEditSheet = (inverter: InverterConfig) => {
    setEditingInverter(inverter);
    setEditSerial(inverter.serialNumber);
    setEditEfficiency(inverter.efficiency);
  };

  const handleSaveEdit = () => {
    if (editingInverter) {
      updateInverterSerialNumber(editingInverter.id, editSerial);
      updateInverterEfficiency(editingInverter.id, editEfficiency);
    }
    setEditingInverter(null);
  };

  return (
    <View style={styles.container}>
      <Host style={styles.form}>
        <Form>
          {/* Panel Settings Section */}
          <Section
            title="Panel Settings"
            footer={
              <Text>
                Configure the default wattage each micro-inverter and solar panel will produce at
                maximum production.
              </Text>
            }
          >
            <LabeledContent label="Default Wattage">
              <TextField
                keyboardType="numeric"
                defaultValue={config.defaultMaxWattage.toString()}
                onChangeText={handleWattageChange}
                placeholder="430"
              />
            </LabeledContent>
          </Section>

          {/* Micro-inverters Section */}
          <Section
            title={`Micro-inverters (${config.inverters.length})`}
            footer={
              <Text>
                Tap to edit efficiency. Swipe left to delete.
              </Text>
            }
          >
            <List.ForEach onDelete={handleDelete}>
              {config.inverters.map((inverter) => (
                <Button key={inverter.id} onPress={() => handleOpenEditSheet(inverter)}>
                  <HStack>
                    <VStack alignment="leading" spacing={2}>
                      <Text modifiers={[foregroundStyle({ type: 'hierarchical', style: 'primary' })]}>
                        {inverter.serialNumber}
                      </Text>
                      <Text
                        modifiers={[
                          foregroundStyle({ type: 'hierarchical', style: 'tertiary' }),
                          font({ size: 14 }),
                        ]}
                      >
                        {Math.round(inverter.efficiency)}% efficiency
                      </Text>
                    </VStack>
                    <Spacer />
                    <Image systemName="chevron.right" size={14} color="#C7C7CC" />
                  </HStack>
                </Button>
              ))}
            </List.ForEach>
          </Section>
        </Form>

        {/* Add Inverter Sheet */}
        <BottomSheet
          isPresented={showAddSheet}
          onIsPresentedChange={setShowAddSheet}
          modifiers={[presentationDetents(['large']), presentationDragIndicator('visible')]}
        >
          <Form>
            {/* Header */}
            <Section>
              <HStack>
                <Button onPress={() => setShowAddSheet(false)}>
                  <Image systemName="xmark.circle.fill" size={36} color="#E5E5EA" />
                </Button>
                <Spacer />
                <Text modifiers={[bold(), font({ size: 17 })]}>New Micro-inverter</Text>
                <Spacer />
                <Button onPress={handleAddInverter}>
                  <Image systemName="checkmark.circle.fill" size={36} color="#C7C7CC" />
                </Button>
              </HStack>
            </Section>

            {/* Serial Number */}
            <Section title="Details">
              <LabeledContent label="Serial Number">
                <TextField
                  defaultValue={newSerial}
                  onChangeText={setNewSerial}
                  placeholder="Enter serial number"
                  keyboardType="numeric"
                />
              </LabeledContent>
            </Section>

            {/* Efficiency */}
            <Section
              title="Efficiency"
              footer={<Text>Set the expected efficiency for this micro-inverter.</Text>}
            >
              <LabeledContent label="Current">
                <Text modifiers={[bold()]}>{Math.round(newEfficiency)}%</Text>
              </LabeledContent>
              <Slider
                value={newEfficiency / 100}
                onValueChange={(val) => setNewEfficiency(val * 100)}
                min={0}
                max={1}
                step={0.01}
              />
            </Section>
          </Form>
        </BottomSheet>

        {/* Edit Inverter Sheet */}
        <BottomSheet
          isPresented={editingInverter !== null}
          onIsPresentedChange={(presented) => {
            if (!presented) {
              handleSaveEdit();
            }
          }}
          modifiers={[presentationDetents(['large']), presentationDragIndicator('visible')]}
        >
          {editingInverter && (
            <Form>
              {/* Header */}
              <Section>
                <HStack>
                  <Button onPress={() => setEditingInverter(null)}>
                    <Image systemName="xmark.circle.fill" size={36} color="#E5E5EA" />
                  </Button>
                  <Spacer />
                  <Text modifiers={[bold(), font({ size: 17 })]}>Edit Micro-inverter</Text>
                  <Spacer />
                  <Button onPress={handleSaveEdit}>
                    <Image systemName="checkmark.circle.fill" size={36} color="#C7C7CC" />
                  </Button>
                </HStack>
              </Section>

              {/* Serial Number */}
              <Section title="Details">
                <LabeledContent label="Serial Number">
                  <TextField
                    defaultValue={editSerial}
                    onChangeText={setEditSerial}
                    placeholder="Enter serial number"
                    keyboardType="numeric"
                  />
                </LabeledContent>
              </Section>

              {/* Efficiency */}
              <Section
                title="Efficiency"
                footer={<Text>Adjust for shading, dirt, or other obstructions.</Text>}
              >
                <LabeledContent label="Current">
                  <Text modifiers={[bold()]}>{Math.round(editEfficiency)}%</Text>
                </LabeledContent>
                <Slider
                  value={editEfficiency / 100}
                  onValueChange={(val) => setEditEfficiency(val * 100)}
                  min={0}
                  max={1}
                  step={0.01}
                />
              </Section>
            </Form>
          )}
        </BottomSheet>
      </Host>

      {/* Floating add button */}
      <View style={styles.floatingButtonContainer}>
        <Pressable style={styles.floatingButton} onPress={handleOpenAddSheet}>
          <Ionicons name="add" size={28} color="#fff" />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  form: {
    flex: 1,
  },
  floatingButtonContainer: {
    position: 'absolute',
    bottom: 32,
    right: 20,
  },
  floatingButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
});
