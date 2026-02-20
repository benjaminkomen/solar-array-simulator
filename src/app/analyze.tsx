import { useCallback, useRef, useState } from "react";
import {
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  View,
} from "react-native";
import { Stack, useRouter, useLocalSearchParams } from "expo-router";
import { Image } from "expo-image";
import * as Haptics from "expo-haptics";
import { ProcessingOverlay } from "@/components/ProcessingOverlay";
import { AnalysisPreview } from "@/components/AnalysisPreview";
import { WizardProgress } from "@/components/WizardProgress";
import { Button } from "@/components/Button";
import { resizeForAnalysis } from "@/utils/imageResize";
import { setAnalysisResult } from "@/utils/analysisStore";
import { useColors } from "@/utils/theme";

interface PanelResult {
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: 0 | 90;
  label: string;
}

interface AnalysisResponse {
  panels: PanelResult[];
  reasoning: string | null;
  model: string;
}

interface ResizedImage {
  base64: string;
  mimeType: "image/jpeg";
  width: number;
  height: number;
}

type Phase = "select_model" | "processing" | "results";

const MODELS: { id: string; name: string; isDefault: boolean }[] = [
  { id: "us.anthropic.claude-sonnet-4-6-v1", name: "Claude Sonnet 4.6", isDefault: true },
  { id: "us.anthropic.claude-opus-4-6-v1", name: "Claude Opus 4.6", isDefault: false },
  { id: "us.amazon.nova-pro-v1:0", name: "Amazon Nova Pro", isDefault: false },
  { id: "us.amazon.nova-premier-v1:0", name: "Amazon Nova Premier", isDefault: false },
  { id: "us.mistral.pixtral-large-2502-v1:0", name: "Mistral Pixtral Large", isDefault: false },
  { id: "us.meta.llama4-maverick-17b-instruct-v1:0", name: "Meta Llama 4 Maverick 17B", isDefault: false },
  { id: "us.meta.llama3-2-90b-instruct-v1:0", name: "Meta Llama 3.2 90B Vision", isDefault: false },
];

export default function Analyze() {
  const router = useRouter();
  const { imageUri, wizard } = useLocalSearchParams<{
    imageUri: string;
    wizard?: string;
  }>();
  const isWizardMode = wizard === "true";
  const colors = useColors();

  const [phase, setPhase] = useState<Phase>("select_model");
  const [selectedModel, setSelectedModel] = useState(MODELS[0].id);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AnalysisResponse | null>(null);
  const [reasoningExpanded, setReasoningExpanded] = useState(false);
  const resizedRef = useRef<ResizedImage | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const decodedUri = decodeURIComponent(imageUri ?? "");

  const handleSkip = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const wizardParam = isWizardMode ? "?wizard=true" : "";
    router.push(`/custom${wizardParam}`);
  };

  const handleAnalyze = useCallback(async () => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setPhase("processing");
    setError(null);

    try {
      // Resize once, cache for retries
      if (!resizedRef.current) {
        resizedRef.current = await resizeForAnalysis(decodedUri);
      }
      const resized = resizedRef.current;

      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image: resized.base64,
          mimeType: resized.mimeType,
          model: selectedModel,
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        let errorMessage = `Server error: ${response.status}`;
        try {
          const body = await response.json();
          if (body.error) errorMessage = body.error;
        } catch {
          // ignore JSON parse error
        }
        throw new Error(errorMessage);
      }

      const data: AnalysisResponse = await response.json();
      setResult(data);
      setPhase("results");
    } catch (err: unknown) {
      if (err instanceof Error && err.name === "AbortError") return;
      const message = err instanceof Error ? err.message : "Unknown error";
      setError(message);
      setPhase("select_model");
    }
  }, [decodedUri, selectedModel]);

  const handleRetry = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setResult(null);
    setReasoningExpanded(false);
    setPhase("select_model");
  };

  const handleContinue = () => {
    if (!result || !resizedRef.current) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    setAnalysisResult({
      panels: result.panels,
      imageWidth: resizedRef.current.width,
      imageHeight: resizedRef.current.height,
    });

    const customRoute = isWizardMode
      ? "/custom?initialPanels=true&wizard=true"
      : "/custom?initialPanels=true";
    router.replace(customRoute);
  };

  const modelName = MODELS.find((m) => m.id === (result?.model ?? selectedModel))?.name ?? "Unknown";

  return (
    <>
      <Stack.Screen.BackButton displayMode="minimal" />
      {isWizardMode && <WizardProgress currentStep={2} />}

      {phase === "processing" && <ProcessingOverlay imageUri={decodedUri} />}

      {phase !== "processing" && (
        <ScrollView
          contentInsetAdjustmentBehavior="automatic"
          style={{ backgroundColor: colors.background.primary }}
          contentContainerStyle={styles.scrollContent}
        >
          {phase === "select_model" && (
            <>
              {/* Image preview */}
              <View style={styles.imageContainer}>
                <Image
                  source={{ uri: decodedUri }}
                  style={styles.imagePreview}
                  contentFit="contain"
                />
              </View>

              {/* Error banner */}
              {error && (
                <View style={[styles.errorBanner, { backgroundColor: "#FEE2E2" }]}>
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              )}

              {/* Model selector */}
              <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
                Select AI Model
              </Text>

              <View style={styles.modelList}>
                {MODELS.map((model) => {
                  const isSelected = selectedModel === model.id;
                  return (
                    <Pressable
                      key={model.id}
                      onPress={() => {
                        Haptics.selectionAsync();
                        setSelectedModel(model.id);
                      }}
                      style={[
                        styles.modelRow,
                        {
                          backgroundColor: isSelected
                            ? colors.primaryLight
                            : colors.background.secondary,
                          borderColor: isSelected
                            ? colors.primary
                            : colors.border.light,
                        },
                      ]}
                    >
                      <View
                        style={[
                          styles.radio,
                          {
                            borderColor: isSelected
                              ? colors.primary
                              : colors.border.medium,
                          },
                        ]}
                      >
                        {isSelected && (
                          <View
                            style={[
                              styles.radioInner,
                              { backgroundColor: colors.primary },
                            ]}
                          />
                        )}
                      </View>
                      <Text
                        style={[
                          styles.modelName,
                          {
                            color: colors.text.primary,
                            fontWeight: isSelected ? "600" : "400",
                          },
                        ]}
                      >
                        {model.name}
                      </Text>
                      {model.isDefault && (
                        <View style={[styles.badge, { backgroundColor: colors.primary }]}>
                          <Text style={[styles.badgeText, { color: colors.text.inverse }]}>
                            Default
                          </Text>
                        </View>
                      )}
                    </Pressable>
                  );
                })}
              </View>

              <Button
                title="Analyze"
                onPress={handleAnalyze}
                style={{ width: "100%" }}
              />
            </>
          )}

          {phase === "results" && result && resizedRef.current && (
            <>
              {/* Analysis preview with red boxes */}
              <AnalysisPreview
                imageUri={resizedRef.current.base64.startsWith("data:")
                  ? resizedRef.current.base64
                  : `data:image/jpeg;base64,${resizedRef.current.base64}`}
                imageWidth={resizedRef.current.width}
                imageHeight={resizedRef.current.height}
                panels={result.panels}
              />

              {/* Info badges */}
              <View style={styles.badgeRow}>
                <View style={[styles.infoBadge, { backgroundColor: colors.primaryLight }]}>
                  <Text style={[styles.infoBadgeText, { color: colors.primary }]}>
                    {result.panels.length} panel{result.panels.length !== 1 ? "s" : ""} detected
                  </Text>
                </View>
                <View style={[styles.infoBadge, { backgroundColor: colors.background.tertiary }]}>
                  <Text style={[styles.infoBadgeText, { color: colors.text.secondary }]}>
                    {modelName}
                  </Text>
                </View>
              </View>

              {/* Reasoning */}
              {result.reasoning && (
                <View style={styles.reasoningContainer}>
                  <Text
                    style={[styles.reasoningText, { color: colors.text.secondary }]}
                    numberOfLines={reasoningExpanded ? undefined : 3}
                  >
                    {result.reasoning}
                  </Text>
                  <Pressable onPress={() => setReasoningExpanded(!reasoningExpanded)}>
                    <Text style={[styles.showMoreText, { color: colors.primary }]}>
                      {reasoningExpanded ? "Show less" : "Show more"}
                    </Text>
                  </Pressable>
                </View>
              )}

              {/* Action buttons */}
              <View style={styles.buttonRow}>
                <Button
                  title="Retry"
                  variant="outlined"
                  onPress={handleRetry}
                  style={{ flex: 1 }}
                />
                <Button
                  title="Continue"
                  onPress={handleContinue}
                  style={{ flex: 1 }}
                />
              </View>
            </>
          )}
        </ScrollView>
      )}

      {isWizardMode && phase !== "processing" && (
        <Stack.Toolbar placement="bottom">
          <Stack.Toolbar.Button onPress={handleSkip}>
            Skip
          </Stack.Toolbar.Button>
        </Stack.Toolbar>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    alignItems: "stretch",
    gap: 16,
    paddingHorizontal: 24,
    paddingVertical: 24,
  },
  imageContainer: {
    borderRadius: 12,
    overflow: "hidden",
    alignSelf: "center",
    width: "100%",
    maxHeight: 200,
  },
  imagePreview: {
    width: "100%",
    height: 200,
  },
  errorBanner: {
    padding: 12,
    borderRadius: 8,
  },
  errorText: {
    color: "#DC2626",
    fontSize: 14,
    textAlign: "center",
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: "600",
    marginTop: 8,
  },
  modelList: {
    gap: 8,
  },
  modelRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
    gap: 12,
  },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    justifyContent: "center",
    alignItems: "center",
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  modelName: {
    fontSize: 16,
    flex: 1,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: "600",
  },
  badgeRow: {
    flexDirection: "row",
    gap: 8,
    flexWrap: "wrap",
  },
  infoBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  infoBadgeText: {
    fontSize: 13,
    fontWeight: "500",
  },
  reasoningContainer: {
    gap: 4,
  },
  reasoningText: {
    fontSize: 14,
    lineHeight: 20,
  },
  showMoreText: {
    fontSize: 14,
    fontWeight: "500",
  },
  buttonRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 8,
  },
});
