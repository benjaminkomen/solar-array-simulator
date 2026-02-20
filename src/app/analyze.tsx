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
import { Form, Host, Picker, Section, Text as UIText } from "@expo/ui/swift-ui";
import { pickerStyle, tag } from "@expo/ui/swift-ui/modifiers";
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

      console.log("[Analyze] Sending request", {
        model: selectedModel,
        mimeType: resized.mimeType,
        imageSize: resized.base64.length,
        dimensions: `${resized.width}x${resized.height}`,
      });

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
        throw new Error(errorMessage);
      }

      const data: AnalysisResponse = await response.json();
      console.log("[Analyze] Success:", { panels: data.panels.length, model: data.model });
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

      {phase === "select_model" && (
        <View style={styles.container}>
          <View style={[styles.imageContainer, { backgroundColor: colors.background.primary }]}>
            <Image
              source={{ uri: decodedUri }}
              style={styles.imagePreview}
              contentFit="contain"
            />
          </View>

          <Host style={styles.form}>
            <Form>
              <Section
                header={<UIText>Select AI Model</UIText>}
                footer={error ? <UIText>{error}</UIText> : undefined}
              >
                <Picker
                  selection={selectedModel}
                  onSelectionChange={(value) => {
                    if (value) {
                      Haptics.selectionAsync();
                      setSelectedModel(value);
                    }
                  }}
                  modifiers={[pickerStyle("inline")]}
                >
                  {MODELS.map((model) => (
                    <UIText key={model.id} modifiers={[tag(model.id)]}>
                      {model.name}{model.isDefault ? " (Default)" : ""}
                    </UIText>
                  ))}
                </Picker>
              </Section>
            </Form>
          </Host>
        </View>
      )}

      {phase === "results" && result && resizedRef.current && (
        <ScrollView
          contentInsetAdjustmentBehavior="automatic"
          style={{ backgroundColor: colors.background.primary }}
          contentContainerStyle={styles.scrollContent}
        >
          <AnalysisPreview
            imageUri={resizedRef.current.base64.startsWith("data:")
              ? resizedRef.current.base64
              : `data:image/jpeg;base64,${resizedRef.current.base64}`}
            imageWidth={resizedRef.current.width}
            imageHeight={resizedRef.current.height}
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
              <Pressable onPress={() => setReasoningExpanded(!reasoningExpanded)}>
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
      )}

      {phase === "select_model" && (
        <Stack.Toolbar placement="bottom">
          {isWizardMode && (
            <Stack.Toolbar.Button onPress={handleSkip}>
              Skip
            </Stack.Toolbar.Button>
          )}
          <Stack.Toolbar.Button onPress={handleAnalyze}>
            Analyze
          </Stack.Toolbar.Button>
        </Stack.Toolbar>
      )}
      {isWizardMode && phase === "results" && (
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
  container: {
    flex: 1,
  },
  form: {
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
