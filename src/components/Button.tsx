import { Pressable, Text, StyleSheet, ViewStyle } from "react-native";
import { useColors } from "@/utils/theme";

type ButtonVariant = "filled" | "outlined" | "text";

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  disabled?: boolean;
  style?: ViewStyle;
  testID?: string;
}

export function Button({
  title,
  onPress,
  variant = "filled",
  disabled,
  style,
  testID,
}: ButtonProps) {
  const colors = useColors();

  const buttonStyles: ViewStyle =
    {
      filled: { backgroundColor: colors.primary },
      outlined: {
        backgroundColor: "transparent",
        borderWidth: 1,
        borderColor: colors.primary,
      },
      text: { backgroundColor: "transparent" },
    }[variant];

  const textColor = variant === "filled" ? colors.text.inverse : colors.primary;

  return (
    <Pressable
      testID={testID}
      onPress={onPress}
      disabled={disabled}
      style={[styles.button, buttonStyles, disabled && styles.disabled, style]}
    >
      <Text style={[styles.text, { color: textColor }]}>{title}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: "center",
  },
  text: {
    fontSize: 17,
    fontWeight: "600",
  },
  disabled: {
    opacity: 0.5,
  },
});
