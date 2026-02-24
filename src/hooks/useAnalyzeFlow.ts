/**
 * Business logic for the Analyze screen.
 * Manages the analysis state machine (model selection → processing → results),
 * API calls, image resizing, and navigation.
 */
import { useCallback, useReducer, useRef } from "react";
import { useRouter, useLocalSearchParams } from "expo-router";
import * as Haptics from "expo-haptics";
import { resizeForAnalysis } from "@/utils/imageResize";
import { setAnalysisResult } from "@/utils/analysisStore";

export interface PanelResult {
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: 0 | 90;
  label: string;
}

export interface AnalysisResponse {
  panels: PanelResult[];
  reasoning: string | null;
  model: string;
}

export interface ResizedImage {
  base64: string;
  mimeType: "image/jpeg";
  width: number;
  height: number;
}

export type Phase = "select_model" | "processing" | "results";

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

export const MODELS: { id: string; name: string; isDefault: boolean }[] = [
  { id: "us.anthropic.claude-sonnet-4-6", name: "Claude Sonnet 4.6", isDefault: true },
  { id: "us.anthropic.claude-opus-4-6-v1", name: "Claude Opus 4.6", isDefault: false },
  { id: "us.amazon.nova-pro-v1:0", name: "Amazon Nova Pro", isDefault: false },
  { id: "us.amazon.nova-premier-v1:0", name: "Amazon Nova Premier", isDefault: false },
  { id: "us.mistral.pixtral-large-2502-v1:0", name: "Mistral Pixtral Large", isDefault: false },
  { id: "us.meta.llama4-maverick-17b-instruct-v1:0", name: "Meta Llama 4 Maverick 17B", isDefault: false },
  { id: "us.meta.llama3-2-90b-instruct-v1:0", name: "Meta Llama 3.2 90B Vision", isDefault: false },
];

export function useAnalyzeFlow() {
  const router = useRouter();
  const { imageUri, wizard } = useLocalSearchParams<{
    imageUri: string;
    wizard?: string;
  }>();
  const isWizardMode = wizard === "true";

  const [state, dispatch] = useReducer(analyzeReducer, initialState);
  const { phase, selectedModel, error, result, reasoningExpanded, resized } = state;
  const abortRef = useRef<AbortController | null>(null);

  const decodedUri = decodeURIComponent(imageUri ?? "");

  const handleSkip = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const wizardParam = isWizardMode ? "?wizard=true" : "";
    router.push(`/custom${wizardParam}`);
  };

  const handleModelChange = useCallback((model: string) => {
    Haptics.selectionAsync();
    dispatch({ type: "SET_MODEL", model });
  }, []);

  const handleAnalyze = useCallback(async () => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    dispatch({ type: "START_PROCESSING" });

    try {
      // Resize once, cache for retries
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

  const handleToggleReasoning = () => {
    dispatch({ type: "TOGGLE_REASONING" });
  };

  const modelName = MODELS.find((m) => m.id === (result?.model ?? selectedModel))?.name ?? "Unknown";

  return {
    isWizardMode,
    phase,
    selectedModel,
    error,
    result,
    resized,
    reasoningExpanded,
    decodedUri,
    modelName,
    handleSkip,
    handleModelChange,
    handleAnalyze,
    handleRetry,
    handleContinue,
    handleToggleReasoning,
  };
}
