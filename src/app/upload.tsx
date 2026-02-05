import { Text, ScrollView } from "react-native";
import { Stack } from "expo-router";
import { Image } from "expo-image";
import Animated, { FadeIn } from "react-native-reanimated";

export default function Upload() {
  return (
    <>
      <Stack.Screen.BackButton displayMode="minimal" />
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={{
          alignItems: "center",
          gap: 24,
          paddingHorizontal: 24,
          paddingVertical: 32,
        }}
      >
        <Animated.View
          entering={FadeIn.duration(300)}
          style={{
            width: 200,
            height: 200,
            borderRadius: 32,
            overflow: "hidden",
            backgroundColor: "#ffffff",
            justifyContent: "center",
            alignItems: "center",
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.12,
            shadowRadius: 24,
          }}
        >
          <Image
            source="sf:photo.on.rectangle"
            style={{ width: 80, height: 80 }}
            contentFit="contain"
            tintColor="#6366f1"
          />
        </Animated.View>

        <Animated.Text
          entering={FadeIn.duration(300).delay(100)}
          style={{
            fontSize: 28,
            fontWeight: "700",
            color: "#000000",
            textAlign: "center",
          }}
        >
          Take or Select Photo
        </Animated.Text>

        <Animated.Text
          entering={FadeIn.duration(300).delay(150)}
          style={{
            fontSize: 15,
            color: "#6b7280",
            textAlign: "center",
            lineHeight: 22,
            paddingHorizontal: 16,
          }}
        >
          Photograph your solar panel array with visible barcodes or QR codes
        </Animated.Text>

        <Animated.View
          entering={FadeIn.duration(300).delay(200)}
          style={{
            marginTop: 16,
            paddingHorizontal: 16,
          }}
        >
          <Text
            style={{
              fontSize: 13,
              color: "#9ca3af",
              textAlign: "center",
              lineHeight: 20,
            }}
            selectable
          >
            Coming soon: Camera and image picker functionality
          </Text>
        </Animated.View>
      </ScrollView>
    </>
  );
}
