import { useState } from "react";
import { ScrollView, useWindowDimensions, View, Text, Pressable, useColorScheme } from "react-native";
import { Stack, useRouter } from "expo-router";
import { Image } from "expo-image";
import Animated, { FadeIn } from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { OptionCard } from "@/components/OptionCard";
import { Button } from "@/components/Button";
import { useConfigStore } from "@/hooks/useConfigStore";
import { useColors } from "@/utils/theme";

export default function Index() {
  const router = useRouter();
  const { width, height } = useWindowDimensions();
  const { getWizardCompleted } = useConfigStore();
  const [showCards, setShowCards] = useState(false);
  const colors = useColors();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const wizardCompleted = getWizardCompleted();

  // Calculate card size to fit three cards in viewport with gap
  const gap = 16;
  const verticalPadding = 200;
  const availableHeight = height - verticalPadding;
  const cardSize = Math.min(width - 40, (availableHeight - gap * 2) / 3);

  const handleGetStarted = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push("/config?wizard=true");
  };

  // Show welcome screen for new users, or if they haven't chosen to see cards
  if (!wizardCompleted && !showCards) {
    return (
      <>
        <ScrollView
          contentInsetAdjustmentBehavior="automatic"
          style={{ backgroundColor: colors.background.primary }}
          contentContainerStyle={{
            flex: 1,
            alignItems: "center",
            justifyContent: "center",
            paddingHorizontal: 24,
            gap: 24,
          }}
        >
          {/* Hero icon */}
          <Animated.View
            entering={FadeIn.duration(400)}
            style={{
              width: 140,
              height: 140,
              borderRadius: 32,
              backgroundColor: colors.primaryLight,
              justifyContent: "center",
              alignItems: "center",
              boxShadow: isDark
                ? "0 8px 24px rgba(96, 165, 250, 0.4)"
                : "0 8px 24px rgba(59, 130, 246, 0.15)",
            }}
          >
            <Image
              source="sf:sun.max.fill"
              style={{ width: 70, height: 70 }}
              contentFit="contain"
              tintColor={colors.primary}
            />
          </Animated.View>

          {/* Title */}
          <Animated.View
            entering={FadeIn.duration(400).delay(100)}
            style={{ alignItems: "center", gap: 8 }}
          >
            <Text
              style={{
                fontSize: 32,
                fontWeight: "700",
                color: colors.text.primary,
                textAlign: "center",
              }}
            >
              Array Builder
            </Text>
            <Text
              style={{
                fontSize: 17,
                color: colors.text.secondary,
                textAlign: "center",
                lineHeight: 24,
                paddingHorizontal: 16,
              }}
            >
              Configure your solar panel array in 3 easy steps
            </Text>
          </Animated.View>

          {/* Get Started button */}
          <Animated.View
            entering={FadeIn.duration(400).delay(200)}
            style={{ width: "100%", paddingHorizontal: 16 }}
          >
            <Button
              title="Get Started"
              onPress={handleGetStarted}
              style={{ paddingVertical: 18, borderRadius: 14 }}
            />
          </Animated.View>

          {/* Already have layout link */}
          <Animated.View entering={FadeIn.duration(400).delay(300)}>
            <Pressable
              testID="already-have-layout-button"
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setShowCards(true);
              }}
            >
              <Text
                style={{
                  fontSize: 15,
                  color: colors.primary,
                  fontWeight: "500",
                }}
              >
                I already have a layout
              </Text>
            </Pressable>
          </Animated.View>
        </ScrollView>
      </>
    );
  }

  // Returning user view with option cards
  return (
    <>
      <Stack.Toolbar placement="right">
        <Stack.Toolbar.Button icon="wrench" onPress={() => router.push("/debug")} />
      </Stack.Toolbar>
      <Stack.Screen.Title style={{ fontSize: 20, color: colors.text.primary }}>
        Array Builder
      </Stack.Screen.Title>
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        style={{ backgroundColor: colors.background.primary }}
        contentContainerStyle={{
          alignItems: "center",
          paddingTop: 16,
          paddingBottom: 100,
        }}
      >
        <View
          style={{
            gap,
            paddingHorizontal: 20,
          }}
        >
          <OptionCard
            title="Configuration"
            description="Configure micro-inverters"
            cardSize={cardSize}
            href="/config"
            icon="sf:slider.horizontal.3"
            testID="config-option"
          />
          <OptionCard
            title="Upload"
            description="Take or select a photo"
            cardSize={cardSize}
            href="/upload"
            icon="sf:photo.on.rectangle"
            testID="upload-option"
          />
          <OptionCard
            title="Custom"
            description="Create manually"
            cardSize={cardSize}
            href="/custom"
            icon="sf:square.and.pencil"
            testID="custom-option"
          />
          <OptionCard
            title="Production"
            description="Monitor array output"
            cardSize={cardSize}
            href="/production"
            icon="sf:bolt.fill"
            testID="production-option"
          />
        </View>

        {/* Start new wizard button for returning users */}
        <View style={{ paddingHorizontal: 40, paddingTop: 24, width: "100%" }}>
          <Button
            title="Start New Setup"
            onPress={handleGetStarted}
            variant="outlined"
            style={{ paddingVertical: 14 }}
          />
        </View>
      </ScrollView>
    </>
  );
}
