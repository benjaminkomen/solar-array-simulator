import { View, Text, StyleSheet } from "react-native";
import { Stack } from "expo-router";

export default function CompassHelpScreen() {
  return (
    <>
      <Stack.Screen options={{ title: "Compass Help" }} />
      <View style={styles.container}>
        <Text style={styles.text}>
          This screen is not available on this platform.
        </Text>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center" },
  text: { fontSize: 16, color: "#666" },
});
