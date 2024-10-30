import React, { FC, useCallback, useState, useEffect } from "react";
import {
  FlatList,
  ListRenderItemInfo,
  Modal,
  SafeAreaView,
  Text,
  StyleSheet,
  TouchableOpacity,
  View,
  Dimensions,
  TextInput,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Device } from "react-native-ble-plx";
import Toast from 'react-native-toast-message'; // Import Toast


type ConnectedDevice = Device; // Now ConnectedDevice is the same as Device


type ConnectedDevices = ConnectedDevice[];

type DeviceModalListItemProps = {
  item: ListRenderItemInfo<Device>;
  connectToPeripheral: (device: Device) => void;
  closeModal: () => void;
  connectedDevices: ConnectedDevices;
  disconnectFromDevice: (deviceId: string) => void;
};

type DeviceModalProps = {
  devices: Device[];
  visible: boolean;
  connectToPeripheral: (device: Device) => void;
  closeModal: () => void;
  connectedDevices: ConnectedDevices;
  disconnectFromDevice: (deviceId: string) => void;
};

const DeviceModalListItem: FC<DeviceModalListItemProps> = (props) => {
  const { item, connectToPeripheral, connectedDevices, disconnectFromDevice, closeModal } = props;
  const [alertVisible, setAlertVisible] = useState(false);
  const [deviceName, setDeviceName] = useState<string | null>(null);
  const [inputName, setInputName] = useState("");
  const isConnected = !!connectedDevices.find((cd) => cd.id === item.item.id);

  useEffect(() => {
    const loadDeviceName = async () => {
      const savedName = await AsyncStorage.getItem(`device_name_${item.item.id}`);
      if (savedName) setDeviceName(savedName);
    };
    loadDeviceName();
  }, [item.item.id]);

  const handleConnect = async () => {
    if (inputName) {
      await AsyncStorage.setItem(`device_name_${item.item.id}`, inputName);
      setDeviceName(inputName);
    }
    connectToPeripheral(item.item);
    setAlertVisible(false);
    closeModal();
  };

  const handleDisconnect = () => {
    disconnectFromDevice(item.item.id);
    setAlertVisible(false);
    closeModal();
  };

 

  return (
    <>
      <TouchableOpacity
        onPress={() => setAlertVisible(true)}
        style={modalStyle.ctaButton}
      >
        <Text style={modalStyle.deviceId}>
          {deviceName ? `Name: ${deviceName}` : `ID: ${item.item.id}`}
        </Text>
      </TouchableOpacity>

      <Modal visible={alertVisible} transparent={true} animationType="slide">
        <View style={modalStyle.alertContainer}>
          <View style={modalStyle.alertBox}>
            <Text style={modalStyle.alertTitle}>Enter Device Name</Text>
            <TextInput
              style={modalStyle.input}
              placeholder="Device Name"
              value={inputName}
              onChangeText={setInputName}
            />
            <TouchableOpacity
                onPress={isConnected ? handleDisconnect : handleConnect}
              style={modalStyle.connectButton}
            >
              <Text style={modalStyle.connectButtonText}>
                {isConnected ? "Disconnect" : "Connect"}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setAlertVisible(false)} style={modalStyle.cancelButton}>
              <Text style={modalStyle.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
};

const DeviceModal: FC<DeviceModalProps> = (props) => {
  const { devices, visible, connectToPeripheral, connectedDevices, disconnectFromDevice, closeModal } = props;

  const renderDeviceModalListItem = useCallback(
    (item: ListRenderItemInfo<Device>) => (
      <DeviceModalListItem
        item={item}
        connectToPeripheral={connectToPeripheral}
        connectedDevices={connectedDevices}
        disconnectFromDevice={disconnectFromDevice}
        closeModal={closeModal}
      />
    ),
    [closeModal, connectToPeripheral, disconnectFromDevice]
  );

  return (
    <Modal animationType="slide" transparent={false} visible={visible}>
      <SafeAreaView style={modalStyle.modalContainer}>
        <TouchableOpacity style={modalStyle.backButton} onPress={closeModal}>
          <Text style={modalStyle.backButtonText}>← Back</Text>
        </TouchableOpacity>

        <View style={modalStyle.headerContainer}>
          <Text style={modalStyle.modalTitleText}>Tap on a device to connect</Text>
        </View>

        <View style={modalStyle.listContainer}>
          <FlatList
            data={devices}
            renderItem={renderDeviceModalListItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={modalStyle.modalFlatlistContainer}
            showsVerticalScrollIndicator={true}
          />
        </View>
      </SafeAreaView>
    </Modal>
  );
};

const { height } = Dimensions.get("window");

const modalStyle = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: "#f2f2f2",
  },
  headerContainer: {
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: "#f2f2f2",
  },
  listContainer: {
    flex: 1,
    paddingHorizontal: 10,
  },
  modalFlatlistContainer: {
    paddingBottom: 20,
  },
  modalTitleText: {
    marginTop: 40,
    fontSize: 30,
    fontWeight: "bold",
    marginHorizontal: 20,
    textAlign: "center",
    paddingTop: 10,
  },
  ctaButton: {
    backgroundColor: "#FF6060",
    justifyContent: "center",
    alignItems: "center",
    height: 50,
    marginHorizontal: 20,
    marginBottom: 5,
    borderRadius: 8,
  },
  deviceId: {
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.8)",
    marginTop: 2,
  },
  backButton: {
    position: "absolute",
    top: 10,
    left: 20,
    zIndex: 1,
    padding: 10,
  },
  backButtonText: {
    fontSize: 18,
    color: "#FF6060",
    fontWeight: "600",
  },
  alertContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  alertBox: {
    width: 300,
    padding: 20,
    backgroundColor: "#fff",
    borderRadius: 10,
    alignItems: "center",
  },
  alertTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
  },
  input: {
    width: "100%",
    padding: 10,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 5,
    marginBottom: 15,
  },
  connectButton: {
    backgroundColor: "#FF6060",
    padding: 10,
    borderRadius: 5,
    width: "100%",
    alignItems: "center",
    marginBottom: 10,
  },
  connectButtonText: {
    color: "#fff",
    fontWeight: "bold",
  },
  cancelButton: {
    padding: 10,
    width: "100%",
    alignItems: "center",
  },
  cancelButtonText: {
    color: "#FF6060",
    fontWeight: "bold",
  },
});

export default DeviceModal;
