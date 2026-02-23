import { StyleSheet, View } from "react-native";
import { Stack } from "expo-router";
import { Image } from "expo-image";
import { Host, Text as UIText, Column } from "@expo/ui/jetpack-compose";
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
          <Host matchContents>
            <Column horizontalAlignment="center">
              <UIText style={{ typography: 'titleMedium', fontWeight: '700' }} color={colors.text.primary}>
                Array Orientation
              </UIText>
              <UIText style={{ typography: 'bodyMedium', textAlign: 'center' }} color={colors.text.secondary}>
                {`Drag the arrow to indicate which direction the top of your panel array faces. This helps track your array\u2019s orientation for optimal sun exposure.`}
              </UIText>
            </Column>
          </Host>
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
});
