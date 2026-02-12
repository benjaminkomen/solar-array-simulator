import { Modal, View, Text, Pressable } from "react-native";
import { Image } from "expo-image";
import * as Linking from "expo-linking";
import * as Haptics from "expo-haptics";
import { useColors } from "@/utils/theme";

interface PermissionModalProps {
  visible: boolean;
  onClose: () => void;
  onAllow: () => void;
  type: "camera" | "gallery";
  isDenied: boolean;
}

export function PermissionModal({
  visible,
  onClose,
  onAllow,
  type,
  isDenied,
}: PermissionModalProps) {
  const isCamera = type === "camera";
  const colors = useColors();

  const title = isDenied
    ? `${isCamera ? "Camera" : "Photo Library"} Access Denied`
    : `Allow ${isCamera ? "Camera" : "Photo Library"} Access`;

  const description = isDenied
    ? `You've previously denied ${isCamera ? "camera" : "photo library"} access. To use this feature, please enable it in your device settings.`
    : isCamera
      ? "We need access to your camera to photograph your solar panel array. The photo will be used to identify panel barcodes and QR codes."
      : "We need access to your photo library to select an existing photo of your solar panel array.";

  const icon = isCamera ? "sf:camera" : "sf:photo.on.rectangle";

  const handleOpenSettings = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Linking.openSettings();
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable
        style={{
          flex: 1,
          backgroundColor: "rgba(0, 0, 0, 0.5)",
          justifyContent: "center",
          alignItems: "center",
          padding: 24,
        }}
        onPress={onClose}
      >
        <Pressable
          style={{
            backgroundColor: colors.background.primary,
            borderRadius: 24,
            borderCurve: "continuous",
            padding: 24,
            width: "100%",
            maxWidth: 340,
            alignItems: "center",
            gap: 16,
          }}
          onPress={(e) => e.stopPropagation()}
        >
          <View
            style={{
              width: 64,
              height: 64,
              borderRadius: 16,
              borderCurve: "continuous",
              backgroundColor: isDenied ? colors.background.tertiary : colors.primaryLight,
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <Image
              source={isDenied ? "sf:exclamationmark.triangle" : icon}
              style={{ width: 28, height: 28 }}
              contentFit="contain"
              tintColor={isDenied ? colors.system.red : colors.primary}
            />
          </View>

          <Text
            style={{
              fontSize: 20,
              fontWeight: "700",
              color: colors.text.primary,
              textAlign: "center",
            }}
          >
            {title}
          </Text>

          <Text
            style={{
              fontSize: 15,
              color: colors.text.secondary,
              textAlign: "center",
              lineHeight: 22,
            }}
          >
            {description}
          </Text>

          <View style={{ gap: 10, width: "100%", marginTop: 8 }}>
            {isDenied ? (
              <Pressable
                onPress={handleOpenSettings}
                style={{
                  backgroundColor: colors.primary,
                  paddingVertical: 14,
                  borderRadius: 12,
                  borderCurve: "continuous",
                }}
              >
                <Text
                  style={{
                    fontSize: 16,
                    fontWeight: "600",
                    color: colors.text.inverse,
                    textAlign: "center",
                  }}
                >
                  Open Settings
                </Text>
              </Pressable>
            ) : (
              <Pressable
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  onAllow();
                }}
                style={{
                  backgroundColor: colors.primary,
                  paddingVertical: 14,
                  borderRadius: 12,
                  borderCurve: "continuous",
                }}
              >
                <Text
                  style={{
                    fontSize: 16,
                    fontWeight: "600",
                    color: colors.text.inverse,
                    textAlign: "center",
                  }}
                >
                  Allow Access
                </Text>
              </Pressable>
            )}

            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                onClose();
              }}
              style={{
                backgroundColor: colors.background.tertiary,
                paddingVertical: 14,
                borderRadius: 12,
                borderCurve: "continuous",
              }}
            >
              <Text
                style={{
                  fontSize: 16,
                  fontWeight: "600",
                  color: colors.text.secondary,
                  textAlign: "center",
                }}
              >
                {isDenied ? "Cancel" : "Not Now"}
              </Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
