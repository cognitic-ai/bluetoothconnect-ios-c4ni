import ExpoModulesCore
import CoreBluetooth

public class ExpoBluetoothModule: Module {
  private var centralManager: CBCentralManager?
  private var delegate: BluetoothDelegate?
  private var discoveredPeripherals: [UUID: CBPeripheral] = [:]
  private var connectedPeripheral: CBPeripheral?
  private var peripheralDelegate: PeripheralDelegate?

  public func definition() -> ModuleDefinition {
    Name("ExpoBluetooth")

    Events(
      "onDeviceFound",
      "onScanStopped",
      "onStateChanged",
      "onConnected",
      "onDisconnected",
      "onServicesDiscovered",
      "onCharacteristicsDiscovered",
      "onCharacteristicValueUpdated"
    )

    OnCreate {
      self.delegate = BluetoothDelegate(module: self)
      self.centralManager = CBCentralManager(delegate: self.delegate, queue: nil)
    }

    OnDestroy {
      self.centralManager?.stopScan()
      if let peripheral = self.connectedPeripheral {
        self.centralManager?.cancelPeripheralConnection(peripheral)
      }
      self.centralManager = nil
      self.delegate = nil
    }

    // MARK: - State

    Function("getState") { () -> String in
      guard let manager = self.centralManager else { return "unknown" }
      return self.stateToString(manager.state)
    }

    // MARK: - Scanning

    Function("startScan") {
      guard let manager = self.centralManager, manager.state == .poweredOn else {
        return
      }
      self.discoveredPeripherals.removeAll()
      manager.scanForPeripherals(
        withServices: nil,
        options: [CBCentralManagerScanOptionAllowDuplicatesKey: false]
      )
    }

    Function("stopScan") {
      self.centralManager?.stopScan()
      self.sendEvent("onScanStopped")
    }

    Function("isScanning") { () -> Bool in
      return self.centralManager?.isScanning ?? false
    }

    // MARK: - Connection

    AsyncFunction("connect") { (uuidString: String, promise: Promise) in
      guard let uuid = UUID(uuidString: uuidString),
            let peripheral = self.discoveredPeripherals[uuid] else {
        promise.reject("ERR_DEVICE_NOT_FOUND", "Device not found. Run a scan first.")
        return
      }
      self.delegate?.connectPromise = promise
      self.connectedPeripheral = peripheral
      self.peripheralDelegate = PeripheralDelegate(module: self)
      peripheral.delegate = self.peripheralDelegate
      self.centralManager?.connect(peripheral, options: nil)
    }

    AsyncFunction("disconnect") { (promise: Promise) in
      guard let peripheral = self.connectedPeripheral else {
        promise.resolve(true)
        return
      }
      self.delegate?.disconnectPromise = promise
      self.centralManager?.cancelPeripheralConnection(peripheral)
    }

    // MARK: - Service Discovery

    Function("discoverServices") {
      self.connectedPeripheral?.discoverServices(nil)
    }

    Function("discoverCharacteristics") { (serviceUUID: String) in
      guard let peripheral = self.connectedPeripheral else { return }
      if let service = peripheral.services?.first(where: { $0.uuid.uuidString == serviceUUID }) {
        peripheral.discoverCharacteristics(nil, for: service)
      }
    }

    // MARK: - Read / Write

    AsyncFunction("readCharacteristic") { (serviceUUID: String, characteristicUUID: String, promise: Promise) in
      guard let peripheral = self.connectedPeripheral else {
        promise.reject("ERR_NOT_CONNECTED", "No device connected.")
        return
      }
      guard let service = peripheral.services?.first(where: { $0.uuid.uuidString == serviceUUID }),
            let characteristic = service.characteristics?.first(where: { $0.uuid.uuidString == characteristicUUID }) else {
        promise.reject("ERR_NOT_FOUND", "Characteristic not found.")
        return
      }
      self.peripheralDelegate?.readPromise = promise
      peripheral.readValue(for: characteristic)
    }

    AsyncFunction("writeCharacteristic") { (serviceUUID: String, characteristicUUID: String, value: String, promise: Promise) in
      guard let peripheral = self.connectedPeripheral else {
        promise.reject("ERR_NOT_CONNECTED", "No device connected.")
        return
      }
      guard let service = peripheral.services?.first(where: { $0.uuid.uuidString == serviceUUID }),
            let characteristic = service.characteristics?.first(where: { $0.uuid.uuidString == characteristicUUID }) else {
        promise.reject("ERR_NOT_FOUND", "Characteristic not found.")
        return
      }
      guard let data = value.data(using: .utf8) else {
        promise.reject("ERR_INVALID_DATA", "Could not encode value.")
        return
      }
      let writeType: CBCharacteristicWriteType = characteristic.properties.contains(.write) ? .withResponse : .withoutResponse
      self.peripheralDelegate?.writePromise = promise
      peripheral.writeValue(data, for: characteristic, type: writeType)
      if writeType == .withoutResponse {
        self.peripheralDelegate?.writePromise = nil
        promise.resolve(true)
      }
    }

    Function("subscribeToCharacteristic") { (serviceUUID: String, characteristicUUID: String) in
      guard let peripheral = self.connectedPeripheral else { return }
      if let service = peripheral.services?.first(where: { $0.uuid.uuidString == serviceUUID }),
         let characteristic = service.characteristics?.first(where: { $0.uuid.uuidString == characteristicUUID }) {
        peripheral.setNotifyValue(true, for: characteristic)
      }
    }

    Function("unsubscribeFromCharacteristic") { (serviceUUID: String, characteristicUUID: String) in
      guard let peripheral = self.connectedPeripheral else { return }
      if let service = peripheral.services?.first(where: { $0.uuid.uuidString == serviceUUID }),
         let characteristic = service.characteristics?.first(where: { $0.uuid.uuidString == characteristicUUID }) {
        peripheral.setNotifyValue(false, for: characteristic)
      }
    }
  }

  // MARK: - Helpers

  func stateToString(_ state: CBManagerState) -> String {
    switch state {
    case .poweredOn: return "poweredOn"
    case .poweredOff: return "poweredOff"
    case .unauthorized: return "unauthorized"
    case .unsupported: return "unsupported"
    case .resetting: return "resetting"
    case .unknown: return "unknown"
    @unknown default: return "unknown"
    }
  }

  func peripheralToDict(_ peripheral: CBPeripheral, rssi: NSNumber? = nil) -> [String: Any?] {
    return [
      "id": peripheral.identifier.uuidString,
      "name": peripheral.name,
      "rssi": rssi?.intValue
    ]
  }

  func serviceToDict(_ service: CBService) -> [String: Any?] {
    return [
      "uuid": service.uuid.uuidString,
      "isPrimary": service.isPrimary
    ]
  }

  func characteristicToDict(_ characteristic: CBCharacteristic) -> [String: Any] {
    var dict: [String: Any] = [
      "uuid": characteristic.uuid.uuidString,
      "serviceUUID": characteristic.service?.uuid.uuidString ?? "",
      "isNotifying": characteristic.isNotifying,
      "properties": propertiesArray(characteristic.properties)
    ]
    if let value = characteristic.value {
      dict["value"] = String(data: value, encoding: .utf8) ?? value.base64EncodedString()
    }
    return dict
  }

  private func propertiesArray(_ props: CBCharacteristicProperties) -> [String] {
    var result: [String] = []
    if props.contains(.read) { result.append("read") }
    if props.contains(.write) { result.append("write") }
    if props.contains(.writeWithoutResponse) { result.append("writeWithoutResponse") }
    if props.contains(.notify) { result.append("notify") }
    if props.contains(.indicate) { result.append("indicate") }
    if props.contains(.broadcast) { result.append("broadcast") }
    return result
  }
}

// MARK: - CBCentralManager Delegate

class BluetoothDelegate: NSObject, CBCentralManagerDelegate {
  private weak var module: ExpoBluetoothModule?
  var connectPromise: Promise?
  var disconnectPromise: Promise?

  init(module: ExpoBluetoothModule) {
    self.module = module
  }

  func centralManagerDidUpdateState(_ central: CBCentralManager) {
    module?.sendEvent("onStateChanged", [
      "state": module?.stateToString(central.state) ?? "unknown"
    ])
  }

  func centralManager(_ central: CBCentralManager, didDiscover peripheral: CBPeripheral, advertisementData: [String: Any], rssi RSSI: NSNumber) {
    module?.discoveredPeripherals[peripheral.identifier] = peripheral
    module?.sendEvent("onDeviceFound", module?.peripheralToDict(peripheral, rssi: RSSI) as Any)
  }

  func centralManager(_ central: CBCentralManager, didConnect peripheral: CBPeripheral) {
    module?.sendEvent("onConnected", module?.peripheralToDict(peripheral) as Any)
    connectPromise?.resolve(module?.peripheralToDict(peripheral) as Any)
    connectPromise = nil
  }

  func centralManager(_ central: CBCentralManager, didFailToConnect peripheral: CBPeripheral, error: Error?) {
    connectPromise?.reject("ERR_CONNECT", error?.localizedDescription ?? "Connection failed")
    connectPromise = nil
  }

  func centralManager(_ central: CBCentralManager, didDisconnectPeripheral peripheral: CBPeripheral, error: Error?) {
    module?.connectedPeripheral = nil
    module?.sendEvent("onDisconnected", module?.peripheralToDict(peripheral) as Any)
    disconnectPromise?.resolve(true)
    disconnectPromise = nil
  }
}

// MARK: - CBPeripheral Delegate

class PeripheralDelegate: NSObject, CBPeripheralDelegate {
  private weak var module: ExpoBluetoothModule?
  var readPromise: Promise?
  var writePromise: Promise?

  init(module: ExpoBluetoothModule) {
    self.module = module
  }

  func peripheral(_ peripheral: CBPeripheral, didDiscoverServices error: Error?) {
    let services = peripheral.services?.map { module?.serviceToDict($0) } ?? []
    module?.sendEvent("onServicesDiscovered", ["services": services])
  }

  func peripheral(_ peripheral: CBPeripheral, didDiscoverCharacteristicsFor service: CBService, error: Error?) {
    let characteristics = service.characteristics?.map { module?.characteristicToDict($0) } ?? []
    module?.sendEvent("onCharacteristicsDiscovered", [
      "serviceUUID": service.uuid.uuidString,
      "characteristics": characteristics
    ])
  }

  func peripheral(_ peripheral: CBPeripheral, didUpdateValueFor characteristic: CBCharacteristic, error: Error?) {
    let dict = module?.characteristicToDict(characteristic) ?? [:]

    if let promise = readPromise {
      if let err = error {
        promise.reject("ERR_READ", err.localizedDescription)
      } else {
        promise.resolve(dict)
      }
      readPromise = nil
    }

    module?.sendEvent("onCharacteristicValueUpdated", dict)
  }

  func peripheral(_ peripheral: CBPeripheral, didWriteValueFor characteristic: CBCharacteristic, error: Error?) {
    if let promise = writePromise {
      if let err = error {
        promise.reject("ERR_WRITE", err.localizedDescription)
      } else {
        promise.resolve(true)
      }
      writePromise = nil
    }
  }
}
