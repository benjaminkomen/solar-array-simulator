import { Text, ScrollView, Pressable, StyleSheet, View, useColorScheme } from "react-native";
import { Stack } from "expo-router";
import Animated, { FadeIn } from "react-native-reanimated";
import { MaterialIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { Button, Host } from "@expo/ui/jetpack-compose";
import { PermissionModal } from "@/components/PermissionModal";
import { WizardProgress } from "@/components/WizardProgress";
import { useColors } from "@/utils/theme";
import { useUpload } from "@/hooks/useUpload";
import {paddingAll} from "@expo/ui/jetpack-compose/modifiers";

export default function Upload() {
  const colors = useColors();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

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
      <Stack.Screen options={{ title: "" }} />
      {isWizardMode && <WizardProgress currentStep={2} />}
      <View style={styles.outerContainer}>
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        style={{ backgroundColor: colors.background.primary }}
        contentContainerStyle={[styles.scrollContent, isWizardMode && styles.scrollContentWithToolbar]}
      >
        <Animated.View
          entering={FadeIn.duration(300)}
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
          entering={FadeIn.duration(300).delay(100)}
          style={[styles.title, { color: colors.text.primary }]}
        >
          Take or Select Photo
        </Animated.Text>

        <Animated.Text
          entering={FadeIn.duration(300).delay(150)}
          style={[styles.subtitle, { color: colors.text.secondary }]}
        >
          Photograph your solar panel array with visible serial numbers
        </Animated.Text>

        <View style={styles.buttonsContainer}>
          <Animated.View entering={FadeIn.duration(300).delay(200)}>
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

          <Animated.View entering={FadeIn.duration(300).delay(300)}>
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

        {isWizardMode && (
          <View style={styles.floatingToolbarContainer} pointerEvents="box-none">
            <Host matchContents>
              <Button variant="elevated" onPress={handleSkip} modifiers={[paddingAll(8)]}>Skip</Button>
            </Host>
          </View>
        )}
      </View>

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
  floatingToolbarContainer: {
    position: "absolute",
    bottom: 30,
    left: 0,
    right: 0,
    alignItems: "center",
    zIndex: 20,
  },
});
