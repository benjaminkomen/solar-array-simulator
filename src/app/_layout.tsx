import { Stack } from "expo-router";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { PanelsProvider } from "@/contexts/PanelsContext";

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <PanelsProvider>
        <Stack
        screenOptions={{
          headerTransparent: true,
        }}
      >
        <Stack.Screen name="index" />
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
          name="link-inverter"
          options={{
            presentation: "formSheet",
            sheetGrabberVisible: true,
            sheetAllowedDetents: [0.6, 1.0],
            title: "Link Inverter",
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
      </Stack>
      </PanelsProvider>
    </GestureHandlerRootView>
  );
}
