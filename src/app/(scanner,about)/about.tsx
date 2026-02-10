import { ScrollView, Text, View } from "react-native";
import { Image } from "expo-image";
import * as AC from "@bacons/apple-colors";
import { useBluetoothState } from "expo-bluetooth";
import StateBadge from "@/components/state-badge";

function InfoRow({
  icon,
  title,
  value,
  tint,
}: {
  icon: string;
  title: string;
  value: string;
  tint?: string;
}) {
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        paddingVertical: 12,
        paddingHorizontal: 16,
      }}
    >
      <View
        style={{
          width: 32,
          height: 32,
          borderRadius: 8,
          borderCurve: "continuous",
          backgroundColor: AC.tertiarySystemFill as any,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Image
          source={icon}
          style={{
            width: 18,
            height: 18,
            tintColor: tint ?? (AC.systemBlue as any),
          }}
        />
      </View>
      <Text
        style={{
          flex: 1,
          fontSize: 15,
          color: AC.label as any,
        }}
      >
        {title}
      </Text>
      <Text
        selectable
        style={{
          fontSize: 15,
          color: AC.secondaryLabel as any,
        }}
      >
        {value}
      </Text>
    </View>
  );
}

function Separator() {
  return (
    <View
      style={{
        height: 0.5,
        backgroundColor: AC.separator as any,
        marginLeft: 60,
      }}
    />
  );
}

export default function AboutScreen() {
  const btState = useBluetoothState();

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={{ padding: 16, gap: 20, paddingBottom: 40 }}
    >
      {/* App Icon & Title */}
      <View style={{ alignItems: "center", gap: 12, paddingVertical: 12 }}>
        <View
          style={{
            width: 80,
            height: 80,
            borderRadius: 20,
            borderCurve: "continuous",
            backgroundColor: AC.systemBlue as any,
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 4px 16px rgba(0, 122, 255, 0.3)",
          }}
        >
          <Image
            source="sf:antenna.radiowaves.left.and.right"
            style={{ width: 40, height: 40, tintColor: "white" }}
          />
        </View>
        <Text
          style={{
            fontSize: 24,
            fontWeight: "700",
            color: AC.label as any,
          }}
        >
          BLE Explorer
        </Text>
        <Text
          style={{
            fontSize: 15,
            color: AC.secondaryLabel as any,
            textAlign: "center",
            lineHeight: 22,
            maxWidth: 300,
          }}
        >
          Scan, connect, and explore Bluetooth Low Energy devices using
          CoreBluetooth.
        </Text>
      </View>

      {/* Bluetooth State */}
      <View style={{ alignItems: "center" }}>
        <StateBadge state={btState} />
      </View>

      {/* App Info */}
      <View
        style={{
          backgroundColor: AC.secondarySystemGroupedBackground as any,
          borderRadius: 14,
          borderCurve: "continuous",
          overflow: "hidden",
        }}
      >
        <InfoRow
          icon="sf:app.badge.fill"
          title="Version"
          value="1.0.0"
          tint={AC.systemIndigo as any}
        />
        <Separator />
        <InfoRow
          icon="sf:swift"
          title="Native Module"
          value="ExpoBluetooth"
          tint={AC.systemOrange as any}
        />
        <Separator />
        <InfoRow
          icon="sf:cpu"
          title="Framework"
          value="CoreBluetooth"
          tint={AC.systemPurple as any}
        />
        <Separator />
        <InfoRow
          icon="sf:hammer.fill"
          title="Built with"
          value="Expo SDK 55"
          tint={AC.systemBlue as any}
        />
      </View>

      {/* Capabilities */}
      <View style={{ gap: 8 }}>
        <Text
          style={{
            fontSize: 12,
            fontWeight: "600",
            color: AC.secondaryLabel as any,
            textTransform: "uppercase",
            letterSpacing: 0.5,
          }}
        >
          Capabilities
        </Text>
        <View
          style={{
            backgroundColor: AC.secondarySystemGroupedBackground as any,
            borderRadius: 14,
            borderCurve: "continuous",
            overflow: "hidden",
          }}
        >
          <CapabilityRow
            icon="sf:magnifyingglass"
            title="BLE Device Scanning"
            description="Discover nearby Bluetooth Low Energy peripherals"
          />
          <Separator />
          <CapabilityRow
            icon="sf:link"
            title="Device Connection"
            description="Connect and interact with BLE peripherals"
          />
          <Separator />
          <CapabilityRow
            icon="sf:shippingbox.fill"
            title="Service Discovery"
            description="Browse GATT services and characteristics"
          />
          <Separator />
          <CapabilityRow
            icon="sf:arrow.down.circle.fill"
            title="Read & Write"
            description="Read and write characteristic values"
          />
          <Separator />
          <CapabilityRow
            icon="sf:bell.fill"
            title="Notifications"
            description="Subscribe to characteristic value changes"
          />
        </View>
      </View>

      {/* Build Note */}
      <View
        style={{
          backgroundColor: AC.tertiarySystemFill as any,
          borderRadius: 12,
          borderCurve: "continuous",
          padding: 14,
          flexDirection: "row",
          gap: 10,
        }}
      >
        <Image
          source="sf:info.circle.fill"
          style={{ width: 18, height: 18, tintColor: AC.systemBlue as any }}
        />
        <Text
          style={{
            flex: 1,
            fontSize: 13,
            color: AC.secondaryLabel as any,
            lineHeight: 19,
          }}
        >
          This app requires a custom Expo dev client build to use Bluetooth
          features. Build with EAS:{"\n"}
          <Text style={{ fontFamily: "Menlo", fontSize: 12 }}>
            eas build -p ios --profile development
          </Text>
        </Text>
      </View>
    </ScrollView>
  );
}

function CapabilityRow({
  icon,
  title,
  description,
}: {
  icon: string;
  title: string;
  description: string;
}) {
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        paddingVertical: 12,
        paddingHorizontal: 16,
      }}
    >
      <Image
        source={icon}
        style={{ width: 20, height: 20, tintColor: AC.systemBlue as any }}
      />
      <View style={{ flex: 1, gap: 2 }}>
        <Text
          style={{
            fontSize: 15,
            fontWeight: "500",
            color: AC.label as any,
          }}
        >
          {title}
        </Text>
        <Text
          style={{
            fontSize: 13,
            color: AC.tertiaryLabel as any,
          }}
        >
          {description}
        </Text>
      </View>
    </View>
  );
}
