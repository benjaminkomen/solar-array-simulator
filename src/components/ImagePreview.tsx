import { Pressable, Text, View } from "react-native";
import { Image } from "expo-image";
import Animated, { FadeIn } from "react-native-reanimated";
import * as Haptics from "expo-haptics";

interface ImagePreviewProps {
  uri: string;
  onRetake: () => void;
}

export function ImagePreview({ uri, onRetake }: ImagePreviewProps) {
  return (
    <Animated.View
      entering={FadeIn.duration(300)}
      style={{
        alignItems: "center",
        gap: 24,
      }}
    >
      <View
        style={{
          width: 280,
          height: 280,
          borderRadius: 24,
          borderCurve: "continuous",
          overflow: "hidden",
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.12,
          shadowRadius: 24,
        }}
      >
        <Image
          source={{ uri }}
          style={{ width: "100%", height: "100%" }}
          contentFit="cover"
        />
      </View>

      <Pressable
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          onRetake();
        }}
        style={{
          backgroundColor: "#f3f4f6",
          paddingHorizontal: 24,
          paddingVertical: 14,
          borderRadius: 14,
          borderCurve: "continuous",
        }}
      >
        <Text
          style={{
            fontSize: 16,
            fontWeight: "600",
            color: "#6366f1",
          }}
        >
          Retake Photo
        </Text>
      </Pressable>
    </Animated.View>
  );
}
