import { Text, ScrollView, Pressable, View } from "react-native";
import { Stack } from "expo-router";
import { Image } from "expo-image";
import Animated, { FadeIn } from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { useImagePicker } from "@/hooks/useImagePicker";
import { ImagePreview } from "@/components/ImagePreview";
import { PermissionModal } from "@/components/PermissionModal";

export default function Upload() {
  const {
    image,
    pickFromCamera,
    pickFromGallery,
    clearImage,
    modalState,
    handleModalAllow,
    handleModalClose,
  } = useImagePicker();

  return (
    <>
      <Stack.Screen.BackButton displayMode="minimal" />
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={{
          alignItems: "center",
          gap: 24,
          paddingHorizontal: 24,
          paddingVertical: 32,
        }}
      >
        {image ? (
          <ImagePreview uri={image.uri} onRetake={clearImage} />
        ) : (
          <>
            <Animated.View
              entering={FadeIn.duration(300)}
              style={{
                width: 200,
                height: 200,
                borderRadius: 32,
                overflow: "hidden",
                backgroundColor: "#ffffff",
                justifyContent: "center",
                alignItems: "center",
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 8 },
                shadowOpacity: 0.12,
                shadowRadius: 24,
              }}
            >
              <Image
                source="sf:photo.on.rectangle"
                style={{ width: 80, height: 80 }}
                contentFit="contain"
                tintColor="#6366f1"
              />
            </Animated.View>

            <Animated.Text
              entering={FadeIn.duration(300).delay(100)}
              style={{
                fontSize: 28,
                fontWeight: "700",
                color: "#000000",
                textAlign: "center",
              }}
            >
              Take or Select Photo
            </Animated.Text>

            <Animated.Text
              entering={FadeIn.duration(300).delay(150)}
              style={{
                fontSize: 15,
                color: "#6b7280",
                textAlign: "center",
                lineHeight: 22,
                paddingHorizontal: 16,
              }}
            >
              Photograph your solar panel array with visible barcodes or QR codes
            </Animated.Text>

            <View style={{ gap: 12, width: "100%", marginTop: 16 }}>
              <Animated.View entering={FadeIn.duration(300).delay(200)}>
                <Pressable
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    pickFromCamera();
                  }}
                  style={{
                    backgroundColor: "#6366f1",
                    paddingHorizontal: 24,
                    paddingVertical: 16,
                    borderRadius: 14,
                    borderCurve: "continuous",
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 10,
                  }}
                >
                  <Image
                    source="sf:camera"
                    style={{ width: 22, height: 22 }}
                    contentFit="contain"
                    tintColor="#ffffff"
                  />
                  <Text
                    style={{
                      fontSize: 17,
                      fontWeight: "600",
                      color: "#ffffff",
                    }}
                  >
                    Take Photo
                  </Text>
                </Pressable>
              </Animated.View>

              <Animated.View entering={FadeIn.duration(300).delay(300)}>
                <Pressable
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    pickFromGallery();
                  }}
                  style={{
                    backgroundColor: "#ffffff",
                    paddingHorizontal: 24,
                    paddingVertical: 16,
                    borderRadius: 14,
                    borderCurve: "continuous",
                    borderWidth: 2,
                    borderColor: "#e5e7eb",
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 10,
                  }}
                >
                  <Image
                    source="sf:photo.on.rectangle"
                    style={{ width: 22, height: 22 }}
                    contentFit="contain"
                    tintColor="#6366f1"
                  />
                  <Text
                    style={{
                      fontSize: 17,
                      fontWeight: "600",
                      color: "#6366f1",
                    }}
                  >
                    Choose from Gallery
                  </Text>
                </Pressable>
              </Animated.View>
            </View>
          </>
        )}
      </ScrollView>

      {modalState && (
        <PermissionModal
          visible={modalState.visible}
          type={modalState.type}
          isDenied={modalState.isDenied}
          onAllow={handleModalAllow}
          onClose={handleModalClose}
        />
      )}
    </>
  );
}
