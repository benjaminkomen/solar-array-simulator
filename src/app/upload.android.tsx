import { useEffect, useState } from "react";
import { Text, ScrollView, Pressable, StyleSheet, View, useColorScheme } from "react-native";
import { Stack } from "expo-router";
import Animated, { FadeIn } from "react-native-reanimated";
import { MaterialIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { PermissionModal } from "@/components/PermissionModal";
import { WizardProgress } from "@/components/WizardProgress";
import { useColors } from "@/utils/theme";
import { useUpload } from "@/hooks/useUpload";
import { useMarkInteractive } from "@/hooks/useMarkInteractive";

export default function Upload() {
  useMarkInteractive();
  const colors = useColors();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  // Reanimated `entering` schedules updates during the first render. On Android
  // that races Config→Upload and trips LogBox ("state update on a component
  // that hasn't mounted yet"). Enable the fade only after mount.
  const [enterReady, setEnterReady] = useState(false);
  useEffect(() => {
    setEnterReady(true);
  }, []);
  const fadeIn = enterReady ? FadeIn.duration(300) : undefined;

  const {
    isWizardMode,
    handleSkip,
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
        <Animated.View
          entering={fadeIn}
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
          <MaterialIcons name="photo-library" size={80} color={colors.primary} />
        </Animated.View>

        <Animated.Text
          entering={fadeIn?.delay(100)}
          style={[styles.title, { color: colors.text.primary }]}
        >
          Take or Select Photo
        </Animated.Text>

        <Animated.Text
          entering={fadeIn?.delay(150)}
          style={[styles.subtitle, { color: colors.text.secondary }]}
        >
          Photograph your solar panel array with visible serial numbers
        </Animated.Text>

        <View style={styles.buttonsContainer}>
          <Animated.View entering={fadeIn?.delay(200)}>
            <Pressable
              testID="take-photo-button"
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                pickFromCamera();
              }}
              style={[styles.button, { backgroundColor: colors.primary }]}
            >
              <MaterialIcons name="camera-alt" size={22} color={colors.text.inverse} />
              <Text style={[styles.buttonText, { color: colors.text.inverse }]}>
                Take Photo
              </Text>
            </Pressable>
          </Animated.View>

          <Animated.View entering={fadeIn?.delay(300)}>
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
              <MaterialIcons name="photo-library" size={22} color={colors.primary} />
              <Text style={[styles.buttonText, { color: colors.primary }]}>
                Choose from Gallery
              </Text>
            </Pressable>
          </Animated.View>

        </View>
      </ScrollView>

      </View>

      <Stack.Toolbar placement="bottom">
        <Stack.Toolbar.View hidden={!isWizardMode}>
          <Pressable style={styles.toolbarTextButton} onPress={handleSkip}>
            <Text style={[styles.toolbarTextButtonLabel, { color: colors.primary as string }]}>Skip</Text>
          </Pressable>
        </Stack.Toolbar.View>
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
