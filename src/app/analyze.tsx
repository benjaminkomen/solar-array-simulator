import {
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  View,
  useColorScheme,
} from "react-native";
import { Stack } from "expo-router";
import { Image } from "expo-image";
import { Host, Picker } from "@expo/ui";
import { ProcessingOverlay } from "@/components/ProcessingOverlay";
import { AnalysisPreview } from "@/components/AnalysisPreview";
import { WizardProgress } from "@/components/WizardProgress";
import { Button } from "@/components/Button";
import { useColors } from "@/utils/theme";
import {
  ANALYZE_MODEL_SECTION_TITLE,
  modelPickerLabel,
  shouldShowAnalyzeAction,
  shouldShowAnalyzeSkip,
} from "@/utils/analyzeChrome";
import { useAnalyzeFlow, MODELS } from "@/hooks/useAnalyzeFlow";
import { useMarkInteractive } from "@/hooks/useMarkInteractive";

export default function Analyze() {
  useMarkInteractive();
  const colors = useColors();
  const colorScheme = useColorScheme();

  const {
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
  } = useAnalyzeFlow();

  const hostColorScheme =
    colorScheme === "dark" || colorScheme === "light" ? colorScheme : undefined;

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

          <View style={styles.pickerBlock}>
            <Text
              testID="analyze-model-section-title"
              style={[styles.sectionTitle, { color: colors.text.secondary }]}
            >
              {ANALYZE_MODEL_SECTION_TITLE}
            </Text>
            <Host
              matchContents
              colorScheme={hostColorScheme}
              style={styles.pickerHost}
            >
              <Picker
                selectedValue={selectedModel}
                onValueChange={handleModelChange}
                testID="analyze-model-picker"
              >
                {MODELS.map((model) => (
                  <Picker.Item
                    key={model.id}
                    value={model.id}
                    label={modelPickerLabel(model)}
                  />
                ))}
              </Picker>
            </Host>
            {error ? (
              <Text style={[styles.errorText, { color: colors.system.red }]}>
                {error}
              </Text>
            ) : null}
          </View>
        </View>
      )}

      {phase === "results" && result && resized && (
        <ScrollView
          contentInsetAdjustmentBehavior="automatic"
          style={{ backgroundColor: colors.background.primary }}
          contentContainerStyle={[
            styles.scrollContent,
            isWizardMode && styles.scrollContentWithToolbar,
          ]}
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
              <Pressable onPress={handleToggleReasoning}>
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

      <Stack.Toolbar placement="bottom">
        <Stack.Toolbar.Button
          hidden={!shouldShowAnalyzeSkip(isWizardMode, phase)}
          onPress={handleSkip}
        >
          Skip
        </Stack.Toolbar.Button>
        <Stack.Toolbar.Button
          hidden={!shouldShowAnalyzeAction(phase)}
          onPress={handleAnalyze}
        >
          Analyze
        </Stack.Toolbar.Button>
      </Stack.Toolbar>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  pickerBlock: {
    margin: 16,
    gap: 8,
  },
  pickerHost: {
    width: "100%",
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "500",
    letterSpacing: 0.5,
  },
  errorText: {
    fontSize: 13,
  },
  scrollContent: {
    alignItems: "stretch",
    gap: 16,
    paddingHorizontal: 24,
    paddingVertical: 24,
  },
  scrollContentWithToolbar: {
    paddingBottom: 96,
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
