import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { Image } from "expo-image";
import { Stack, useLocalSearchParams } from "expo-router";
import * as Haptics from "expo-haptics";
import * as AC from "@bacons/apple-colors";
import ExpoBluetooth, {
  connect,
  disconnect,
  discoverServices,
  discoverCharacteristics,
  readCharacteristic,
  subscribeToCharacteristic,
  unsubscribeFromCharacteristic,
} from "expo-bluetooth";
import type {
  BluetoothService,
  BluetoothCharacteristic,
} from "expo-bluetooth";

type ConnectionState = "disconnected" | "connecting" | "connected";

export default function DeviceDetailScreen() {
  const { id, name } = useLocalSearchParams<{ id: string; name: string }>();
  const [connectionState, setConnectionState] =
    useState<ConnectionState>("disconnected");
  const [services, setServices] = useState<BluetoothService[]>([]);
  const [characteristics, setCharacteristics] = useState<
    Record<string, BluetoothCharacteristic[]>
  >({});
  const [expandedService, setExpandedService] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const serviceSub = ExpoBluetooth.addListener(
      "onServicesDiscovered",
      (event) => {
        setServices(event.services);
        // Auto-discover characteristics for each service
        for (const svc of event.services) {
          discoverCharacteristics(svc.uuid);
        }
      }
    );

    const charSub = ExpoBluetooth.addListener(
      "onCharacteristicsDiscovered",
      (event) => {
        setCharacteristics((prev) => ({
          ...prev,
          [event.serviceUUID]: event.characteristics,
        }));
      }
    );

    const disconnectSub = ExpoBluetooth.addListener("onDisconnected", () => {
      setConnectionState("disconnected");
      setServices([]);
      setCharacteristics({});
    });

    const valueSub = ExpoBluetooth.addListener(
      "onCharacteristicValueUpdated",
      (char) => {
        setCharacteristics((prev) => {
          const updated = { ...prev };
          const list = updated[char.serviceUUID];
          if (list) {
            updated[char.serviceUUID] = list.map((c) =>
              c.uuid === char.uuid ? char : c
            );
          }
          return updated;
        });
      }
    );

    return () => {
      serviceSub.remove();
      charSub.remove();
      disconnectSub.remove();
      valueSub.remove();
      disconnect().catch(() => {});
    };
  }, []);

  const handleConnect = useCallback(async () => {
    try {
      setError(null);
      setConnectionState("connecting");
      await connect(id);
      setConnectionState("connected");
      if (process.env.EXPO_OS === "ios") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      discoverServices();
    } catch (err: any) {
      setConnectionState("disconnected");
      setError(err.message ?? "Connection failed");
      if (process.env.EXPO_OS === "ios") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    }
  }, [id]);

  const handleDisconnect = useCallback(async () => {
    try {
      await disconnect();
      setConnectionState("disconnected");
    } catch (err: any) {
      setError(err.message ?? "Disconnect failed");
    }
  }, []);

  const handleReadCharacteristic = useCallback(
    async (serviceUUID: string, charUUID: string) => {
      try {
        await readCharacteristic(serviceUUID, charUUID);
      } catch {}
    },
    []
  );

  const handleToggleNotify = useCallback(
    (serviceUUID: string, char: BluetoothCharacteristic) => {
      if (char.isNotifying) {
        unsubscribeFromCharacteristic(serviceUUID, char.uuid);
      } else {
        subscribeToCharacteristic(serviceUUID, char.uuid);
      }
      if (process.env.EXPO_OS === "ios") {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    },
    []
  );

  return (
    <>
      <Stack.Screen options={{ title: name ?? "Device" }} />
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={{ padding: 16, gap: 20, paddingBottom: 40 }}
      >
        {/* Device Header Card */}
        <View
          style={{
            backgroundColor: AC.secondarySystemGroupedBackground as any,
            borderRadius: 16,
            borderCurve: "continuous",
            padding: 20,
            gap: 16,
            alignItems: "center",
          }}
        >
          <View
            style={{
              width: 64,
              height: 64,
              borderRadius: 18,
              borderCurve: "continuous",
              backgroundColor: AC.tertiarySystemFill as any,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Image
              source={
                connectionState === "connected"
                  ? "sf:wave.3.right.circle.fill"
                  : "sf:wave.3.right.circle"
              }
              style={{
                width: 34,
                height: 34,
                tintColor:
                  connectionState === "connected"
                    ? (AC.systemGreen as any)
                    : (AC.tertiaryLabel as any),
              }}
            />
          </View>

          <View style={{ alignItems: "center", gap: 4 }}>
            <Text
              selectable
              style={{
                fontSize: 20,
                fontWeight: "700",
                color: AC.label as any,
              }}
            >
              {name ?? "Unknown Device"}
            </Text>
            <Text
              selectable
              style={{
                fontSize: 12,
                color: AC.secondaryLabel as any,
                fontFamily: "Menlo",
              }}
            >
              {id}
            </Text>
          </View>

          {/* Connection Status */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 6,
              backgroundColor: AC.tertiarySystemFill as any,
              paddingHorizontal: 12,
              paddingVertical: 6,
              borderRadius: 16,
              borderCurve: "continuous",
            }}
          >
            <View
              style={{
                width: 8,
                height: 8,
                borderRadius: 4,
                backgroundColor:
                  connectionState === "connected"
                    ? (AC.systemGreen as any)
                    : connectionState === "connecting"
                    ? (AC.systemOrange as any)
                    : (AC.systemRed as any),
              }}
            />
            <Text
              style={{
                fontSize: 13,
                fontWeight: "500",
                color: AC.secondaryLabel as any,
                textTransform: "capitalize",
              }}
            >
              {connectionState}
            </Text>
          </View>

          {/* Connect / Disconnect Button */}
          <Pressable
            onPress={
              connectionState === "connected"
                ? handleDisconnect
                : handleConnect
            }
            disabled={connectionState === "connecting"}
            style={({ pressed }) => ({
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              backgroundColor:
                connectionState === "connected"
                  ? (AC.systemRed as any)
                  : (AC.systemBlue as any),
              paddingHorizontal: 24,
              paddingVertical: 12,
              borderRadius: 24,
              borderCurve: "continuous",
              width: "100%",
              opacity: pressed || connectionState === "connecting" ? 0.7 : 1,
            })}
          >
            {connectionState === "connecting" ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <Image
                source={
                  connectionState === "connected"
                    ? "sf:xmark.circle.fill"
                    : "sf:link.circle.fill"
                }
                style={{ width: 18, height: 18, tintColor: "white" }}
              />
            )}
            <Text style={{ color: "white", fontSize: 16, fontWeight: "600" }}>
              {connectionState === "connected"
                ? "Disconnect"
                : connectionState === "connecting"
                ? "Connecting..."
                : "Connect"}
            </Text>
          </Pressable>
        </View>

        {/* Error */}
        {error && (
          <View
            style={{
              backgroundColor: AC.secondarySystemGroupedBackground as any,
              borderRadius: 12,
              borderCurve: "continuous",
              padding: 14,
              flexDirection: "row",
              alignItems: "center",
              gap: 10,
            }}
          >
            <Image
              source="sf:exclamationmark.triangle.fill"
              style={{ width: 20, height: 20, tintColor: AC.systemRed as any }}
            />
            <Text
              selectable
              style={{
                flex: 1,
                fontSize: 14,
                color: AC.systemRed as any,
              }}
            >
              {error}
            </Text>
          </View>
        )}

        {/* Services */}
        {services.length > 0 && (
          <View style={{ gap: 10 }}>
            <Text
              style={{
                fontSize: 12,
                fontWeight: "600",
                color: AC.secondaryLabel as any,
                textTransform: "uppercase",
                letterSpacing: 0.5,
              }}
            >
              {services.length} Service{services.length !== 1 ? "s" : ""}
            </Text>

            {services.map((svc) => {
              const isExpanded = expandedService === svc.uuid;
              const chars = characteristics[svc.uuid] ?? [];

              return (
                <View key={svc.uuid}>
                  <Pressable
                    onPress={() =>
                      setExpandedService(isExpanded ? null : svc.uuid)
                    }
                    style={({ pressed }) => ({
                      backgroundColor: pressed
                        ? (AC.tertiarySystemFill as any)
                        : (AC.secondarySystemGroupedBackground as any),
                      borderRadius: 14,
                      borderCurve: "continuous",
                      padding: 14,
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 12,
                    })}
                  >
                    <Image
                      source="sf:shippingbox.fill"
                      style={{
                        width: 20,
                        height: 20,
                        tintColor: AC.systemIndigo as any,
                      }}
                    />
                    <View style={{ flex: 1 }}>
                      <Text
                        selectable
                        style={{
                          fontSize: 14,
                          fontWeight: "600",
                          color: AC.label as any,
                          fontFamily: "Menlo",
                        }}
                      >
                        {svc.uuid}
                      </Text>
                      <Text
                        style={{
                          fontSize: 12,
                          color: AC.tertiaryLabel as any,
                        }}
                      >
                        {svc.isPrimary ? "Primary" : "Secondary"} ·{" "}
                        {chars.length} characteristic
                        {chars.length !== 1 ? "s" : ""}
                      </Text>
                    </View>
                    <Image
                      source={
                        isExpanded ? "sf:chevron.up" : "sf:chevron.down"
                      }
                      style={{
                        width: 12,
                        height: 12,
                        tintColor: AC.tertiaryLabel as any,
                      }}
                    />
                  </Pressable>

                  {/* Expanded characteristics */}
                  {isExpanded && chars.length > 0 && (
                    <View style={{ gap: 6, paddingLeft: 16, paddingTop: 8 }}>
                      {chars.map((char) => (
                        <CharacteristicRow
                          key={char.uuid}
                          characteristic={char}
                          serviceUUID={svc.uuid}
                          onRead={() =>
                            handleReadCharacteristic(svc.uuid, char.uuid)
                          }
                          onToggleNotify={() =>
                            handleToggleNotify(svc.uuid, char)
                          }
                        />
                      ))}
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        )}

        {/* Connected, discovering services */}
        {connectionState === "connected" && services.length === 0 && (
          <View
            style={{
              backgroundColor: AC.secondarySystemGroupedBackground as any,
              borderRadius: 14,
              borderCurve: "continuous",
              padding: 24,
              alignItems: "center",
              gap: 10,
            }}
          >
            <ActivityIndicator size="small" color={AC.systemBlue as any} />
            <Text
              style={{
                fontSize: 14,
                color: AC.secondaryLabel as any,
              }}
            >
              Discovering services...
            </Text>
          </View>
        )}
      </ScrollView>
    </>
  );
}

function CharacteristicRow({
  characteristic,
  serviceUUID,
  onRead,
  onToggleNotify,
}: {
  characteristic: BluetoothCharacteristic;
  serviceUUID: string;
  onRead: () => void;
  onToggleNotify: () => void;
}) {
  const canRead = characteristic.properties.includes("read");
  const canNotify =
    characteristic.properties.includes("notify") ||
    characteristic.properties.includes("indicate");

  return (
    <View
      style={{
        backgroundColor: AC.tertiarySystemGroupedBackground as any,
        borderRadius: 12,
        borderCurve: "continuous",
        padding: 12,
        gap: 8,
      }}
    >
      <Text
        selectable
        style={{
          fontSize: 12,
          fontWeight: "600",
          color: AC.label as any,
          fontFamily: "Menlo",
        }}
      >
        {characteristic.uuid}
      </Text>

      {/* Properties */}
      <View style={{ flexDirection: "row", gap: 4, flexWrap: "wrap" }}>
        {characteristic.properties.map((prop) => (
          <View
            key={prop}
            style={{
              backgroundColor: AC.quaternarySystemFill as any,
              paddingHorizontal: 8,
              paddingVertical: 3,
              borderRadius: 8,
              borderCurve: "continuous",
            }}
          >
            <Text
              style={{
                fontSize: 11,
                fontWeight: "500",
                color: AC.secondaryLabel as any,
              }}
            >
              {prop}
            </Text>
          </View>
        ))}
      </View>

      {/* Value */}
      {characteristic.value && (
        <View
          style={{
            backgroundColor: AC.quaternarySystemFill as any,
            borderRadius: 8,
            borderCurve: "continuous",
            padding: 8,
          }}
        >
          <Text
            selectable
            style={{
              fontSize: 12,
              color: AC.label as any,
              fontFamily: "Menlo",
            }}
          >
            {characteristic.value}
          </Text>
        </View>
      )}

      {/* Actions */}
      <View style={{ flexDirection: "row", gap: 8 }}>
        {canRead && (
          <Pressable
            onPress={onRead}
            style={({ pressed }) => ({
              flexDirection: "row",
              alignItems: "center",
              gap: 4,
              backgroundColor: AC.systemBlue as any,
              paddingHorizontal: 12,
              paddingVertical: 6,
              borderRadius: 14,
              borderCurve: "continuous",
              opacity: pressed ? 0.7 : 1,
            })}
          >
            <Image
              source="sf:arrow.down.circle.fill"
              style={{ width: 14, height: 14, tintColor: "white" }}
            />
            <Text
              style={{ color: "white", fontSize: 12, fontWeight: "600" }}
            >
              Read
            </Text>
          </Pressable>
        )}
        {canNotify && (
          <Pressable
            onPress={onToggleNotify}
            style={({ pressed }) => ({
              flexDirection: "row",
              alignItems: "center",
              gap: 4,
              backgroundColor: characteristic.isNotifying
                ? (AC.systemOrange as any)
                : (AC.systemGreen as any),
              paddingHorizontal: 12,
              paddingVertical: 6,
              borderRadius: 14,
              borderCurve: "continuous",
              opacity: pressed ? 0.7 : 1,
            })}
          >
            <Image
              source={
                characteristic.isNotifying
                  ? "sf:bell.slash.fill"
                  : "sf:bell.fill"
              }
              style={{ width: 14, height: 14, tintColor: "white" }}
            />
            <Text
              style={{ color: "white", fontSize: 12, fontWeight: "600" }}
            >
              {characteristic.isNotifying ? "Unsubscribe" : "Subscribe"}
            </Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}
