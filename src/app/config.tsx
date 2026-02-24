import { View, Text, StyleSheet } from "react-native";
import { Stack } from "expo-router";

export default function ConfigScreen() {
  return (
    <>
      <Stack.Screen options={{ title: "Configuration" }} />
      <View style={styles.container}>
        <Text style={styles.text}>Configuration is not yet implemented for this platform.</Text>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center", padding: 24 },
  text: { fontSize: 16, textAlign: "center", color: "#6b7280" },
});
