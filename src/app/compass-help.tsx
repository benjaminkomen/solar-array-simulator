import { View, Text, StyleSheet } from "react-native";
import { Stack } from "expo-router";

export default function CompassHelpScreen() {
  return (
    <>
      <Stack.Screen options={{ title: "Compass Help", headerShown: false }} />
      <View style={styles.container}>
        <Text style={styles.text}>Compass help is not yet implemented for this platform.</Text>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center", padding: 24 },
  text: { fontSize: 16, textAlign: "center", color: "#6b7280" },
});
