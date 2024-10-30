import { useMemo, useState } from "react";
import { PermissionsAndroid, Platform } from "react-native";
import {
  BleError,
  BleManager,
  Characteristic,
  Device,
} from "react-native-ble-plx";

import * as ExpoDevice from "expo-device";
import base64 from "react-native-base64";


const HEART_RATE_UUID = "6e400001-b5a3-f393-e0a9-e50e24dcca9e";
const HEART_RATE_CHARACTERISTIC = "6e400003-b5a3-f393-e0a9-e50e24dcca9e";



interface BluetoothLowEnergyApi {
  requestPermissions(): Promise<boolean>;
  scanForPeripherals(): void;
  connectToDevice: (device: Device) => Promise<void>;
  disconnectFromDevice: (deviceId: string) => void;
  connectedDevices:  Device[];
  allDevices: Device[];
  caliperValue: { value: string; timestamp: number };
  }
  
function useBLE(): BluetoothLowEnergyApi {
  const bleManager = useMemo(() => new BleManager(), []);
  const [allDevices, setAllDevices] = useState<Device[]>([]);
  const [connectedDevices, setConnectedDevices] = useState<Device[]>([]);
  const [caliperValue, setCaliperValue] = useState<{ value: string; timestamp: number }>({ value: "", timestamp: Date.now() });


  const requestAndroid31Permissions = async () => {
    const bluetoothScanPermission = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
      {
        title: "Location Permission",
        message: "Bluetooth Low Energy requires Location",
        buttonPositive: "OK",
      }
    );
    const bluetoothConnectPermission = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
      {
        title: "Location Permission",
        message: "Bluetooth Low Energy requires Location",
        buttonPositive: "OK",
      }
    );
    const fineLocationPermission = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      {
        title: "Location Permission",
        message: "Bluetooth Low Energy requires Location",
        buttonPositive: "OK",
      }
    );

    return (
        bluetoothScanPermission === "granted" &&
        bluetoothConnectPermission === "granted" &&
        fineLocationPermission === "granted"
      );
    };
  
    const requestPermissions = async () => {
        if (Platform.OS === "android") {
          if ((ExpoDevice.platformApiLevel ?? -1) < 31) {
            const granted = await PermissionsAndroid.request(
              PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
              {
                title: "Location Permission",
                message: "Bluetooth Low Energy requires Location",
                buttonPositive: "OK",
              }
            );
            return granted === PermissionsAndroid.RESULTS.GRANTED;
          } else {
            const isAndroid31PermissionsGranted =
              await requestAndroid31Permissions();
    
            return isAndroid31PermissionsGranted;
          }
        } else {
          return true;
        }
      };

      const isDuplicteDevice = (devices: Device[], nextDevice: Device) =>
        devices.findIndex((device) => nextDevice.id === device.id) > -1;

      const scanForPeripherals = () =>
        bleManager.startDeviceScan(null, null, (error, device) => {
          if (error) {
            console.log(error);
          }
    
          if (device) {
            setAllDevices((prevState: Device[]) => {
              if (!isDuplicteDevice(prevState, device)) {
                return [...prevState, device];
              }
              return prevState;
            });
          }
        });


        const connectToDevice = async (device: Device) => {
          try {
            const deviceConnection = await bleManager.connectToDevice(device.id);
            await deviceConnection.discoverAllServicesAndCharacteristics();
            
            setConnectedDevices((prevDevices) => [
              ...prevDevices,
              device, // Here, we are adding the full device object
            ]);
            startStreamingData(deviceConnection);
          } catch (e) {
            console.log("FAILED TO CONNECT", e);
          }
        };

        const disconnectFromDevice = (deviceId: string) => {
          bleManager.cancelDeviceConnection(deviceId);
          setConnectedDevices((prevDevices) =>
            prevDevices.filter((d) => d.id !== deviceId) // Use d.id to match the deviceId
          );
        };

        const onValueUpdate = (
          deviceId: string,
          error: BleError | null,
          characteristic: Characteristic | null
        ): void => {
          if (error) {
            console.log("Error reading value:", error);
            return;
          } else if (!characteristic?.value) {
            console.log("No data was received");
            return;
          }
      
          const rawData: string = base64.decode(characteristic.value);
          console.log("Raw data from device", deviceId, ":", rawData);
      
          const value = parseFloat(rawData);
          if (!isNaN(value)) {
            setCaliperValue({ value: String(value), timestamp: Date.now() });
          } else {
            console.log("Invalid data received:", rawData);
          }
        };

        console.log("caliperValue:", caliperValue.value);

        

        const startStreamingData = async (device: Device) => {
          if (device) {
            device.monitorCharacteristicForService(
              HEART_RATE_UUID,
              HEART_RATE_CHARACTERISTIC,
              (error, characteristic) => onValueUpdate(device.id, error, characteristic)
            );
          } else {
            console.log("No Device Connected");
          }
        };
        
      return{
        scanForPeripherals,
        requestPermissions,
        connectToDevice,
        allDevices,
        connectedDevices,
        disconnectFromDevice,
        caliperValue,
      }

}

export default useBLE;

