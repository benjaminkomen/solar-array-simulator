import { useEffect } from "react";
import { Platform, useColorScheme } from "react-native";
import { Stack, ThemeProvider } from "expo-router";
import * as SystemUI from "expo-system-ui";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { PanelsProvider } from "@/contexts/PanelsContext";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { useColors, useNavigationTheme } from "@/utils/theme";
import { Observe, ObserveRoot } from "expo-observe";

Observe.configure({
  integrations: { "expo-router": true },
  dispatchInDebug: true,
});

function RootLayout() {
  const colors = useColors();
  const colorScheme = useColorScheme();
  const navigationTheme = useNavigationTheme();

  // Keep the Android window/navigation-bar background aligned with the
  // Material You surface so there's no light flash and the system bars blend
  // into the app. No-op on iOS/web.
  const surface = colors.background.primary as string;
  useEffect(() => {
    if (Platform.OS === "android") {
      SystemUI.setBackgroundColorAsync(surface);
    }
  }, [surface]);

  return (
    <GestureHandlerRootView style={{flex: 1}}>
      <ErrorBoundary>
        <PanelsProvider>
          <ThemeProvider value={navigationTheme}>
          <Stack
            screenOptions={{
              headerTransparent: true,
              headerTintColor: colors.text.primary,
              statusBarStyle: colorScheme === 'dark' ? 'light' : 'dark',
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
          </ThemeProvider>
        </PanelsProvider>
      </ErrorBoundary>
    </GestureHandlerRootView>
  );
}

export default ObserveRoot.wrap(RootLayout);
