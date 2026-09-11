import { Platform, StyleSheet, Text, View } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useColors } from "@/utils/theme";
import { useMarkInteractive } from "@/hooks/useMarkInteractive";

export const COMPASS_HELP_TITLE = "Array Orientation";
export const COMPASS_HELP_BODY =
  "Drag the arrow to indicate which direction the top of your panel array faces. This helps track your array's orientation for optimal sun exposure.";

export default function CompassHelpScreen() {
  useMarkInteractive();
  const colors = useColors();

  return (
    <View
      style={[
        styles.container,
        Platform.OS === "android"
          ? { backgroundColor: colors.background.primary }
          : undefined,
      ]}
    >
      <MaterialIcons name="navigation" size={40} color={colors.primary as string} />
      <Text style={[styles.title, { color: colors.text.primary }]}>
        {COMPASS_HELP_TITLE}
      </Text>
      <Text style={[styles.body, { color: colors.text.secondary }]}>
        {COMPASS_HELP_BODY}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
    gap: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    textAlign: "center",
  },
  body: {
    fontSize: 15,
    lineHeight: 22,
    textAlign: "center",
    paddingHorizontal: 16,
  },
});
