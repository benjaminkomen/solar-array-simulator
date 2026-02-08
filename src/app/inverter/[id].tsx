import { useLocalSearchParams } from 'expo-router';
import { Host, Form, Section, Text, Slider, HStack, Spacer } from '@expo/ui/swift-ui';
import { foregroundStyle, bold, font } from '@expo/ui/swift-ui/modifiers';
import { useConfigStore } from '@/hooks/useConfigStore';

export default function InverterDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { config, updateInverterEfficiency } = useConfigStore();

  const inverter = config.inverters.find((inv) => inv.id === id);

  if (!inverter) {
    return (
      <Host style={{ flex: 1 }}>
        <Form>
          <Section title="Error">
            <Text>Inverter not found</Text>
          </Section>
        </Form>
      </Host>
    );
  }

  return (
    <Host style={{ flex: 1 }}>
      <Form>
        {/* Serial Number Section */}
        <Section title="Serial Number">
          <Text modifiers={[font({ design: 'monospaced', size: 17 })]}>
            {inverter.serialNumber}
          </Text>
        </Section>

        {/* Efficiency Section */}
        <Section
          title="Efficiency"
          footer={
            <Text>
              Adjust the efficiency based on real-world conditions. Lower efficiency for panels
              affected by shading, dirt, or other obstructions.
            </Text>
          }
        >
          {/* Current value display */}
          <HStack>
            <Spacer />
            <Text modifiers={[bold(), foregroundStyle('#6366f1'), font({ size: 34 })]}>
              {Math.round(inverter.efficiency)}%
            </Text>
            <Spacer />
          </HStack>

          {/* Slider with min/max labels */}
          <HStack spacing={12}>
            <Text modifiers={[foregroundStyle({ type: 'hierarchical', style: 'tertiary' })]}>
              0%
            </Text>
            <Slider
              value={inverter.efficiency / 100}
              onValueChange={(val) => updateInverterEfficiency(inverter.id, val * 100)}
              min={0}
              max={1}
              step={0.01}
            />
            <Text modifiers={[foregroundStyle({ type: 'hierarchical', style: 'tertiary' })]}>
              100%
            </Text>
          </HStack>
        </Section>
      </Form>
    </Host>
  );
}
