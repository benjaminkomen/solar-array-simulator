import { Text, View, StyleSheet } from "react-native";
import { Image } from "expo-image";
import Animated from "react-native-reanimated";

export default function Custom() {
  return (
    <View style={styles.container}>
      <Animated.View
        style={styles.imageContainer}
        sharedTransitionTag="custom-image"
      >
        <Image
          source="https://placehold.co/200x200/4f46e5/white?text=📷"
          style={styles.image}
          contentFit="cover"
        />
      </Animated.View>

      <Animated.Text
        style={styles.title}
        sharedTransitionTag="custom-title"
      >
        Custom
      </Animated.Text>

      <Animated.Text
        style={styles.description}
        sharedTransitionTag="custom-description"
      >
        create an array layout manually
      </Animated.Text>

      <View style={styles.content}>
        <Text style={styles.contentText}>
          This is where you'll be able to create an array layout manually.
        </Text>
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
    alignItems: "center",
  },
  imageContainer: {
    width: 200,
    height: 200,
    marginBottom: 32,
    borderRadius: 24,
    overflow: "hidden",
    backgroundColor: "#ffffff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 12,
    shadowOpacity: 0.2,
    elevation: 8,
  },
  image: {
    width: "100%",
    height: "100%",
  },
  title: {
    fontSize: 34,
    fontWeight: "700",
    color: "#1f2937",
    marginBottom: 16,
    textAlign: "center",
  },
  description: {
    fontSize: 18,
    color: "#6b7280",
    textAlign: "center",
    lineHeight: 26,
    marginBottom: 32,
  },
  content: {
    paddingTop: 20,
  },
  contentText: {
    fontSize: 16,
    color: "#4b5563",
    textAlign: "center",
    lineHeight: 24,
  },
});
