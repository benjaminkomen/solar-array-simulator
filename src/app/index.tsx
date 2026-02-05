import { ScrollView, useWindowDimensions, Pressable } from "react-native";
import { Link, Stack } from "expo-router";
import { Image } from "expo-image";
import Animated, { FadeIn } from "react-native-reanimated";
import * as Haptics from "expo-haptics";

const AnimatedImage = Animated.createAnimatedComponent(Image);
const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface OptionProps {
  title: string;
  description: string;
  href: string;
  cardSize: number;
}

function OptionCard({ title, description, href, cardSize }: OptionProps) {
  const handlePressIn = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  return (
    <Link href={href} asChild>
      <Link.Trigger withAppleZoom>
        <AnimatedPressable
          entering={FadeIn.duration(300)}
          onPressIn={handlePressIn}
          style={({ pressed }) => [
            {
              width: cardSize,
              height: cardSize,
              backgroundColor: "#ffffff",
              borderRadius: 24,
              padding: 24,
              justifyContent: "center",
              alignItems: "center",
              boxShadow: "0 4px 12px rgba(0, 0, 0, 0.08)",
              opacity: pressed ? 0.7 : 1,
              transform: [{ scale: pressed ? 0.98 : 1 }],
            },
          ]}
        >
          <Animated.View
            style={{
              width: 80,
              height: 80,
              marginBottom: 16,
              borderRadius: 16,
              overflow: "hidden",
              backgroundColor: "#f3f4f6",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <AnimatedImage
              source={
                title === "Upload"
                  ? "https://placehold.co/80x80/4f46e5/white?text=📷"
                  : "https://placehold.co/80x80/4f46e5/white?text=✏️"
              }
              style={{ width: "100%", height: "100%" }}
              contentFit="cover"
            />
          </Animated.View>
          <Animated.Text
            style={{
              fontSize: 22,
              fontWeight: "700",
              color: "#000000",
              marginBottom: 8,
              textAlign: "center",
            }}
          >
            {title}
          </Animated.Text>
          <Animated.Text
            style={{
              fontSize: 13,
              color: "#6b7280",
              textAlign: "center",
              lineHeight: 18,
            }}
          >
            {description}
          </Animated.Text>
        </AnimatedPressable>
      </Link.Trigger>
    </Link>
  );
}

export default function Index() {
  const { width, height } = useWindowDimensions();

  const availableHeight = height - 300;
  const availableWidth = width - 48;
  const maxCardFromHeight = (availableHeight - 24) / 2;
  const cardSize = Math.min(maxCardFromHeight, availableWidth);

  return (
    <>
      <Stack.Screen.Title style={{ fontSize: 20 }}>
        Array Builder
      </Stack.Screen.Title>
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={{
          flexGrow: 1,
          justifyContent: "center",
          alignItems: "center",
          gap: 24,
          paddingHorizontal: 24,
          paddingVertical: 24,
        }}
      >
        <OptionCard
          title="Upload"
          description="Take or select a photo"
          cardSize={cardSize}
          href="/upload"
        />
        <OptionCard
          title="Custom"
          description="Create manually"
          cardSize={cardSize}
          href="/custom"
        />
      </ScrollView>
    </>
  );
}
