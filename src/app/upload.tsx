import { useEffect, useRef, useState } from "react";
import { Alert, Text, ScrollView, Pressable, View, useColorScheme } from "react-native";
import { Stack, useRouter, useLocalSearchParams } from "expo-router";
import { Image } from "expo-image";
import Animated, { FadeIn } from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { useImagePicker } from "@/hooks/useImagePicker";
import { PermissionModal } from "@/components/PermissionModal";
import { ProcessingOverlay } from "@/components/ProcessingOverlay";
import { resizeForAnalysis, cropPanelRegions } from "@/utils/imageResize";
import { setAnalysisResult } from "@/utils/analysisStore";
import { WizardProgress } from "@/components/WizardProgress";
import { useColors } from "@/utils/theme";

export default function Upload() {
  const router = useRouter();
  const { wizard } = useLocalSearchParams<{ wizard?: string }>();
  const isWizardMode = wizard === 'true';
  const abortRef = useRef<AbortController | null>(null);
  const [error, setError] = useState<string | null>(null);
  const colors = useColors();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

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

        // Pass 2: Crop each detected panel from the original full-res image
        // and extract serial numbers that were too small in the resized image
        let panelsWithSerials = result.panels;
        try {
          const crops = await cropPanelRegions(
            image!.uri,
            result.panels.map((p: { x: number; y: number; width: number; height: number }) => ({
              x: p.x,
              y: p.y,
              width: p.width,
              height: p.height,
            })),
            resized.width,
            resized.height,
          );

          if (crops.length > 0) {
            const serialResponse = await fetch("/api/extract-serials", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                crops: crops.map((c) => ({
                  base64: c.base64,
                  mimeType: c.mimeType,
                  index: c.index,
                })),
              }),
              signal: controller.signal,
            });

            if (serialResponse.ok) {
              const serialData = await serialResponse.json();
              // Merge serial numbers into panel results
              panelsWithSerials = result.panels.map(
                (panel: { label: string }, i: number) => {
                  const match = serialData.results?.find(
                    (r: { index: number; serial: string }) => r.index === i,
                  );
                  return {
                    ...panel,
                    label:
                      match?.serial || panel.label || "",
                  };
                },
              );
            }
          }
        } catch (serialErr) {
          // Serial extraction is best-effort; don't fail the whole flow
          console.warn("Serial extraction failed, using labels from pass 1:", serialErr);
        }

        // Store the result for the canvas screen to consume
        setAnalysisResult({
          panels: panelsWithSerials,
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
        style={{ backgroundColor: colors.background.primary }}
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
            backgroundColor: colors.background.secondary,
            justifyContent: "center",
            alignItems: "center",
            boxShadow: isDark
              ? "0 8px 24px rgba(255, 255, 255, 0.2)"
              : "0 8px 24px rgba(0, 0, 0, 0.12)",
          }}
        >
          <Image
            source="sf:photo.on.rectangle"
            style={{ width: 80, height: 80 }}
            contentFit="contain"
            tintColor={colors.primary}
          />
        </Animated.View>

        <Animated.Text
          entering={FadeIn.duration(300).delay(100)}
          style={{
            fontSize: 28,
            fontWeight: "700",
            color: colors.text.primary,
            textAlign: "center",
          }}
        >
          Take or Select Photo
        </Animated.Text>

        <Animated.Text
          entering={FadeIn.duration(300).delay(150)}
          style={{
            fontSize: 15,
            color: colors.text.secondary,
            textAlign: "center",
            lineHeight: 22,
            paddingHorizontal: 16,
          }}
        >
          Photograph your solar panel array with visible serial numbers
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
                backgroundColor: colors.primary,
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
                tintColor={colors.text.inverse}
              />
              <Text
                style={{
                  fontSize: 17,
                  fontWeight: "600",
                  color: colors.text.inverse,
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
                backgroundColor: colors.background.primary,
                paddingHorizontal: 24,
                paddingVertical: 16,
                borderRadius: 14,
                borderCurve: "continuous",
                borderWidth: 2,
                borderColor: colors.border.light,
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
                tintColor={colors.primary}
              />
              <Text
                style={{
                  fontSize: 17,
                  fontWeight: "600",
                  color: colors.primary,
                }}
              >
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
