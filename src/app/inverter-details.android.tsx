import { useColorScheme } from "react-native";
import {
  Column,
  Host,
  Icon,
  IconButton,
  ModalBottomSheet,
  Row,
  Text as UIText,
} from "@expo/ui/jetpack-compose";
import { fillMaxWidth, paddingAll } from "@expo/ui/jetpack-compose/modifiers";
import Check from "@expo/material-symbols/check.xml";
import Close from "@expo/material-symbols/close.xml";
import { InverterDetailsForm } from "@/components/InverterDetailsForm";
import { useColors } from "@/utils/theme";
import { useInverterForm } from "@/hooks/useInverterForm";
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

  return (
    <Host matchContents colorScheme={colorScheme ?? undefined}>
      <ModalBottomSheet onDismissRequest={handleCancel}>
        <Column modifiers={[fillMaxWidth(), paddingAll(16)]} verticalArrangement={{ spacedBy: 16 }}>
          <Row horizontalArrangement="spaceBetween" modifiers={[fillMaxWidth()]}>
            <IconButton onClick={handleCancel}>
              <Icon source={Close} tint={colors.text.secondary} contentDescription="Cancel" />
            </IconButton>
            <UIText style={{ typography: "titleMedium", fontWeight: "700" }} color={colors.text.primary as string}>
              {isAddMode ? "New Micro-inverter" : "Edit Micro-inverter"}
            </UIText>
            <IconButton onClick={handleSave}>
              <Icon source={Check} tint={colors.primary} contentDescription="Save" />
            </IconButton>
          </Row>

          <InverterDetailsForm
            isAddMode={isAddMode}
            serial={serial}
            setSerial={setSerial}
            efficiency={efficiency}
            setEfficiency={setEfficiency}
          />
        </Column>
      </ModalBottomSheet>
    </Host>
  );
}
