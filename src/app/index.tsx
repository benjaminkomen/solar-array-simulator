import { useEffect } from "react";
import { ScrollView, Text, useColorScheme } from "react-native";
import { useRouter } from "expo-router";
import { Image } from "expo-image";
import Animated, { FadeIn } from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { Button } from "@/components/Button";
import { useConfigStore } from "@/hooks/useConfigStore";
import { useColors } from "@/utils/theme";

export default function Index() {
  const router = useRouter();
  const { getWizardCompleted } = useConfigStore();
  const colors = useColors();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const wizardCompleted = getWizardCompleted();

  // Redirect returning users directly to production
  useEffect(() => {
    if (wizardCompleted) {
      router.replace("/production");
    }
  }, [wizardCompleted, router]);

  // Show nothing while redirecting
  if (wizardCompleted) {
    return null;
  }

  const handleGetStarted = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push("/config?wizard=true");
  };

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

        </ScrollView>
      </>
    );
}
