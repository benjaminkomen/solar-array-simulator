import { Stack } from "expo-router";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { PanelsProvider } from "@/contexts/PanelsContext";
import { useColors } from "@/utils/theme";

export default function RootLayout() {
  const colors = useColors();

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <PanelsProvider>
        <Stack
        screenOptions={{
          headerTransparent: true,
          headerTintColor: colors.text.primary,
        }}
      >
        <Stack.Screen name="index" options={{
          title: "",
        }} />
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
          name="custom"
          options={{
            title: "",
          }}
        />
        <Stack.Screen
          name="panel-details"
          options={{
            presentation: "formSheet",
            sheetGrabberVisible: true,
            title: "Panel Details",
            contentStyle: { backgroundColor: "transparent" },
          }}
        />
        <Stack.Screen
          name="production"
          options={{
            title: "",
            headerBackTitle: "",
            headerTransparent: true,
          }}
        />
        <Stack.Screen
          name="debug"
          options={{
            title: "Debug Tools",
          }}
        />
      </Stack>
      </PanelsProvider>
    </GestureHandlerRootView>
  );
}
