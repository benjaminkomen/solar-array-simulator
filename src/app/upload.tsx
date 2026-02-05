import { Text, ScrollView } from "react-native";
import { Stack } from "expo-router";
import { Image } from "expo-image";
import Animated, { FadeIn } from "react-native-reanimated";

const AnimatedImage = Animated.createAnimatedComponent(Image);

export default function Upload() {
  return (
    <>
      <Stack.Screen.Title style={{ fontSize: 20 }}>Upload</Stack.Screen.Title>
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
            boxShadow: "0 8px 24px rgba(0, 0, 0, 0.12)",
          }}
        >
          <AnimatedImage
            source="https://placehold.co/200x200/4f46e5/white?text=📷"
            style={{ width: "100%", height: "100%" }}
            contentFit="cover"
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
