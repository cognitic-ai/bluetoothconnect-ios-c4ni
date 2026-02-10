import { useMemo } from "react";
import Stack from "expo-router/stack";
import { NativeStackNavigationOptions } from "@react-navigation/native-stack";
import { isLiquidGlassAvailable } from "expo-glass-effect";
import * as AC from "@bacons/apple-colors";

const AppleStackPreset: NativeStackNavigationOptions =
  process.env.EXPO_OS !== "ios"
    ? {}
    : isLiquidGlassAvailable()
    ? {
        headerTransparent: true,
        headerShadowVisible: false,
        headerLargeTitleShadowVisible: false,
        headerLargeStyle: { backgroundColor: "transparent" },
        headerTitleStyle: { color: AC.label as any },
        headerBlurEffect: "none",
        headerBackButtonDisplayMode: "minimal",
      }
    : {
        headerTransparent: true,
        headerShadowVisible: true,
        headerLargeTitleShadowVisible: false,
        headerLargeStyle: { backgroundColor: "transparent" },
        headerBlurEffect: "systemChromeMaterial",
        headerBackButtonDisplayMode: "default",
      };

export const unstable_settings = {
  scanner: { anchor: "scanner" },
  about: { anchor: "about" },
};

export default function GroupLayout({ segment }: { segment: string }) {
  const screen = segment.match(/\((.*)\)/)?.[1]!;

  const options = useMemo(() => {
    switch (screen) {
      case "scanner":
        return { title: "BLE Scanner", headerLargeTitle: true };
      case "about":
        return { title: "About", headerLargeTitle: true };
      default:
        return {};
    }
  }, [screen]);

  return (
    <Stack screenOptions={AppleStackPreset}>
      <Stack.Screen name={screen} options={options} />
      <Stack.Screen
        name="device/[id]"
        options={{ title: "Device", headerLargeTitle: false }}
      />
    </Stack>
  );
}
