import {
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  View,
  useColorScheme,
  useWindowDimensions,
} from "react-native";
import { Stack } from "expo-router";
import { Image } from "expo-image";
import {
  Column,
  Host,
  OutlinedCard,
  RadioButton,
  Row,
  Text as UIText,
} from "@expo/ui/jetpack-compose";
import { clickable, fillMaxWidth, paddingAll, width as widthModifier } from "@expo/ui/jetpack-compose/modifiers";
import { ProcessingOverlay } from "@/components/ProcessingOverlay";
import { AnalysisPreview } from "@/components/AnalysisPreview";
import { WizardProgress } from "@/components/WizardProgress";
import { Button } from "@/components/Button";
import { useColors } from "@/utils/theme";
import { useAnalyzeFlow, MODELS } from "@/hooks/useAnalyzeFlow";
import { useMarkInteractive } from "@/hooks/useMarkInteractive";

export default function Analyze() {
  useMarkInteractive();
  const colors = useColors();
  const colorScheme = useColorScheme();
  const {width: screenWidth} = useWindowDimensions();
  const cardWidth = screenWidth - 32;

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

          <Host matchContents style={styles.pickerCardHost} colorScheme={colorScheme ?? undefined}>
            <OutlinedCard modifiers={[widthModifier(cardWidth)]}>
              <Column modifiers={[fillMaxWidth(), paddingAll(16)]}>
                <UIText style={{ typography: 'labelMedium', letterSpacing: 0.5 }} color={colors.text.secondary as string}>
                  SELECT AI MODEL
                </UIText>
                {MODELS.map((m) => (
                  <Row
                    key={m.id}
                    modifiers={[fillMaxWidth(), paddingAll(8), clickable(() => handleModelChange(m.id))]}
                    verticalAlignment="center"
                  >
                    <RadioButton selected={m.id === selectedModel} onClick={() => handleModelChange(m.id)} />
                    <UIText style={{ typography: 'bodyMedium' }} color={colors.text.primary as string}>
                      {m.name}{m.isDefault ? " (Default)" : ""}
                    </UIText>
                  </Row>
                ))}
                {error && (
                  <UIText style={{ typography: 'bodySmall' }} color={colors.system.red as string}>
                    {error}
                  </UIText>
                )}
              </Column>
            </OutlinedCard>
          </Host>
        </View>
      )}

      {phase === "results" && result && resized && (
        <View style={styles.outerContainer}>
          <ScrollView
            contentInsetAdjustmentBehavior="automatic"
            style={{ backgroundColor: colors.background.primary }}
            contentContainerStyle={[styles.scrollContent, isWizardMode && styles.scrollContentWithToolbar]}
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

        </View>
      )}

      <Stack.Toolbar placement="bottom">
        <Stack.Toolbar.View hidden={!isWizardMode || phase !== "select_model"}>
          <Pressable style={styles.toolbarTextButton} onPress={handleSkip}>
            <Text style={[styles.toolbarTextButtonLabel, {color: colors.primary as string}]}>Skip</Text>
          </Pressable>
        </Stack.Toolbar.View>
        <Stack.Toolbar.View hidden={phase !== "select_model"}>
          <Pressable style={styles.toolbarTextButton} onPress={handleAnalyze}>
            <Text style={[styles.toolbarTextButtonLabel, {color: colors.primary as string}]}>Analyze</Text>
          </Pressable>
        </Stack.Toolbar.View>
        <Stack.Toolbar.View hidden={phase !== "results" || !isWizardMode}>
          <Pressable style={styles.toolbarTextButton} onPress={handleSkip}>
            <Text style={[styles.toolbarTextButtonLabel, {color: colors.primary as string}]}>Skip</Text>
          </Pressable>
        </Stack.Toolbar.View>
      </Stack.Toolbar>
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
    margin: 16,
  },
  scrollContentWithToolbar: {
    paddingBottom: 96,
  },
  floatingToolbarContainer: {
    position: "absolute",
    bottom: 24,
    left: 0,
    right: 0,
    alignItems: "center",
    zIndex: 20,
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
  toolbarTextButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    minHeight: 36,
    justifyContent: "center",
  },
  toolbarTextButtonLabel: {
    fontSize: 14,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
});
