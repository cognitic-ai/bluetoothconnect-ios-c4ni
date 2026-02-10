import { ThemeProvider } from "@/components/theme-provider";
import { NativeTabs } from "expo-router/unstable-native-tabs";
import { Platform } from "react-native";

export default function Layout() {
  return (
    <ThemeProvider>
      <NativeTabs>
        <NativeTabs.Trigger name="(scanner)">
          <NativeTabs.Trigger.Label>Scanner</NativeTabs.Trigger.Label>
          <NativeTabs.Trigger.Icon
            {...Platform.select({
              ios: {
                sf: { default: "antenna.radiowaves.left.and.right", selected: "antenna.radiowaves.left.and.right" },
              },
              default: { src: require("@expo/vector-icons/MaterialIcons").default },
            })}
          />
        </NativeTabs.Trigger>
        <NativeTabs.Trigger name="(about)">
          <NativeTabs.Trigger.Label>About</NativeTabs.Trigger.Label>
          <NativeTabs.Trigger.Icon
            {...Platform.select({
              ios: {
                sf: { default: "info.circle", selected: "info.circle.fill" },
              },
              default: { src: require("@expo/vector-icons/MaterialIcons").default },
            })}
          />
        </NativeTabs.Trigger>
      </NativeTabs>
    </ThemeProvider>
  );
}
