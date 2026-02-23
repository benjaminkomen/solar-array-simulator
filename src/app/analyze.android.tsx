import { useCallback, useReducer, useRef } from "react";
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
import { Host, Picker } from "@expo/ui/jetpack-compose";
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

interface AnalyzeState {
  phase: Phase;
  selectedModel: string;
  error: string | null;
  result: AnalysisResponse | null;
  reasoningExpanded: boolean;
  resized: ResizedImage | null;
}

type AnalyzeAction =
  | { type: "START_PROCESSING" }
  | { type: "SET_MODEL"; model: string }
  | { type: "SET_ERROR"; error: string }
  | { type: "SET_RESULT"; result: AnalysisResponse }
  | { type: "SET_RESIZED"; resized: ResizedImage }
  | { type: "TOGGLE_REASONING" }
  | { type: "RESET" };

const DEFAULT_MODEL = "us.anthropic.claude-sonnet-4-6";

function analyzeReducer(state: AnalyzeState, action: AnalyzeAction): AnalyzeState {
  switch (action.type) {
    case "START_PROCESSING":
      return { ...state, phase: "processing", error: null };
    case "SET_MODEL":
      return { ...state, selectedModel: action.model };
    case "SET_ERROR":
      return { ...state, error: action.error, phase: "select_model" };
    case "SET_RESULT":
      return { ...state, result: action.result, phase: "results" };
    case "SET_RESIZED":
      return { ...state, resized: action.resized };
    case "TOGGLE_REASONING":
      return { ...state, reasoningExpanded: !state.reasoningExpanded };
    case "RESET":
      return { ...state, result: null, reasoningExpanded: false, phase: "select_model" };
  }
}

const initialState: AnalyzeState = {
  phase: "select_model",
  selectedModel: DEFAULT_MODEL,
  error: null,
  result: null,
  reasoningExpanded: false,
  resized: null,
};

const MODELS: { id: string; name: string; isDefault: boolean }[] = [
  { id: "us.anthropic.claude-sonnet-4-6", name: "Claude Sonnet 4.6", isDefault: true },
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

  const [state, dispatch] = useReducer(analyzeReducer, initialState);
  const { phase, selectedModel, error, result, reasoningExpanded, resized } = state;
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

    dispatch({ type: "START_PROCESSING" });

    try {
      let img = resized;
      if (!img) {
        img = await resizeForAnalysis(decodedUri);
        dispatch({ type: "SET_RESIZED", resized: img });
      }

      console.log("[Analyze] Sending request", {
        model: selectedModel,
        mimeType: img.mimeType,
        imageSize: img.base64.length,
        dimensions: `${img.width}x${img.height}`,
      });

      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-API-Token": process.env.EXPO_PUBLIC_API_TOKEN!,
        },
        body: JSON.stringify({
          image: img.base64,
          mimeType: img.mimeType,
          model: selectedModel,
        }),
        signal: controller.signal,
      });

      console.log("[Analyze] Response status:", response.status);

      if (!response.ok) {
        const responseText = await response.text();
        console.log("[Analyze] Error response body:", responseText);
        let errorMessage = `Server error: ${response.status}`;
        try {
          const body = JSON.parse(responseText);
          if (body.error) errorMessage = body.error;
        } catch {
          errorMessage = `Server error: ${response.status} — ${responseText.slice(0, 200)}`;
        }
        dispatch({ type: "SET_ERROR", error: errorMessage });
        return;
      }

      const data: AnalysisResponse = await response.json();
      console.log("[Analyze] Success:", { panels: data.panels.length, model: data.model });
      dispatch({ type: "SET_RESULT", result: data });
    } catch (err: unknown) {
      if (err instanceof Error && err.name === "AbortError") return;
      const message = err instanceof Error ? err.message : "Unknown error";
      dispatch({ type: "SET_ERROR", error: message });
    }
  }, [decodedUri, selectedModel, resized]);

  const handleRetry = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    dispatch({ type: "RESET" });
  };

  const handleContinue = () => {
    if (!result || !resized) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    setAnalysisResult({
      panels: result.panels,
      imageWidth: resized.width,
      imageHeight: resized.height,
    });

    const customRoute = isWizardMode
      ? "/custom?initialPanels=true&wizard=true"
      : "/custom?initialPanels=true";
    router.replace(customRoute);
  };

  const modelName = MODELS.find((m) => m.id === (result?.model ?? selectedModel))?.name ?? "Unknown";

  return (
    <>
      <Stack.Screen
        options={{
          title: "",
          headerRight: () => (
            <View style={styles.headerActions}>
              {isWizardMode && (
                <Pressable onPress={handleSkip} style={styles.headerButton}>
                  <Text style={[styles.headerButtonText, { color: colors.primary }]}>Skip</Text>
                </Pressable>
              )}
            </View>
          ),
        }}
      />
      {isWizardMode && <WizardProgress currentStep={2} />}

      {phase === "processing" && <ProcessingOverlay imageUri={decodedUri} />}

      {phase === "select_model" && (
        <View style={styles.container}>
          <View style={[styles.imageContainer, { backgroundColor: colors.background.primary }]}>
            <Image
              source={{ uri: decodedUri }}
              style={styles.imagePreview}
              contentFit="contain"
            />
          </View>

          <View style={[styles.pickerCard, { backgroundColor: colors.background.primary, borderColor: colors.border.light }]}>
            <Text style={[styles.sectionHeader, { color: colors.text.secondary }]}>Select AI Model</Text>
            <Host style={styles.pickerHost}>
              <Picker
                options={MODELS.map(m => m.name + (m.isDefault ? " (Default)" : ""))}
                selectedIndex={MODELS.findIndex(m => m.id === selectedModel)}
                onOptionSelected={({ nativeEvent: { index } }) => {
                  const selected = MODELS[index];
                  if (selected) {
                    Haptics.selectionAsync();
                    dispatch({ type: "SET_MODEL", model: selected.id });
                  }
                }}
                variant="radio"
              />
            </Host>
            {error && (
              <Text style={[styles.errorText, { color: colors.system.red }]}>{error}</Text>
            )}
          </View>

          {/* Bottom action bar */}
          <View style={[styles.bottomBar, { backgroundColor: colors.background.primary, borderTopColor: colors.border.light }]}>
            <Pressable onPress={handleAnalyze} style={[styles.analyzeButton, { backgroundColor: colors.primary }]}>
              <Text style={[styles.analyzeButtonText, { color: colors.text.inverse }]}>Analyze</Text>
            </Pressable>
          </View>
        </View>
      )}

      {phase === "results" && result && resized && (
        <>
          <ScrollView
            contentInsetAdjustmentBehavior="automatic"
            style={{ backgroundColor: colors.background.primary }}
            contentContainerStyle={styles.scrollContent}
          >
            <AnalysisPreview
              imageUri={resized.base64.startsWith("data:")
                ? resized.base64
                : `data:image/jpeg;base64,${resized.base64}`}
              imageWidth={resized.width}
              imageHeight={resized.height}
              panels={result.panels}
            />

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

            {result.reasoning && (
              <View style={styles.reasoningContainer}>
                <Text
                  style={[styles.reasoningText, { color: colors.text.secondary }]}
                  numberOfLines={reasoningExpanded ? undefined : 3}
                >
                  {result.reasoning}
                </Text>
                <Pressable onPress={() => dispatch({ type: "TOGGLE_REASONING" })}>
                  <Text style={[styles.showMoreText, { color: colors.primary }]}>
                    {reasoningExpanded ? "Show less" : "Show more"}
                  </Text>
                </Pressable>
              </View>
            )}

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
          </ScrollView>

          {isWizardMode && (
            <View style={[styles.bottomBar, { backgroundColor: colors.background.primary, borderTopColor: colors.border.light }]}>
              <Pressable onPress={handleSkip} style={styles.skipButton}>
                <Text style={[styles.skipButtonText, { color: colors.primary }]}>Skip</Text>
              </Pressable>
            </View>
          )}
        </>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    alignItems: "stretch",
    gap: 16,
    paddingHorizontal: 24,
    paddingVertical: 24,
  },
  imageContainer: {
    overflow: "visible",
    alignSelf: "center",
    width: "100%",
    maxHeight: 250,
  },
  imagePreview: {
    width: "100%",
    height: 250,
  },
  pickerCard: {
    flex: 1,
    margin: 16,
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
  },
  sectionHeader: {
    fontSize: 13,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.3,
    marginBottom: 12,
  },
  pickerHost: {
    minHeight: 300,
  },
  errorText: {
    fontSize: 14,
    marginTop: 8,
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
  bottomBar: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
  },
  analyzeButton: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  analyzeButtonText: {
    fontSize: 17,
    fontWeight: "600",
  },
  skipButton: {
    paddingVertical: 14,
    alignItems: "center",
  },
  skipButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
  },
  headerButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  headerButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
});
