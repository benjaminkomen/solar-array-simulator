import { Text, ScrollView, Pressable, StyleSheet, View, useColorScheme, Platform } from "react-native";
import { Stack } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";
import { Image } from "expo-image";
import * as Haptics from "expo-haptics";
import { PermissionModal } from "@/components/PermissionModal";
import { WizardProgress } from "@/components/WizardProgress";
import { useColors } from "@/utils/theme";
import { useUpload } from "@/hooks/useUpload";
import { useMarkInteractive } from "@/hooks/useMarkInteractive";
import {
  ANALYZE_CONTINUE_WITHOUT_PHOTO_LABEL,
  ANALYZE_CONTINUE_WITHOUT_PHOTO_TEST_ID,
} from "@/utils/analyzeChrome";

function PhotoLibraryIcon({ color, size }: { color: string; size: number }) {
  if (Platform.OS === "ios") {
    return (
      <Image
        source="sf:photo.on.rectangle"
        style={{ width: size, height: size }}
        contentFit="contain"
        tintColor={color}
      />
    );
  }
  return <MaterialIcons name="photo-library" size={size} color={color} />;
}

function CameraIcon({ color, size }: { color: string; size: number }) {
  if (Platform.OS === "ios") {
    return (
      <Image
        source="sf:camera"
        style={{ width: size, height: size }}
        contentFit="contain"
        tintColor={color}
      />
    );
  }
  return <MaterialIcons name="camera-alt" size={size} color={color} />;
}

export default function Upload() {
  useMarkInteractive();
  const colors = useColors();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const {
    isWizardMode,
    handleSkip,
    handleContinueWithoutPhoto,
    pickFromCamera,
    pickFromGallery,
    modalState,
    handleModalAllow,
    handleModalClose,
  } = useUpload();

  return (
    <>
      {isWizardMode && <WizardProgress currentStep={2} />}
      <View style={styles.outerContainer}>
        <ScrollView
          contentInsetAdjustmentBehavior="automatic"
          style={{ backgroundColor: colors.background.primary }}
          contentContainerStyle={[styles.scrollContent, isWizardMode && styles.scrollContentWithToolbar]}
        >
          <View
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
            <PhotoLibraryIcon color={colors.primary as string} size={80} />
          </View>

          <Text style={[styles.title, { color: colors.text.primary }]}>
            Take or Select Photo
          </Text>

          <Text style={[styles.subtitle, { color: colors.text.secondary }]}>
            Photograph your solar panel array with visible serial numbers
          </Text>

          <View style={styles.buttonsContainer}>
            <Pressable
              testID="take-photo-button"
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                pickFromCamera();
              }}
              style={[styles.button, { backgroundColor: colors.primary }]}
            >
              <CameraIcon color={colors.text.inverse as string} size={22} />
              <Text style={[styles.buttonText, { color: colors.text.inverse }]}>
                Take Photo
              </Text>
            </Pressable>

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
              <PhotoLibraryIcon color={colors.primary as string} size={22} />
              <Text style={[styles.buttonText, { color: colors.primary }]}>
                Choose from Gallery
              </Text>
            </Pressable>

            {isWizardMode && (
              <Pressable
                testID={ANALYZE_CONTINUE_WITHOUT_PHOTO_TEST_ID}
                onPress={handleContinueWithoutPhoto}
                style={[
                  styles.button,
                  styles.buttonOutline,
                  {
                    backgroundColor: colors.background.primary,
                    borderColor: colors.border.light,
                  },
                ]}
              >
                <Text style={[styles.buttonText, { color: colors.primary }]}>
                  {ANALYZE_CONTINUE_WITHOUT_PHOTO_LABEL}
                </Text>
              </Pressable>
            )}
          </View>
        </ScrollView>
      </View>

      <Stack.Toolbar placement="bottom">
        {Platform.OS === "android" ? (
          <Stack.Toolbar.View hidden={!isWizardMode}>
            <Pressable
              style={styles.toolbarTextButton}
              onPress={handleSkip}
              accessibilityLabel="Skip"
            >
              <Text style={[styles.toolbarTextButtonLabel, { color: colors.primary as string }]}>
                Skip
              </Text>
            </Pressable>
          </Stack.Toolbar.View>
        ) : (
          isWizardMode && (
            <Stack.Toolbar.Button onPress={handleSkip}>Skip</Stack.Toolbar.Button>
          )
        )}
      </Stack.Toolbar>

      {modalState && (
        <PermissionModal
          visible={modalState.visible}
          type={modalState.type}
          isDenied={modalState.isDenied}
          onAllow={handleModalAllow}
          onClose={handleModalClose}
        />
      )}
    </>
  );
}

const styles = StyleSheet.create({
  outerContainer: {
    flex: 1,
  },
  scrollContent: {
    alignItems: "center",
    gap: 24,
    paddingHorizontal: 24,
    paddingVertical: 32,
  },
  scrollContentWithToolbar: {
    paddingBottom: 96,
  },
  iconContainer: {
    width: 200,
    height: 200,
    borderRadius: 32,
    overflow: "hidden",
    justifyContent: "center",
    alignItems: "center",
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
  buttonText: {
    fontSize: 17,
    fontWeight: "600",
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
