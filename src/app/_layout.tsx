import { Stack } from "expo-router";
import { GestureHandlerRootView } from "react-native-gesture-handler";

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
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
          name="inverter/[id]"
          options={{
            title: "Micro-inverter",
            headerBackTitle: "",
          }}
        />
      </Stack>
    </GestureHandlerRootView>
  );
}
