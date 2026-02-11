import { useState } from "react";
import { ScrollView, useWindowDimensions, View, Text, Pressable } from "react-native";
import { Stack, useRouter } from "expo-router";
import { Image } from "expo-image";
import Animated, { FadeIn } from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { OptionCard } from "@/components/OptionCard";
import { useConfigStore } from "@/hooks/useConfigStore";

export default function Index() {
  const router = useRouter();
  const { width, height } = useWindowDimensions();
  const { getWizardCompleted } = useConfigStore();
  const [showCards, setShowCards] = useState(false);

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
        <Stack.Screen.Title style={{ fontSize: 20 }}>
          Array Builder
        </Stack.Screen.Title>
        <ScrollView
          contentInsetAdjustmentBehavior="automatic"
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
              backgroundColor: "#f0f0ff",
              justifyContent: "center",
              alignItems: "center",
              boxShadow: "0 8px 24px rgba(99, 102, 241, 0.15)",
            }}
          >
            <Image
              source="sf:sun.max.fill"
              style={{ width: 70, height: 70 }}
              contentFit="contain"
              tintColor="#6366f1"
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
                color: "#111827",
                textAlign: "center",
              }}
            >
              Array Builder
            </Text>
            <Text
              style={{
                fontSize: 17,
                color: "#6b7280",
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
            <Pressable
              testID="get-started-button"
              onPress={handleGetStarted}
              style={{
                backgroundColor: "#6366f1",
                paddingVertical: 18,
                borderRadius: 14,
                borderCurve: "continuous",
                alignItems: "center",
              }}
            >
              <Text
                style={{
                  fontSize: 18,
                  fontWeight: "600",
                  color: "#ffffff",
                }}
              >
                Get Started
              </Text>
            </Pressable>
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
                  color: "#6366f1",
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
      <Stack.Screen.Title style={{ fontSize: 20 }}>
        Array Builder
      </Stack.Screen.Title>
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
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
          <Pressable
            testID="start-new-wizard-button"
            onPress={handleGetStarted}
            style={{
              backgroundColor: "#f3f4f6",
              paddingVertical: 14,
              borderRadius: 12,
              borderCurve: "continuous",
              alignItems: "center",
              borderWidth: 1,
              borderColor: "#e5e7eb",
            }}
          >
            <Text
              style={{
                fontSize: 15,
                fontWeight: "500",
                color: "#6366f1",
              }}
            >
              Start New Setup
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </>
  );
}
