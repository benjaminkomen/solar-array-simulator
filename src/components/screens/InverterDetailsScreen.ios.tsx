import { StyleSheet, View } from "react-native";
import { Stack } from "expo-router";
import { Host } from "@expo/ui/swift-ui";
import { scrollDismissesKeyboard } from "@expo/ui/swift-ui/modifiers";
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
          <InverterDetailsForm
            isAddMode={isAddMode}
            serial={serial}
            setSerial={setSerial}
            efficiency={efficiency}
            setEfficiency={setEfficiency}
            modifiers={[scrollDismissesKeyboard("immediately")]}
          />
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
