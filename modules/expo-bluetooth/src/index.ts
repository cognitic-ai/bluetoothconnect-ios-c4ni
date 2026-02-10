import { NativeModule, requireNativeModule } from "expo";
import { useEffect, useState } from "react";

// ── Types ──────────────────────────────────────────────────────────

export type BluetoothState =
  | "poweredOn"
  | "poweredOff"
  | "unauthorized"
  | "unsupported"
  | "resetting"
  | "unknown";

export type BluetoothDevice = {
  id: string;
  name: string | null;
  rssi: number | null;
};

export type BluetoothService = {
  uuid: string;
  isPrimary: boolean;
};

export type CharacteristicProperty =
  | "read"
  | "write"
  | "writeWithoutResponse"
  | "notify"
  | "indicate"
  | "broadcast";

export type BluetoothCharacteristic = {
  uuid: string;
  serviceUUID: string;
  isNotifying: boolean;
  properties: CharacteristicProperty[];
  value?: string;
};

// ── Native Module Events ───────────────────────────────────────────

type ExpoBluetoothEvents = {
  onDeviceFound: (device: BluetoothDevice) => void;
  onScanStopped: () => void;
  onStateChanged: (event: { state: BluetoothState }) => void;
  onConnected: (device: BluetoothDevice) => void;
  onDisconnected: (device: BluetoothDevice) => void;
  onServicesDiscovered: (event: { services: BluetoothService[] }) => void;
  onCharacteristicsDiscovered: (event: {
    serviceUUID: string;
    characteristics: BluetoothCharacteristic[];
  }) => void;
  onCharacteristicValueUpdated: (
    characteristic: BluetoothCharacteristic
  ) => void;
};

// ── Native Module Declaration ──────────────────────────────────────

declare class ExpoBluetoothNativeModule extends NativeModule<ExpoBluetoothEvents> {
  getState(): BluetoothState;
  startScan(): void;
  stopScan(): void;
  isScanning(): boolean;
  connect(uuid: string): Promise<BluetoothDevice>;
  disconnect(): Promise<boolean>;
  discoverServices(): void;
  discoverCharacteristics(serviceUUID: string): void;
  readCharacteristic(
    serviceUUID: string,
    characteristicUUID: string
  ): Promise<BluetoothCharacteristic>;
  writeCharacteristic(
    serviceUUID: string,
    characteristicUUID: string,
    value: string
  ): Promise<boolean>;
  subscribeToCharacteristic(
    serviceUUID: string,
    characteristicUUID: string
  ): void;
  unsubscribeFromCharacteristic(
    serviceUUID: string,
    characteristicUUID: string
  ): void;
}

const ExpoBluetooth =
  requireNativeModule<ExpoBluetoothNativeModule>("ExpoBluetooth");

export default ExpoBluetooth;

// ── Public API ─────────────────────────────────────────────────────

export function getState(): BluetoothState {
  return ExpoBluetooth.getState();
}

export function startScan(): void {
  ExpoBluetooth.startScan();
}

export function stopScan(): void {
  ExpoBluetooth.stopScan();
}

export function isScanning(): boolean {
  return ExpoBluetooth.isScanning();
}

export function connect(uuid: string): Promise<BluetoothDevice> {
  return ExpoBluetooth.connect(uuid);
}

export function disconnect(): Promise<boolean> {
  return ExpoBluetooth.disconnect();
}

export function discoverServices(): void {
  ExpoBluetooth.discoverServices();
}

export function discoverCharacteristics(serviceUUID: string): void {
  ExpoBluetooth.discoverCharacteristics(serviceUUID);
}

export function readCharacteristic(
  serviceUUID: string,
  characteristicUUID: string
): Promise<BluetoothCharacteristic> {
  return ExpoBluetooth.readCharacteristic(serviceUUID, characteristicUUID);
}

export function writeCharacteristic(
  serviceUUID: string,
  characteristicUUID: string,
  value: string
): Promise<boolean> {
  return ExpoBluetooth.writeCharacteristic(
    serviceUUID,
    characteristicUUID,
    value
  );
}

export function subscribeToCharacteristic(
  serviceUUID: string,
  characteristicUUID: string
): void {
  ExpoBluetooth.subscribeToCharacteristic(serviceUUID, characteristicUUID);
}

export function unsubscribeFromCharacteristic(
  serviceUUID: string,
  characteristicUUID: string
): void {
  ExpoBluetooth.unsubscribeFromCharacteristic(serviceUUID, characteristicUUID);
}

// ── Hooks ──────────────────────────────────────────────────────────

export function useBluetoothState(): BluetoothState {
  const [state, setState] = useState<BluetoothState>(() => getState());

  useEffect(() => {
    const sub = ExpoBluetooth.addListener("onStateChanged", (event) => {
      setState(event.state);
    });
    return () => sub.remove();
  }, []);

  return state;
}

export function useBluetoothScanner() {
  const [devices, setDevices] = useState<BluetoothDevice[]>([]);
  const [scanning, setScanning] = useState(false);

  useEffect(() => {
    const deviceSub = ExpoBluetooth.addListener("onDeviceFound", (device) => {
      setDevices((prev) => {
        const exists = prev.findIndex((d) => d.id === device.id);
        if (exists >= 0) {
          const updated = [...prev];
          updated[exists] = device;
          return updated;
        }
        return [...prev, device];
      });
    });

    const stopSub = ExpoBluetooth.addListener("onScanStopped", () => {
      setScanning(false);
    });

    return () => {
      deviceSub.remove();
      stopSub.remove();
    };
  }, []);

  const scan = () => {
    setDevices([]);
    setScanning(true);
    startScan();
  };

  const stop = () => {
    stopScan();
    setScanning(false);
  };

  return { devices, scanning, scan, stop };
}
