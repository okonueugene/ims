import React, { useEffect, useState } from "react";
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Platform,
  PermissionsAndroid,
  Alert,
  Vibration,
  TextInput,
  ScrollView
} from "react-native";
import { CameraView } from "expo-camera";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import { Picker } from "@react-native-picker/picker";

const App = () => {
  const [qrValue, setQrValue] = useState("");
  const [light, setLight] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [assetDetails, setAssetDetails] = useState({
    name: "",
    category_id: "",
    employee_id: "",
    description: "",
    code: "",
    serial_number: "",
    status: "available",
    purchase_date: "",
    warranty_date: "",
    decommission_date: "",
    image: null,
    coordinates: null
  });

  const [categories, setCategories] = useState([
    "Category 1",
    "Category 2",
    "Category 3"
  ]); // Example categories
  const [employees, setEmployees] = useState([
    "Employee 1",
    "Employee 2",
    "Employee 3"
  ]); // Example employees

  const requestPermissions = async () => {
    if (Platform.OS === "android") {
      try {
        const granted = await PermissionsAndroid.requestMultiple([
          PermissionsAndroid.PERMISSIONS.CAMERA,
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE
        ]);
        if (
          granted["android.permission.CAMERA"] ===
            PermissionsAndroid.RESULTS.GRANTED &&
          granted["android.permission.ACCESS_FINE_LOCATION"] ===
            PermissionsAndroid.RESULTS.GRANTED &&
          granted["android.permission.READ_EXTERNAL_STORAGE"] ===
            PermissionsAndroid.RESULTS.GRANTED
        ) {
          console.log("Permissions granted");
        } else {
          Alert.alert("Permissions denied");
        }
      } catch (err) {
        console.warn(err);
      }
    }
  };

  useEffect(() => {
    requestPermissions();
  }, []);

  const handleBarcodeScanned = ({ data }) => {
    Vibration.vibrate(50);
    setQrValue(data);
    setAssetDetails((prev) => ({
        ...prev,
        code: data // Set the scanned barcode data as the value of code
    }));
    getCoordinates(); // Get coordinates when barcode is scanned
    setShowCamera(false); // Hide camera after scan
};


  const getCoordinates = async () => {
    let { status } = await Location.requestForegroundPermissionsAsync();
    if (status === "granted") {
      let location = await Location.getCurrentPositionAsync({});
      setAssetDetails((prev) => ({
        ...prev,
        coordinates: `${location.coords.latitude}, ${location.coords.longitude}`
      }));
    } else {
      Alert.alert("Location permission denied");
    }
  };

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1
    });

    if (!result.canceled) {
      setAssetDetails((prev) => ({ ...prev, image: result.assets[0].uri }));
    }
  };

  const handleInputChange = (name, value) => {
    setAssetDetails((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = () => {
    // Handle the submission logic here, e.g., send data to your backend
    console.log(assetDetails);
    Alert.alert("Asset Details Submitted", JSON.stringify(assetDetails));
  };

  return (
    <View style={styles.container}>
      {/* Button to show/hide CameraView */}
         {showCamera && (
        <CameraView
          barcodeScannerSettings={{
            barcodeTypes: [
              "qr",
              "pdf417",
              "aztec",
              "code128",
              "code39",
              "code93",
              "ean13",
              "ean8",
              "interleaved2of5",
              "itf14",
              "upce"
            ]
          }}
          style={styles.camera}
          facing="back"
          flash={light ? "torch" : "off"}
          onBarcodeScanned={handleBarcodeScanned}
          enableTorch={light}
        />
      )}

      <View style={styles.focusFrame}>
        <Text style={styles.instructions}>
          Align the barcode within the frame to scan
        </Text>
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          onPress={() => setLight(!light)}
          style={styles.button}
        >
          <Text style={styles.buttonText}>
            {light ? "Turn Off Light" : "Turn On Light"}
          </Text>
        </TouchableOpacity>
      </View>
      <ScrollView style={styles.formContainer} contentContainerStyle={{ flexGrow: 1 }}>
      <TouchableOpacity
        onPress={() => setShowCamera(!showCamera)}
        style={styles.toggleButton}
      >
        <Text style={style={color: "white", fontSize: 14, textAlign: "center", with: "100%"}}>
          {showCamera ? "Hide Scanner" : "Scan Barcode/QR Code"}
        </Text>
      </TouchableOpacity>
        <TextInput
          placeholder="Name"
          style={styles.input}
          onChangeText={(text) => handleInputChange("name", text)}
        />
        {/* Category Picker */}
        <View style={{ borderWidth: 1, borderColor: "gray", borderRadius: 2, marginBottom: 10 }}>
          <Picker
            selectedValue={assetDetails.category_id}
            onValueChange={(itemValue) =>
              handleInputChange("category_id", itemValue)
            }
            style={styles.picker}
          >
            <Picker.Item label="Select Category" value=""  color="gray"/>
            {categories.map((category, index) => (
              <Picker.Item key={index} label={category} value={category} />
            ))}
          </Picker>
        </View>
        <View style={{ borderWidth: 1, borderColor: "gray", borderRadius: 2, marginBottom: 10 }}>
          {/* Employee Picker */}
          <Picker
            selectedValue={assetDetails.employee_id}
            onValueChange={(itemValue) =>
              handleInputChange("employee_id", itemValue)
            }
            style={styles.picker}
          >
            <Picker.Item label="Select Employee" value="" color="gray"/>
            {employees.map((employee, index) => (
              <Picker.Item key={index} label={employee} value={employee} />
            ))}
          </Picker>
        </View>

        <TextInput
          placeholder="Description"
          style={styles.input}
          onChangeText={(text) => handleInputChange("description", text)}
        />
        <TextInput
          placeholder="Code"
          style={styles.input}
          value={qrValue}
          editable={false}
        />
        <TextInput
          placeholder="Serial Number"
          style={styles.input}
          onChangeText={(text) => handleInputChange("serial_number", text)}
        />
        <TextInput
          placeholder="Purchase Date (YYYY-MM-DD)"
          style={styles.input}
          onChangeText={(text) => handleInputChange("purchase_date", text)}
        />
        <TextInput
          placeholder="Warranty Date (YYYY-MM-DD)"
          style={styles.input}
          onChangeText={(text) => handleInputChange("warranty_date", text)}
        />
        <TextInput
          placeholder="Decommission Date (YYYY-MM-DD)"
          style={styles.input}
          onChangeText={(text) => handleInputChange("decommission_date", text)}
        />
        <TouchableOpacity onPress={pickImage} style={styles.submitButton}>
          <Text style={styles.buttonText}>Pick Image</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={handleSubmit} style={styles.submitButton}>
          <Text style={styles.buttonText}>Submit Asset Details</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "flex-start",
    alignItems: "center",
    height: "30%",
  },
  toggleButton: {
    margin: 20,
    padding: 10,
    backgroundColor: "#4CAF50", // Vibrant green
    borderRadius: 5
  },
  camera: {
    width: "100%",
    height: "100%"
  },
  focusFrame: {
    position: "absolute",
    top: "30%",
    left: "10%",
    width: "80%",
    height: "40%",
    borderWidth: 2,
    borderColor: "white",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 10
  },
  instructions: {
    color: "white",
    fontSize: 16,
    textAlign: "center",
    paddingHorizontal: 10
  },
  buttonContainer: {
    position: "absolute",
    bottom: 20,
    width: "100%",
    alignItems: "center"
  },
  button: {
    padding: 10,
    backgroundColor: "#FF5722", // Vibrant orange
    borderRadius: 5,
    marginVertical: 5
  },
  buttonText: {
    fontSize: 16,
    color: "white"
  },
  alertContainer: {
    position: "absolute",
    top: 50,
    width: "100%",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    padding: 20,
    borderRadius: 10
  },
  alertText: {
    fontSize: 18,
    color: "white"
  },
  alertButton: {
    marginTop: 10,
    padding: 10,
    backgroundColor: "#FFC107", // Vibrant yellow
    borderRadius: 5
  },
  formContainer: {
    flex: 1,
    padding: 20,
    width: "100%",
    backgroundColor: "#fff"
  },
  input: {
    height: 40,
    borderColor: "gray",
    borderWidth: 1,
    marginBottom: 12,
    padding: 10
  },
  submitButton: {
    marginTop: 20,
    padding: 10,
    backgroundColor: "#3F51B5", // Vibrant blue
    borderRadius: 5,
    alignItems: "center"
  },
  picker: {
    height: 50,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "gray",
    borderRadius: 5,
    backgroundColor: "white", // Set background color for visibility
    padding: 10 // Add padding for better appearance
  }
});

export default App;
