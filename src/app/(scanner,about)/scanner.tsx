import { useCallback, useEffect, useRef } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import * as AC from "@bacons/apple-colors";
import {
  useBluetoothState,
  useBluetoothScanner,
  stopScan,
} from "expo-bluetooth";
import DeviceCard from "@/components/device-card";
import StateBadge from "@/components/state-badge";

export default function ScannerScreen() {
  const router = useRouter();
  const btState = useBluetoothState();
  const { devices, scanning, scan, stop } = useBluetoothScanner();
  const prevCountRef = useRef(0);
  const isPoweredOn = btState === "poweredOn";

  // Haptic feedback when new device appears
  useEffect(() => {
    if (devices.length > prevCountRef.current) {
      if (process.env.EXPO_OS === "ios") {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    }
    prevCountRef.current = devices.length;
  }, [devices.length]);

  // Stop scan on unmount
  useEffect(() => {
    return () => {
      stopScan();
    };
  }, []);

  const handleToggleScan = useCallback(() => {
    if (scanning) {
      stop();
    } else {
      scan();
    }
    if (process.env.EXPO_OS === "ios") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
  }, [scanning, scan, stop]);

  const namedDevices = devices.filter((d) => d.name);
  const unnamedDevices = devices.filter((d) => !d.name);

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={{ padding: 16, gap: 20, paddingBottom: 40 }}
    >
      {/* State + Scan Button */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <StateBadge state={btState} />

        <Pressable
          onPress={handleToggleScan}
          disabled={!isPoweredOn}
          style={({ pressed }) => ({
            flexDirection: "row",
            alignItems: "center",
            gap: 8,
            backgroundColor: scanning
              ? (AC.systemRed as any)
              : isPoweredOn
              ? (AC.systemBlue as any)
              : (AC.quaternarySystemFill as any),
            paddingHorizontal: 18,
            paddingVertical: 10,
            borderRadius: 22,
            borderCurve: "continuous",
            opacity: pressed ? 0.8 : 1,
          })}
        >
          {scanning ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <Image
              source="sf:magnifyingglass"
              style={{ width: 16, height: 16, tintColor: "white" }}
            />
          )}
          <Text style={{ color: "white", fontSize: 15, fontWeight: "600" }}>
            {scanning ? "Stop" : "Scan"}
          </Text>
        </Pressable>
      </View>

      {/* Not powered on message */}
      {!isPoweredOn && (
        <View
          style={{
            backgroundColor: AC.secondarySystemGroupedBackground as any,
            borderRadius: 14,
            borderCurve: "continuous",
            padding: 24,
            alignItems: "center",
            gap: 12,
          }}
        >
          <Image
            source="sf:antenna.radiowaves.left.and.right.slash"
            style={{ width: 40, height: 40, tintColor: AC.systemOrange as any }}
          />
          <Text
            style={{
              fontSize: 17,
              fontWeight: "600",
              color: AC.label as any,
              textAlign: "center",
            }}
          >
            Bluetooth Unavailable
          </Text>
          <Text
            style={{
              fontSize: 14,
              color: AC.secondaryLabel as any,
              textAlign: "center",
              lineHeight: 20,
            }}
          >
            Enable Bluetooth in Settings to scan for nearby BLE devices. This
            app requires a custom dev client build with the native Bluetooth
            module.
          </Text>
        </View>
      )}

      {/* Scanning empty state */}
      {isPoweredOn && devices.length === 0 && !scanning && (
        <View
          style={{
            backgroundColor: AC.secondarySystemGroupedBackground as any,
            borderRadius: 14,
            borderCurve: "continuous",
            padding: 32,
            alignItems: "center",
            gap: 12,
          }}
        >
          <Image
            source="sf:antenna.radiowaves.left.and.right"
            style={{ width: 44, height: 44, tintColor: AC.tertiaryLabel as any }}
          />
          <Text
            style={{
              fontSize: 17,
              fontWeight: "600",
              color: AC.label as any,
              textAlign: "center",
            }}
          >
            Ready to Scan
          </Text>
          <Text
            style={{
              fontSize: 14,
              color: AC.secondaryLabel as any,
              textAlign: "center",
              lineHeight: 20,
            }}
          >
            Tap the Scan button to discover nearby Bluetooth Low Energy devices.
          </Text>
        </View>
      )}

      {/* Scanning with no results yet */}
      {scanning && devices.length === 0 && (
        <View
          style={{
            backgroundColor: AC.secondarySystemGroupedBackground as any,
            borderRadius: 14,
            borderCurve: "continuous",
            padding: 32,
            alignItems: "center",
            gap: 12,
          }}
        >
          <ActivityIndicator
            size="large"
            color={AC.systemBlue as any}
          />
          <Text
            style={{
              fontSize: 15,
              color: AC.secondaryLabel as any,
              textAlign: "center",
            }}
          >
            Searching for nearby devices...
          </Text>
        </View>
      )}

      {/* Device count */}
      {devices.length > 0 && (
        <Text
          style={{
            fontSize: 13,
            fontWeight: "600",
            color: AC.secondaryLabel as any,
            textTransform: "uppercase",
            letterSpacing: 0.5,
          }}
        >
          {devices.length} Device{devices.length !== 1 ? "s" : ""} Found
        </Text>
      )}

      {/* Named devices */}
      {namedDevices.length > 0 && (
        <View style={{ gap: 8 }}>
          <Text
            style={{
              fontSize: 12,
              fontWeight: "600",
              color: AC.tertiaryLabel as any,
              textTransform: "uppercase",
              letterSpacing: 0.5,
            }}
          >
            Named Devices
          </Text>
          {namedDevices
            .sort((a, b) => (b.rssi ?? -100) - (a.rssi ?? -100))
            .map((device) => (
              <DeviceCard
                key={device.id}
                device={device}
                onPress={() =>
                  router.push({
                    pathname: "/device/[id]",
                    params: { id: device.id, name: device.name ?? "Unknown" },
                  })
                }
              />
            ))}
        </View>
      )}

      {/* Unnamed devices */}
      {unnamedDevices.length > 0 && (
        <View style={{ gap: 8 }}>
          <Text
            style={{
              fontSize: 12,
              fontWeight: "600",
              color: AC.tertiaryLabel as any,
              textTransform: "uppercase",
              letterSpacing: 0.5,
            }}
          >
            Other Devices ({unnamedDevices.length})
          </Text>
          {unnamedDevices
            .sort((a, b) => (b.rssi ?? -100) - (a.rssi ?? -100))
            .map((device) => (
              <DeviceCard
                key={device.id}
                device={device}
                onPress={() =>
                  router.push({
                    pathname: "/device/[id]",
                    params: { id: device.id, name: "Unknown" },
                  })
                }
              />
            ))}
        </View>
      )}
    </ScrollView>
  );
}
