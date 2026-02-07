import { ScrollView, useWindowDimensions, View } from "react-native";
import { Stack } from "expo-router";
import { OptionCard } from "@/components/OptionCard";

export default function Index() {
  const { width, height } = useWindowDimensions();

  // Calculate card size to fit both cards in viewport with gap
  const gap = 16;
  const verticalPadding = 200; // Account for header/safe area/padding/bottom
  const availableHeight = height - verticalPadding;
  const cardSize = Math.min(width - 40, (availableHeight - gap) / 2);

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
        }}
      >
        <View
          style={{
            gap,
            paddingHorizontal: 20,
          }}
        >
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
        </View>
      </ScrollView>
    </>
  );
}
