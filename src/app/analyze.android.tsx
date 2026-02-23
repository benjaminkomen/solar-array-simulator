import {
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  View,
} from "react-native";
import { Stack } from "expo-router";
import { Image } from "expo-image";
import {
  Host, Picker, Card,
  Text as UIText, Column,
  HorizontalFloatingToolbar, TextButton,
} from "@expo/ui/jetpack-compose";
import { paddingAll } from "@expo/ui/jetpack-compose/modifiers";
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
      <Stack.Screen
        options={{
          title: "",
        }}
      />
      {isWizardMode && <WizardProgress currentStep={2} />}

      {phase === "processing" && <ProcessingOverlay imageUri={decodedUri} />}

      {phase === "select_model" && (
        <View style={styles.outerContainer}>
          <View style={[styles.imageContainer, { backgroundColor: colors.background.primary }]}>
            <Image
              source={{ uri: decodedUri }}
              style={styles.imagePreview}
              contentFit="contain"
            />
          </View>

          <Host matchContents style={styles.pickerCardHost}>
            <Card variant="outlined">
              <Column modifiers={[paddingAll(16)]}>
                <UIText style={{ typography: 'labelMedium', letterSpacing: 0.5 }} color={colors.text.secondary}>
                  SELECT AI MODEL
                </UIText>
                <Picker
                  options={MODELS.map(m => m.name + (m.isDefault ? " (Default)" : ""))}
                  selectedIndex={MODELS.findIndex(m => m.id === selectedModel)}
                  onOptionSelected={({ nativeEvent: { index } }) => {
                    const selected = MODELS[index];
                    if (selected) {
                      handleModelChange(selected.id);
                    }
                  }}
                  variant="radio"
                />
                {error && (
                  <UIText style={{ typography: 'bodySmall' }} color={colors.system.red}>
                    {error}
                  </UIText>
                )}
              </Column>
            </Card>
          </Host>

          <View style={styles.floatingToolbarContainer}>
            <Host matchContents>
              <HorizontalFloatingToolbar variant="vibrant">
                {isWizardMode && <TextButton onPress={handleSkip}>Skip</TextButton>}
                <HorizontalFloatingToolbar.FloatingActionButton onPress={handleAnalyze}>
                  <UIText style={{ typography: 'labelLarge', fontWeight: '600' }}>Analyze</UIText>
                </HorizontalFloatingToolbar.FloatingActionButton>
              </HorizontalFloatingToolbar>
            </Host>
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

          {isWizardMode && (
            <View style={[styles.skipBar, { backgroundColor: colors.background.primary, borderTopColor: colors.border.light }]}>
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
  outerContainer: {
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
  pickerCardHost: {
    flex: 1,
    margin: 16,
  },
  floatingToolbarContainer: {
    position: "absolute",
    bottom: 24,
    left: 0,
    right: 0,
    alignItems: "center",
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
  skipBar: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
  },
  skipButton: {
    paddingVertical: 14,
    alignItems: "center",
  },
  skipButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
});
