import { Text, View, StyleSheet, Dimensions } from "react-native";
import { useRouter } from "expo-router";
import OptionCard from "@/components/OptionCard";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");
// Calculate card size to be square and fill space efficiently
// Account for: title area (~100px), gap between cards (32px), margins (40px top/bottom)
const AVAILABLE_HEIGHT = SCREEN_HEIGHT - 230;
const AVAILABLE_WIDTH = SCREEN_WIDTH - 48; // 24px margin on each side
// Make cards as large as possible while fitting two cards with gap
const MAX_CARD_FROM_HEIGHT = (AVAILABLE_HEIGHT - 32) / 2; // Subtract gap
const MAX_CARD_FROM_WIDTH = AVAILABLE_WIDTH;
const CARD_SIZE = Math.min(MAX_CARD_FROM_HEIGHT, MAX_CARD_FROM_WIDTH);

export default function Index() {
  const router = useRouter();

  const handleUploadPress = () => {
    router.push("/upload");
  };

  const handleCustomPress = () => {
    router.push("/custom");
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Array builder</Text>
      <View style={styles.cardsContainer}>
        <OptionCard
          title="Upload"
          description="take or select a photo of your array layout"
          cardSize={CARD_SIZE}
          sharedTagPrefix="upload"
          onPress={handleUploadPress}
        />
        <OptionCard
          title="Custom"
          description="create an array layout manually"
          cardSize={CARD_SIZE}
          sharedTagPrefix="custom"
          onPress={handleCustomPress}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
    paddingTop: 60,
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 34,
    fontWeight: "bold",
    color: "#1f2937",
    marginBottom: 32,
    textAlign: "center",
  },
  cardsContainer: {
    flex: 1,
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    gap: 32,
    paddingBottom: 60,
  },
});
