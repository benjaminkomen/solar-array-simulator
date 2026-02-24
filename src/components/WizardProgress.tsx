import {View, Text, Platform} from "react-native";
import { Image } from "expo-image";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/utils/theme";

interface WizardProgressProps {
  currentStep: 1 | 2 | 3;
}

const STEPS = [
  { label: "Configure", icon: "sf:slider.horizontal.3" },
  { label: "Photo", icon: "sf:camera" },
  { label: "Layout", icon: "sf:square.grid.2x2" },
] as const;

export function WizardProgress({ currentStep }: WizardProgressProps) {
  const insets = useSafeAreaInsets();
  const colors = useColors();

  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        paddingTop: Platform.OS === 'android' ? insets.top + 60 : insets.top + 50,
        paddingBottom: 16,
        paddingHorizontal: 24,
        backgroundColor: colors.background.primary,
        borderBottomWidth: 1,
        borderBottomColor: colors.background.tertiary,
      }}
    >
      {STEPS.map((step, index) => {
        const stepNumber = index + 1;
        const isCompleted = stepNumber < currentStep;
        const isCurrent = stepNumber === currentStep;
        const isFuture = stepNumber > currentStep;

        return (
          <View
            key={step.label}
            style={{
              flexDirection: "row",
              alignItems: "center",
            }}
          >
            {/* Step circle */}
            <View style={{ alignItems: "center", gap: 4 }}>
              <View
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 16,
                  backgroundColor: isCompleted || isCurrent ? colors.primary : colors.background.primary,
                  borderWidth: isFuture ? 2 : 0,
                  borderColor: colors.border.medium,
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                {isCompleted ? (
                  Platform.OS === 'android' ? (
                    <Text style={{ fontSize: 14, fontWeight: '700', color: colors.text.inverse }}>✓</Text>
                  ) : (
                    <Image
                      source="sf:checkmark"
                      style={{ width: 16, height: 16 }}
                      contentFit="contain"
                      tintColor={colors.text.inverse}
                    />
                  )
                ) : (
                  <Text
                    style={{
                      fontSize: 14,
                      fontWeight: "600",
                      color: isCurrent ? colors.text.inverse : colors.text.tertiary,
                    }}
                  >
                    {stepNumber}
                  </Text>
                )}
              </View>
              <Text
                style={{
                  fontSize: 11,
                  fontWeight: isCurrent ? "600" : "400",
                  color: isCurrent ? colors.primary : isCompleted ? colors.text.primary : colors.text.tertiary,
                }}
              >
                {step.label}
              </Text>
            </View>

            {/* Connector line (except after last step) */}
            {index < STEPS.length - 1 && (
              <View
                style={{
                  width: 40,
                  height: 2,
                  backgroundColor: stepNumber < currentStep ? colors.primary : colors.border.light,
                  marginHorizontal: 8,
                  marginBottom: 20,
                }}
              />
            )}
          </View>
        );
      })}
    </View>
  );
}
