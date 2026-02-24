import { Platform } from "react-native";
import { Stack } from "expo-router";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { PanelsProvider } from "@/contexts/PanelsContext";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { useColors } from "@/utils/theme";

export default function RootLayout() {
  const colors = useColors();

  return (
    <GestureHandlerRootView style={{flex: 1}}>
      <ErrorBoundary>
        <PanelsProvider>
          <Stack
            screenOptions={{
              headerTransparent: true,
              headerTintColor: colors.text.primary,
            }}
          >
            <Stack.Screen name="index" options={{
              title: "",
            }}/>
            <Stack.Screen
              name="config"
              options={{
                title: "Configuration",
                headerBackTitle: "",
              }}
            />
            <Stack.Screen
              name="upload"
              options={{
                title: "",
              }}
            />
            <Stack.Screen
              name="analyze"
              options={{
                title: "",
              }}
            />
            <Stack.Screen
              name="custom"
              options={{
                title: "",
              }}
            />
            <Stack.Screen
              name="panel-details"
              options={{
                presentation: Platform.OS === 'ios' ? "formSheet" : "transparentModal",
                headerShown: Platform.OS !== 'android',
                sheetGrabberVisible: Platform.OS === 'ios',
                title: "Panel Details",
                contentStyle: Platform.OS === 'ios' ? { backgroundColor: "transparent" } : undefined,
              }}
            />
            <Stack.Screen
              name="inverter-details"
              options={{
                presentation: Platform.OS === 'ios' ? "formSheet" : "transparentModal",
                headerShown: Platform.OS !== 'android',
                sheetGrabberVisible: Platform.OS === 'ios',
                title: "Inverter Details",
                contentStyle: Platform.OS === 'ios' ? { backgroundColor: "transparent" } : undefined,
              }}
            />
            <Stack.Screen
              name="compass-help"
              options={{
                presentation: Platform.OS === 'ios' ? "formSheet" : "transparentModal",
                headerShown: false,
                sheetGrabberVisible: Platform.OS === 'ios',
                title: "",
                contentStyle: Platform.OS === 'ios' ? { backgroundColor: "transparent" } : undefined,
              }}
            />
            <Stack.Screen
              name="production"
              options={{
                title: "",
                headerBackVisible: false,
                headerTransparent: true,
              }}
            />
            <Stack.Screen
              name="simulation"
              options={{
                title: "Simulation",
                headerBackTitle: "",
              }}
            />
          </Stack>
        </PanelsProvider>
      </ErrorBoundary>
    </GestureHandlerRootView>
  );
}
