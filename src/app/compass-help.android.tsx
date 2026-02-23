import { StyleSheet, View, Text } from "react-native";
import { Stack } from "expo-router";
import { Image } from "expo-image";
import { useColors } from "@/utils/theme";

export default function CompassHelpScreen() {
  const colors = useColors();

  return (
    <>
      <Stack.Screen
        options={{
          sheetAllowedDetents: [0.3],
        }}
      />
      <View style={styles.container}>
        <View style={styles.content}>
          <Image
            source="sf:location.north.fill"
            style={styles.icon}
            contentFit="contain"
            tintColor={colors.primary}
          />
          <Text style={[styles.title, { color: colors.text.primary }]}>
            Array Orientation
          </Text>
          <Text style={[styles.description, { color: colors.text.secondary }]}>
            Drag the arrow to indicate which direction the top of your
            panel array faces. This helps track your array&apos;s orientation
            for optimal sun exposure.
          </Text>
        </View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  content: {
    alignItems: "center",
    gap: 12,
  },
  icon: {
    width: 40,
    height: 40,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
  },
  description: {
    fontSize: 15,
    lineHeight: 22,
    textAlign: "center",
    paddingHorizontal: 16,
    opacity: 0.7,
  },
});
