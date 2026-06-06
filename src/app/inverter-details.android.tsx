import { useColorScheme } from 'react-native';
import {
  Column,
  Host,
  Icon,
  IconButton,
  ModalBottomSheet,
  OutlinedCard,
  Row,
  Slider,
  OutlinedTextField,
  Text as UIText,
  useNativeState,
} from '@expo/ui/jetpack-compose';
import { fillMaxWidth, paddingAll } from '@expo/ui/jetpack-compose/modifiers';
import Check from '@expo/material-symbols/check.xml';
import Close from '@expo/material-symbols/close.xml';
import { useColors } from '@/utils/theme';
import { useInverterForm } from '@/hooks/useInverterForm';
import { useMarkInteractive } from "@/hooks/useMarkInteractive";

export default function InverterDetailsScreen() {
  useMarkInteractive();
  const colors = useColors();
  const colorScheme = useColorScheme();
  const {
    isAddMode,
    serial,
    setSerial,
    efficiency,
    setEfficiency,
    handleSave,
    handleCancel,
  } = useInverterForm();

  const serialState = useNativeState(serial);

  return (
    <Host matchContents colorScheme={colorScheme ?? undefined}>
      <ModalBottomSheet onDismissRequest={handleCancel}>
        <Column modifiers={[fillMaxWidth(), paddingAll(16)]} verticalArrangement={{ spacedBy: 16 }}>

          {/* Header: Cancel | Title | Save */}
          <Row horizontalArrangement="spaceBetween" modifiers={[fillMaxWidth()]}>
            <IconButton onClick={handleCancel}>
              <Icon source={Close} tint={colors.text.secondary} />
            </IconButton>
            <UIText style={{ typography: 'titleMedium', fontWeight: '700' }} color={colors.text.primary as string}>
              {isAddMode ? 'New Micro-inverter' : 'Edit Micro-inverter'}
            </UIText>
            <IconButton onClick={handleSave}>
              <Icon source={Check} tint={colors.primary} />
            </IconButton>
          </Row>

          {/* Details */}
          <OutlinedCard>
            <Column modifiers={[paddingAll(16), fillMaxWidth()]}>
              <UIText style={{ typography: 'labelMedium', letterSpacing: 0.5 }} color={colors.text.secondary as string}>
                DETAILS
              </UIText>
              <UIText style={{ typography: 'bodyLarge' }} color={colors.text.primary as string}>
                Serial Number
              </UIText>
              <OutlinedTextField
                value={serialState}
                onValueChange={setSerial}
                keyboardOptions={{ keyboardType: 'number' }}
              />
            </Column>
          </OutlinedCard>

          {/* Efficiency */}
          <OutlinedCard>
            <Column modifiers={[paddingAll(16)]}>
              <UIText style={{ typography: 'labelMedium', letterSpacing: 0.5 }} color={colors.text.secondary as string}>
                EFFICIENCY
              </UIText>
              <UIText style={{ typography: 'headlineMedium', fontWeight: '700' }} color={colors.text.primary as string}>
                {`${Math.round(efficiency)}%`}
              </UIText>
              <Slider
                value={efficiency / 100}
                onValueChange={(val) => setEfficiency(val * 100)}
                min={0}
                max={1}
              />
              <UIText style={{ typography: 'bodySmall' }} color={colors.text.secondary as string}>
                {isAddMode
                  ? 'Set the expected efficiency for this micro-inverter.'
                  : 'Adjust for shading, dirt, or other obstructions.'}
              </UIText>
            </Column>
          </OutlinedCard>

        </Column>
      </ModalBottomSheet>
    </Host>
  );
}
