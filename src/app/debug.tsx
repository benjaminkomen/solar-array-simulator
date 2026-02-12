import { StyleSheet, View } from "react-native";
import { Stack } from "expo-router";
import * as Haptics from "expo-haptics";
import { Form, Host, Section, Text, Toggle } from "@expo/ui/swift-ui";
import { useConfigStore } from "@/hooks/useConfigStore";

export default function DebugScreen() {
  const { setWizardCompleted, getWizardCompleted } = useConfigStore();

  const handleToggle = (value: boolean) => {
    setWizardCompleted(value);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  return (
    <>
      <Stack.Screen.BackButton displayMode="minimal" />
      <View style={styles.container}>
        <Host style={styles.host}>
          <Form>
            <Section
              header={<Text>Wizard State</Text>}
              footer={
                <Text>
                  When disabled, the welcome screen will be shown on next launch.
                </Text>
              }
            >
              <Toggle
                label="Wizard Completed"
                isOn={getWizardCompleted()}
                onIsOnChange={handleToggle}
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
