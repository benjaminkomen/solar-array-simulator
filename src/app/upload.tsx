import { useCallback, useRef, useState } from "react";
import { Alert, Text, ScrollView, Pressable, StyleSheet, View, useColorScheme } from "react-native";
import { Stack, useRouter, useLocalSearchParams } from "expo-router";
import { Image } from "expo-image";
import Animated, { FadeIn } from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { useImagePicker, type PickedImage } from "@/hooks/useImagePicker";
import { PermissionModal } from "@/components/PermissionModal";
import { ProcessingOverlay } from "@/components/ProcessingOverlay";
import { resizeForAnalysis } from "@/utils/imageResize";
import { setAnalysisResult } from "@/utils/analysisStore";
import { WizardProgress } from "@/components/WizardProgress";
import { useColors } from "@/utils/theme";

export default function Upload() {
  const router = useRouter();
  const { wizard } = useLocalSearchParams<{ wizard?: string }>();
  const isWizardMode = wizard === 'true';
  const abortRef = useRef<AbortController | null>(null);
  const [image, setImage] = useState<PickedImage | null>(null);
  const [error, setError] = useState<string | null>(null);
  const colors = useColors();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  // Derived: processing whenever an image has been picked
  const isProcessing = image != null;

  const handleSkip = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const wizardParam = isWizardMode ? '?wizard=true' : '';
    router.push(`/custom${wizardParam}`);
  };

  const analyzeImage = useCallback(async (picked: PickedImage) => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setImage(picked);
    setError(null);

    const handleAnalysisError = (message: string) => {
      console.error("Analysis failed:", message);
      setImage(null);
      setError(message);
      Alert.alert(
        "Analysis Failed",
        `Could not analyze the image: ${message}. Please try again.`,
      );
    };

    try {
      const resized = await resizeForAnalysis(picked.uri);

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
        handleAnalysisError(body.error ?? `Server error: ${response.status}`);
        return;
      }

      const result = await response.json();

      setAnalysisResult({
        panels: result.panels,
        imageWidth: resized.width,
        imageHeight: resized.height,
      });

      const wizardParam = isWizardMode ? '&wizard=true' : '';
      router.replace(`/custom?initialPanels=true${wizardParam}`);
    } catch (err: unknown) {
      if (err instanceof Error && err.name === "AbortError") return;
      handleAnalysisError(err instanceof Error ? err.message : "Unknown error");
    }
  }, [isWizardMode, router]);

  const {
    pickFromCamera,
    pickFromGallery,
    modalState,
    handleModalAllow,
    handleModalClose,
  } = useImagePicker(analyzeImage);

  return (
    <>
      <Stack.Screen.BackButton displayMode="minimal" />
      {isWizardMode && <WizardProgress currentStep={2} />}
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        style={{ backgroundColor: colors.background.primary }}
        contentContainerStyle={styles.scrollContent}
      >
        <Animated.View
          entering={FadeIn.duration(300)}
          style={[
            styles.iconContainer,
            {
              backgroundColor: colors.background.secondary,
              boxShadow: isDark
                ? "0 8px 24px rgba(255, 255, 255, 0.2)"
                : "0 8px 24px rgba(0, 0, 0, 0.12)",
            },
          ]}
        >
          <Image
            source="sf:photo.on.rectangle"
            style={styles.icon}
            contentFit="contain"
            tintColor={colors.primary}
          />
        </Animated.View>

        <Animated.Text
          entering={FadeIn.duration(300).delay(100)}
          style={[styles.title, { color: colors.text.primary }]}
        >
          Take or Select Photo
        </Animated.Text>

        <Animated.Text
          entering={FadeIn.duration(300).delay(150)}
          style={[styles.subtitle, { color: colors.text.secondary }]}
        >
          Photograph your solar panel array with visible serial numbers
        </Animated.Text>

        <View style={styles.buttonsContainer}>
          <Animated.View entering={FadeIn.duration(300).delay(200)}>
            <Pressable
              testID="take-photo-button"
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                pickFromCamera();
              }}
              style={[styles.button, { backgroundColor: colors.primary }]}
            >
              <Image
                source="sf:camera"
                style={styles.buttonIcon}
                contentFit="contain"
                tintColor={colors.text.inverse}
              />
              <Text style={[styles.buttonText, { color: colors.text.inverse }]}>
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
              style={[
                styles.button,
                styles.buttonOutline,
                {
                  backgroundColor: colors.background.primary,
                  borderColor: colors.border.light,
                },
              ]}
            >
              <Image
                source="sf:photo.on.rectangle"
                style={styles.buttonIcon}
                contentFit="contain"
                tintColor={colors.primary}
              />
              <Text style={[styles.buttonText, { color: colors.primary }]}>
                Choose from Gallery
              </Text>
            </Pressable>
          </Animated.View>

        </View>
      </ScrollView>

      {isWizardMode && (
        <Stack.Toolbar placement="bottom">
          <Stack.Toolbar.Button onPress={handleSkip}>
            Skip
          </Stack.Toolbar.Button>
        </Stack.Toolbar>
      )}

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

const styles = StyleSheet.create({
  scrollContent: {
    alignItems: "center",
    gap: 24,
    paddingHorizontal: 24,
    paddingVertical: 32,
  },
  iconContainer: {
    width: 200,
    height: 200,
    borderRadius: 32,
    overflow: "hidden",
    justifyContent: "center",
    alignItems: "center",
  },
  icon: {
    width: 80,
    height: 80,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    textAlign: "center",
  },
  subtitle: {
    fontSize: 15,
    textAlign: "center",
    lineHeight: 22,
    paddingHorizontal: 16,
  },
  buttonsContainer: {
    gap: 12,
    width: "100%",
    marginTop: 16,
  },
  button: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 14,
    borderCurve: "continuous",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  buttonOutline: {
    borderWidth: 2,
  },
  buttonIcon: {
    width: 22,
    height: 22,
  },
  buttonText: {
    fontSize: 17,
    fontWeight: "600",
  },
});
