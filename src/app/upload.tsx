import { useEffect, useRef, useState } from "react";
import { Alert, Text, ScrollView, Pressable, View } from "react-native";
import { Stack, useRouter, useLocalSearchParams } from "expo-router";
import { Image } from "expo-image";
import Animated, { FadeIn } from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { useImagePicker } from "@/hooks/useImagePicker";
import { PermissionModal } from "@/components/PermissionModal";
import { ProcessingOverlay } from "@/components/ProcessingOverlay";
import { resizeForAnalysis } from "@/utils/imageResize";
import { setAnalysisResult } from "@/utils/analysisStore";
import { WizardProgress } from "@/components/WizardProgress";

export default function Upload() {
  const router = useRouter();
  const { wizard } = useLocalSearchParams<{ wizard?: string }>();
  const isWizardMode = wizard === 'true';
  const abortRef = useRef<AbortController | null>(null);
  const [error, setError] = useState<string | null>(null);

  const {
    image,
    pickFromCamera,
    pickFromGallery,
    modalState,
    handleModalAllow,
    handleModalClose,
  } = useImagePicker();

  // Derived: processing whenever an image has been picked
  const isProcessing = image != null;

  const handleSkip = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const wizardParam = isWizardMode ? '?wizard=true' : '';
    router.push(`/custom${wizardParam}`);
  };

  // Call the analysis API when an image is picked.
  // This is a legitimate effect: synchronizing with an external system (API)
  // that should be called when the image state changes.
  useEffect(() => {
    if (!isProcessing) return;

    const controller = new AbortController();
    abortRef.current = controller;

    async function analyzeImage() {
      try {
        setError(null);

        // Resize and compress the image for upload
        const resized = await resizeForAnalysis(image!.uri);

        // Call the API route
        const response = await fetch("/api/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            image: resized.base64,
            mimeType: resized.mimeType,
          }),
          signal: controller.signal,
        });

        if (!response.ok) {
          const body = await response.json().catch(() => ({}));
          throw new Error(
            body.error ?? `Server error: ${response.status}`,
          );
        }

        const result = await response.json();

        // Store the result for the canvas screen to consume
        setAnalysisResult({
          panels: result.panels,
          imageWidth: resized.width,
          imageHeight: resized.height,
        });

        const wizardParam = isWizardMode ? '&wizard=true' : '';
        router.replace(`/custom?initialPanels=true${wizardParam}`);
      } catch (err: unknown) {
        if (err instanceof Error && err.name === "AbortError") return;
        const message =
          err instanceof Error ? err.message : "Unknown error";
        console.error("Analysis failed:", message);
        setError(message);
        Alert.alert(
          "Analysis Failed",
          `Could not analyze the image: ${message}. Please try again.`,
        );
      }
    }

    analyzeImage();

    return () => {
      controller.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isProcessing]);

  return (
    <>
      <Stack.Screen.BackButton displayMode="minimal" />
      {isWizardMode && <WizardProgress currentStep={2} />}
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={{
          alignItems: "center",
          gap: 24,
          paddingHorizontal: 24,
          paddingVertical: 32,
        }}
      >
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
            boxShadow: "0 8px 24px rgba(0, 0, 0, 0.12)",
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
              testID="take-photo-button"
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
              testID="choose-gallery-button"
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

          {/* Skip link - only in wizard mode */}
          {isWizardMode && (
            <Animated.View entering={FadeIn.duration(300).delay(400)}>
              <Pressable
                testID="skip-button"
                onPress={handleSkip}
                style={{
                  paddingVertical: 16,
                  alignItems: "center",
                }}
              >
                <Text
                  style={{
                    fontSize: 15,
                    fontWeight: "500",
                    color: "#9ca3af",
                  }}
                >
                  Skip, create layout manually
                </Text>
              </Pressable>
            </Animated.View>
          )}
        </View>
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

      {isProcessing && !error && (
        <ProcessingOverlay imageUri={image!.uri} />
      )}
    </>
  );
}
