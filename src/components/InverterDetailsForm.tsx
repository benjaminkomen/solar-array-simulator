import { Platform } from "react-native";
import {
  FieldGroup,
  Row,
  Slider,
  Spacer,
  Text,
  TextInput,
  useNativeState,
  type FieldGroupProps,
} from "@expo/ui";
import { inverterEfficiencyFooter } from "@/components/detailsFormCopy";
import { useColors } from "@/utils/theme";

type InverterDetailsFormProps = {
  isAddMode: boolean;
  serial: string;
  setSerial: (serial: string) => void;
  efficiency: number;
  setEfficiency: (efficiency: number) => void;
  modifiers?: FieldGroupProps["modifiers"];
};

export function InverterDetailsForm({
  isAddMode,
  serial,
  setSerial,
  efficiency,
  setEfficiency,
  modifiers,
}: InverterDetailsFormProps) {
  const colors = useColors();
  const serialState = useNativeState(serial);
  const efficiencyLabel = `${Math.round(efficiency)}%`;

  return (
    <FieldGroup
      testID="inverter-details-form"
      style={Platform.OS === "android" ? { height: 420 } : undefined}
      modifiers={modifiers}
    >
      <FieldGroup.Section title="Details">
        <Row alignment="center" spacing={12}>
          <Text>Serial Number</Text>
          <Spacer flexible />
          <TextInput
            value={serialState}
            onChangeText={setSerial}
            placeholder="Enter serial number"
            keyboardType="numbers-and-punctuation"
            returnKeyType="done"
            testID="inverter-serial-input"
          />
        </Row>
      </FieldGroup.Section>

      <FieldGroup.Section title="Efficiency">
        <FieldGroup.SectionFooter>
          <Text textStyle={{ color: colors.text.secondary as string }}>
            {inverterEfficiencyFooter(isAddMode)}
          </Text>
        </FieldGroup.SectionFooter>
        <Row alignment="center" spacing={12}>
          <Text>Current</Text>
          <Spacer flexible />
          <Text textStyle={{ fontWeight: "700" }}>{efficiencyLabel}</Text>
        </Row>
        <Slider
          value={efficiency / 100}
          onValueChange={(value) => setEfficiency(value * 100)}
          min={0}
          max={1}
          testID="inverter-efficiency-slider"
        />
      </FieldGroup.Section>
    </FieldGroup>
  );
}
