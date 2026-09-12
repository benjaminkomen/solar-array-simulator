import { Stack } from "expo-router";
import { InverterDetailsForm } from "@/components/InverterDetailsForm";
import { useInverterForm } from "@/hooks/useInverterForm";
import { useMarkInteractive } from "@/hooks/useMarkInteractive";

export default function InverterDetailsScreen() {
  useMarkInteractive();
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
          title: isAddMode ? "New Micro-inverter" : "Edit Micro-inverter",
        }}
      />
      <Stack.Toolbar placement="left">
        <Stack.Toolbar.Button onPress={handleCancel} accessibilityLabel="Cancel">
          Cancel
        </Stack.Toolbar.Button>
      </Stack.Toolbar>
      <Stack.Toolbar placement="right">
        <Stack.Toolbar.Button onPress={handleSave} accessibilityLabel="Save">
          Save
        </Stack.Toolbar.Button>
      </Stack.Toolbar>
      <InverterDetailsForm
        isAddMode={isAddMode}
        serial={serial}
        setSerial={setSerial}
        efficiency={efficiency}
        setEfficiency={setEfficiency}
      />
    </>
  );
}
