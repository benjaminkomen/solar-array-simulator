import { View, Text } from "react-native";
import { Image } from "expo-image";
import { useSafeAreaInsets } from "react-native-safe-area-context";

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

  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        paddingTop: insets.top + 50,
        paddingBottom: 16,
        paddingHorizontal: 24,
        backgroundColor: "#ffffff",
        borderBottomWidth: 1,
        borderBottomColor: "#f3f4f6",
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
                  backgroundColor: isCompleted || isCurrent ? "#6366f1" : "#ffffff",
                  borderWidth: isFuture ? 2 : 0,
                  borderColor: "#d1d5db",
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                {isCompleted ? (
                  <Image
                    source="sf:checkmark"
                    style={{ width: 16, height: 16 }}
                    contentFit="contain"
                    tintColor="#ffffff"
                  />
                ) : (
                  <Text
                    style={{
                      fontSize: 14,
                      fontWeight: "600",
                      color: isCurrent ? "#ffffff" : "#9ca3af",
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
                  color: isCurrent ? "#6366f1" : isCompleted ? "#374151" : "#9ca3af",
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
                  backgroundColor: stepNumber < currentStep ? "#6366f1" : "#e5e7eb",
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
