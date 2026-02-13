import {StyleSheet, View} from "react-native";
import {Stack} from "expo-router";
import {Host, Image, Text, VStack,} from "@expo/ui/swift-ui";
import {bold, font, opacity, padding} from "@expo/ui/swift-ui/modifiers";

export default function CompassHelpScreen() {
  return (
    <>
      <Stack.Screen
        options={{
          sheetAllowedDetents: [0.3],
        }}
      />
      <View style={styles.container}>
        <Host style={styles.host}>
          <VStack spacing={12}>
            <Image systemName="location.north.fill" size={40} color="#007AFF"/>
            <Text modifiers={[bold(), font({size: 18})]}>
              Array Orientation
            </Text>
            <Text modifiers={[opacity(0.7), font({size: 15}), padding({horizontal: 16})]}>
              Drag the arrow to indicate which direction the top of your
              panel array faces. This helps track your array&apos;s orientation
              for optimal sun exposure.
            </Text>
          </VStack>
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
