import { Pressable, View, Text, ViewStyle, useColorScheme } from "react-native";
import { Link, Href } from "expo-router";
import { Image } from "expo-image";
import Animated, { FadeIn } from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { useColors } from "@/utils/theme";

interface OptionCardProps {
  title: string;
  description: string;
  href: Href;
  cardSize: number;
  icon: string;
  testID?: string;
}

export function OptionCard({ title, description, href, cardSize, icon, testID }: OptionCardProps) {
  const imageHeight = cardSize * 0.55;
  const contentHeight = cardSize - imageHeight;
  const colors = useColors();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  return (
    <Link href={href} asChild>
      <Link.Trigger withAppleZoom>
        <Pressable
          testID={testID}
          accessibilityLabel={title}
          accessibilityHint={description}
          accessibilityRole="button"
          onPressIn={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
          style={{ width: cardSize, height: cardSize }}
        >
          <Animated.View
            entering={FadeIn.duration(300)}
            style={{
              flex: 1,
              borderRadius: 14,
              borderWidth: 2,
              borderColor: colors.border.light,
              borderCurve: "continuous",
              overflow: "hidden",
              boxShadow: isDark
                ? "0 4px 12px rgba(255, 255, 255, 0.2)"
                : "0 4px 12px rgba(0, 0, 0, 0.08)",
            } as ViewStyle}
          >
            <View
              testID={`${testID}-inner`}
              style={{
                height: imageHeight,
                backgroundColor: colors.background.primary,
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <Image
                testID={`${testID}-image`}
                source={icon}
                style={{ width: imageHeight * 0.3, height: imageHeight * 0.3 }}
                contentFit="contain"
                tintColor={colors.primary}
              />
            </View>

            <View
              testID={`${testID}-text-container`}
              style={{
                height: contentHeight,
                backgroundColor: colors.background.secondary,
                paddingHorizontal: 12,
                paddingVertical: 8,
                justifyContent: "center",
              }}
            >
              <Text
                testID={`${testID}-title`}
                numberOfLines={1}
                style={{
                  fontSize: 16,
                  fontWeight: "600",
                  color: colors.text.primary,
                  marginBottom: 2,
                }}
              >
                {title}
              </Text>
              <Text
                testID={`${testID}-description`}
                numberOfLines={1}
                style={{
                  fontSize: 12,
                  color: colors.text.tertiary,
                }}
              >
                {description}
              </Text>
            </View>
          </Animated.View>
        </Pressable>
      </Link.Trigger>
    </Link>
  );
}
