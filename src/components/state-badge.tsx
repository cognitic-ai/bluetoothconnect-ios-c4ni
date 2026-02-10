import { Text, View } from "react-native";
import { Image } from "expo-image";
import * as AC from "@bacons/apple-colors";
import type { BluetoothState } from "expo-bluetooth";

const stateConfig: Record<
  BluetoothState,
  { label: string; color: string; icon: string }
> = {
  poweredOn: { label: "Powered On", color: AC.systemGreen as any, icon: "sf:checkmark.circle.fill" },
  poweredOff: { label: "Powered Off", color: AC.systemRed as any, icon: "sf:xmark.circle.fill" },
  unauthorized: { label: "Unauthorized", color: AC.systemOrange as any, icon: "sf:lock.circle.fill" },
  unsupported: { label: "Unsupported", color: AC.systemRed as any, icon: "sf:exclamationmark.triangle.fill" },
  resetting: { label: "Resetting", color: AC.systemYellow as any, icon: "sf:arrow.triangle.2.circlepath" },
  unknown: { label: "Unknown", color: AC.quaternaryLabel as any, icon: "sf:questionmark.circle.fill" },
};

export default function StateBadge({ state }: { state: BluetoothState }) {
  const config = stateConfig[state] ?? stateConfig.unknown;

  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        backgroundColor: AC.tertiarySystemFill as any,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        borderCurve: "continuous",
        alignSelf: "flex-start",
      }}
    >
      <Image
        source={config.icon}
        style={{ width: 16, height: 16, tintColor: config.color }}
      />
      <Text
        style={{
          fontSize: 13,
          fontWeight: "600",
          color: config.color,
        }}
      >
        {config.label}
      </Text>
    </View>
  );
}
