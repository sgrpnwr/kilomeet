import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import "react-native-reanimated";

import { useColorScheme } from "@/hooks/use-color-scheme";
import { AuthProvider, useAuth } from "@/context/AuthContext";

function RootNavigator() {
  const { user, isLoading } = useAuth();

  if (isLoading) return null;

  return (
    <Stack>
      <Stack.Protected guard={!!user}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="modal"
          options={{ presentation: "modal", title: "Modal" }}
        />
        
        <Stack.Screen
          name="explore"
          options={{
            presentation: "formSheet",
            headerShown: false,
            sheetAllowedDetents: [0.9],
            sheetGrabberVisible: false,
            contentStyle: { backgroundColor: '#0b0b0c' },
          }}
        />
        <Stack.Screen name="track" options={{ headerShown: false }} />
        <Stack.Screen name="user/[id]" options={{ headerShown: false }} />
      </Stack.Protected>

      <Stack.Protected guard={!user}>
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      </Stack.Protected>
    </Stack>
  );
}

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
      <AuthProvider>
        <RootNavigator />
        <StatusBar style="auto" />
      </AuthProvider>
    </ThemeProvider>
  );
}
