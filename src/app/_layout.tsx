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
              headerTransparent: Platform.OS === "ios",
              ...(Platform.OS === "android" && {
                headerStyle: { backgroundColor: colors.background.primary },
                headerTintColor: colors.primary,
              }),
              ...(Platform.OS === "ios" && {
                headerTintColor: colors.text.primary,
              }),
            }}
          >
            <Stack.Screen name="index" options={{
              title: "",
              headerTransparent: true,
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
                headerTransparent: true,
              }}
            />
            <Stack.Screen
              name="panel-details"
              options={{
                ...Platform.select({
                  ios: {
                    presentation: "formSheet",
                    sheetGrabberVisible: true,
                    contentStyle: {backgroundColor: "transparent"},
                  },
                  android: {
                    presentation: "modal",
                  },
                }),
                title: "Panel Details",
              }}
            />
            <Stack.Screen
              name="inverter-details"
              options={{
                ...Platform.select({
                  ios: {
                    presentation: "formSheet",
                    sheetGrabberVisible: true,
                    contentStyle: {backgroundColor: "transparent"},
                  },
                  android: {
                    presentation: "modal",
                  },
                }),
                title: "Inverter Details",
              }}
            />
            <Stack.Screen
              name="compass-help"
              options={{
                ...Platform.select({
                  ios: {
                    presentation: "formSheet",
                    sheetGrabberVisible: true,
                    contentStyle: {backgroundColor: "transparent"},
                  },
                  android: {
                    presentation: "modal",
                  },
                }),
                title: "",
                headerShown: false,
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
