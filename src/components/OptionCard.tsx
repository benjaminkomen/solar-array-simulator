import { StyleSheet, Pressable } from "react-native";
import { Image } from "expo-image";
import Animated from "react-native-reanimated";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);
const AnimatedImage = Animated.createAnimatedComponent(Image);

export interface OptionCardProps {
  title: string;
  description: string;
  imageUrl?: string;
  cardSize: number;
  sharedTagPrefix: string;
  onPress: () => void;
}

export default function OptionCard({
  title,
  description,
  imageUrl = "https://placehold.co/200x200/4f46e5/white?text=📷",
  cardSize,
  sharedTagPrefix,
  onPress,
}: OptionCardProps) {
  return (
    <AnimatedPressable
      onPress={onPress}
      style={[
        styles.card,
        { width: cardSize, height: cardSize },
      ]}
    >
      <Animated.View
        style={styles.imageContainer}
        sharedTransitionTag={`${sharedTagPrefix}-image`}
      >
        <AnimatedImage
          source={imageUrl}
          style={styles.image}
          contentFit="cover"
        />
      </Animated.View>
      <Animated.Text
        style={styles.cardTitle}
        sharedTransitionTag={`${sharedTagPrefix}-title`}
      >
        {title}
      </Animated.Text>
      <Animated.Text
        style={styles.cardDescription}
        sharedTransitionTag={`${sharedTagPrefix}-description`}
      >
        {description}
      </Animated.Text>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 24,
    padding: 24,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 12,
    shadowOpacity: 0.2,
    elevation: 8,
  },
  imageContainer: {
    width: 100,
    height: 100,
    marginBottom: 16,
    borderRadius: 16,
    overflow: "hidden",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  cardTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#1f2937",
    marginBottom: 8,
    textAlign: "center",
  },
  cardDescription: {
    fontSize: 14,
    color: "#6b7280",
    textAlign: "center",
    lineHeight: 20,
  },
});
