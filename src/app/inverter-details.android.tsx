import {
  Host, ModalBottomSheet, Slider, TextInput,
  Card, Text as UIText, Column, Row, TextButton,
} from '@expo/ui/jetpack-compose';
import { paddingAll, fillMaxWidth } from '@expo/ui/jetpack-compose/modifiers';
import { useColors } from '@/utils/theme';
import { useInverterForm } from '@/hooks/useInverterForm';

export default function InverterDetailsScreen() {
  const colors = useColors();
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
    <Host matchContents>
      <ModalBottomSheet onDismissRequest={handleCancel}>
        <Column modifiers={[paddingAll(16)]} verticalArrangement={{ spacedBy: 16 }}>

          {/* Header: Cancel | Title | Save */}
          <Row horizontalArrangement="spaceBetween" modifiers={[fillMaxWidth()]}>
            <TextButton onPress={handleCancel}>Cancel</TextButton>
            <UIText style={{ typography: 'titleMedium', fontWeight: '700' }} color={colors.text.primary}>
              {isAddMode ? 'New Micro-inverter' : 'Edit Micro-inverter'}
            </UIText>
            <TextButton onPress={handleSave}>Save</TextButton>
          </Row>

          {/* Details */}
          <Card variant="outlined">
            <Column modifiers={[paddingAll(16)]}>
              <UIText style={{ typography: 'labelMedium', letterSpacing: 0.5 }} color={colors.text.secondary}>
                DETAILS
              </UIText>
              <UIText style={{ typography: 'bodyLarge' }} color={colors.text.primary}>
                Serial Number
              </UIText>
              <TextInput
                defaultValue={serial}
                onChangeText={setSerial}
                keyboardType="numeric"
              />
            </Column>
          </Card>

          {/* Efficiency */}
          <Card variant="outlined">
            <Column modifiers={[paddingAll(16)]}>
              <UIText style={{ typography: 'labelMedium', letterSpacing: 0.5 }} color={colors.text.secondary}>
                EFFICIENCY
              </UIText>
              <UIText style={{ typography: 'headlineMedium', fontWeight: '700' }} color={colors.text.primary}>
                {`${Math.round(efficiency)}%`}
              </UIText>
              <Slider
                value={efficiency / 100}
                onValueChange={(val) => setEfficiency(val * 100)}
                min={0}
                max={1}
              />
              <UIText style={{ typography: 'bodySmall' }} color={colors.text.secondary}>
                {isAddMode
                  ? 'Set the expected efficiency for this micro-inverter.'
                  : 'Adjust for shading, dirt, or other obstructions.'}
              </UIText>
            </Column>
          </Card>

        </Column>
      </ModalBottomSheet>
    </Host>
  );
}
