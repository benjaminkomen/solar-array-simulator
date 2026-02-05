import { Stack } from "expo-router";

export default function RootLayout() {
  return (
    <Stack
      screenOptions={{
        headerTransparent: true,
      }}
    >
      <Stack.Screen name="index" />
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
    </Stack>
  );
}
