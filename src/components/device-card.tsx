import { Pressable, Text, View } from "react-native";
import { Image } from "expo-image";
import * as AC from "@bacons/apple-colors";
import type { BluetoothDevice } from "expo-bluetooth";

function signalStrength(rssi: number | null): {
  label: string;
  color: string;
  icon: string;
} {
  if (rssi == null) return { label: "N/A", color: AC.quaternaryLabel as any, icon: "sf:wifi.slash" };
  if (rssi >= -50) return { label: "Excellent", color: AC.systemGreen as any, icon: "sf:wifi" };
  if (rssi >= -70) return { label: "Good", color: AC.systemBlue as any, icon: "sf:wifi" };
  if (rssi >= -85) return { label: "Fair", color: AC.systemOrange as any, icon: "sf:wifi.exclamationmark" };
  return { label: "Weak", color: AC.systemRed as any, icon: "sf:wifi.exclamationmark" };
}

export default function DeviceCard({
  device,
  onPress,
}: {
  device: BluetoothDevice;
  onPress: () => void;
}) {
  const signal = signalStrength(device.rssi);

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        backgroundColor: pressed
          ? (AC.tertiarySystemFill as any)
          : (AC.secondarySystemGroupedBackground as any),
        borderRadius: 14,
        borderCurve: "continuous",
        padding: 16,
        gap: 10,
        flexDirection: "row",
        alignItems: "center",
      })}
    >
      <View
        style={{
          width: 44,
          height: 44,
          borderRadius: 12,
          borderCurve: "continuous",
          backgroundColor: AC.tertiarySystemFill as any,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Image
          source="sf:wave.3.right.circle.fill"
          style={{ width: 24, height: 24, tintColor: AC.systemBlue as any }}
        />
      </View>

      <View style={{ flex: 1, gap: 2 }}>
        <Text
          selectable
          style={{
            fontSize: 16,
            fontWeight: "600",
            color: AC.label as any,
          }}
          numberOfLines={1}
        >
          {device.name ?? "Unknown Device"}
        </Text>
        <Text
          selectable
          style={{
            fontSize: 12,
            color: AC.secondaryLabel as any,
            fontFamily: "Menlo",
          }}
          numberOfLines={1}
        >
          {device.id}
        </Text>
      </View>

      <View style={{ alignItems: "flex-end", gap: 2 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
          <Image
            source={signal.icon}
            style={{ width: 14, height: 14, tintColor: signal.color }}
          />
          <Text
            style={{
              fontSize: 13,
              fontWeight: "500",
              fontVariant: ["tabular-nums"],
              color: signal.color,
            }}
          >
            {device.rssi != null ? `${device.rssi} dBm` : "—"}
          </Text>
        </View>
        <Text style={{ fontSize: 11, color: AC.tertiaryLabel as any }}>
          {signal.label}
        </Text>
      </View>

      <Image
        source="sf:chevron.right"
        style={{
          width: 12,
          height: 12,
          tintColor: AC.tertiaryLabel as any,
          marginLeft: 4,
        }}
      />
    </Pressable>
  );
}
