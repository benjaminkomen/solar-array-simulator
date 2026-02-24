import {
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  View,
} from "react-native";
import { Stack } from "expo-router";
import { Image } from "expo-image";
import * as Haptics from "expo-haptics";
import { Form, Host, Picker, Section, Text as UIText } from "@expo/ui/swift-ui";
import { pickerStyle, tag } from "@expo/ui/swift-ui/modifiers";
import { ProcessingOverlay } from "@/components/ProcessingOverlay";
import { AnalysisPreview } from "@/components/AnalysisPreview";
import { WizardProgress } from "@/components/WizardProgress";
import { Button } from "@/components/Button";
import { useColors } from "@/utils/theme";
import { useAnalyzeFlow, MODELS } from "@/hooks/useAnalyzeFlow";

export default function Analyze() {
  const colors = useColors();

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
                      handleModelChange(value);
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

      {phase === "results" && result && resized && (
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
