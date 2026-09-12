import { StyleSheet, View } from "react-native";
import { Stack, useRouter } from "expo-router";
import { Host } from "@expo/ui/swift-ui";
import { PanelDetailsForm } from "@/components/PanelDetailsForm";
import { usePanelDetails } from "@/hooks/usePanelDetails";
import { useMarkInteractive } from "@/hooks/useMarkInteractive";

export default function PanelDetailsScreen() {
  useMarkInteractive();
  const router = useRouter();
  const {
    isViewMode,
    currentInverter,
    availableInverters,
    handleLink,
    handleUnlink,
  } = usePanelDetails();

  return (
    <>
      <Stack.Screen
        options={{
          sheetAllowedDetents: isViewMode ? [0.3] : [0.6, 1.0],
        }}
      />
      <View style={styles.container}>
        <Host style={styles.host}>
          <PanelDetailsForm
            isViewMode={isViewMode}
            currentInverter={currentInverter}
            availableInverters={availableInverters}
            onLink={handleLink}
            onUnlink={handleUnlink}
            onAddInverter={() => router.push("/config")}
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
