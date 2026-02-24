import { View, Text, StyleSheet } from "react-native";
import { Stack } from "expo-router";

export default function AnalyzeScreen() {
  return (
    <>
      <Stack.Screen options={{ title: "Analyze" }} />
      <View style={styles.container}>
        <Text style={styles.text}>Analyze is not yet implemented for this platform.</Text>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center", padding: 24 },
  text: { fontSize: 16, textAlign: "center", color: "#6b7280" },
});
