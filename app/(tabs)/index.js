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
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

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

  const [categories, setCategories] = useState([]); // Example categories
  const [employees, setEmployees] = useState([]); // Example employees

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
  const handleSubmit = async () => {
    // Extract asset details
    const {
      name,
      category_id,
      employee_id,
      description,
      code,
      serial_number,
      status,
      purchase_date,
      warranty_date,
      decommission_date,
      image,
      coordinates,
    } = assetDetails;
    console.log(assetDetails);
  
    try {
      const token = await AsyncStorage.getItem("token");
      // Send data to your backend
      const response = await fetch(
        "https://test.tokenlessreport.optitech.co.ke/api/v1/assets",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            
          },
          body: JSON.stringify({
            name,
            category_id,
            employee_id,
            description,
            code,
            serial_number,
            status,
            purchase_date,
            warranty_date,
            decommission_date,
            image,
            coordinates,
          }),
        }
      );
  
      // Parse response JSON
      const responseData = await response.json();
  
      // Check if submission was successful
      if (response.status === 201) {
        // Display success message
        Alert.alert("Asset Details Submitted", JSON.stringify(assetDetails));
        
        // Reset form
        setAssetDetails({
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
          coordinates: null,
        });
  
        setQrValue("");
        setShowCamera(false);
      } else if (response.status === 400) {
        // Display validation error messages
        const errorMessages = Object.values(responseData).join("\n");
        Alert.alert("Validation Errors", errorMessages);
        console.log("Validation errors:", responseData);
      } else {
        // Display generic error message for other statuses
        Alert.alert("Failed to submit asset details");
        console.log("Submission failed:", responseData);
        console.log("Response status:", response.status);
      }
    } catch (error) {
      // Display network or other error
      Alert.alert("Network error", "Failed to connect to the server");
      console.log("Network error:", error);
      console.log("Response status:", response.status);

    }
  };
  

  //Fetch categories
  const fetchCategories = async () => {
    const response = await axios.get(
      "https://test.tokenlessreport.optitech.co.ke/api/v1/categories"
    );
    const data = response.data;
    console.log(data);
    setCategories(data);
  };

  //Fetch employees
  const fetchEmployees = async () => {
    const response = await axios.get(
      "https://test.tokenlessreport.optitech.co.ke/api/v1/employees"
    );
    const data = response.data;
    console.log(data);
    setEmployees(data);
  };

  useEffect(() => {
    fetchCategories();
    fetchEmployees();
  }, []);

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

      <ScrollView
        style={styles.formContainer}
        contentContainerStyle={{ flexGrow: 1 }}
      >
        <TouchableOpacity
          onPress={() => setShowCamera(!showCamera)}
          style={styles.toggleButton}
        >
          <Text style={(style = { color: "white", textAlign: "center" })}>
            {showCamera ? "Hide Scanner" : "Scan Barcode/QR Code"}
          </Text>
        </TouchableOpacity>
        <TextInput
          placeholder="Name"
          style={styles.input}
          onChangeText={(text) => handleInputChange("name", text)}
        />
        {/* Category Picker */}
        <View
          style={{
            borderWidth: 1,
            borderColor: "gray",
            borderRadius: 1,
            marginBottom: 10,
            width: "90%",
            alignSelf: "center"
          }}
        >
          <Picker
            selectedValue={assetDetails.category_id}
            onValueChange={(itemValue) =>
              handleInputChange("category_id", itemValue)
            }
            style={styles.picker}
          >
            <Picker.Item label="Select Category" value="" color="gray" />
            {categories.map((category) => (
              <Picker.Item
                key={category.id}
                label={category.name}
                value={category.id}
              />
            ))}
          </Picker>
        </View>
        <View
          style={{
            borderWidth: 1,
            borderColor: "gray",
            borderRadius: 1,
            marginBottom: 10,
            width: "90%",
            alignSelf: "center"
          }}
        >
          {/* Employee Picker */}
          <Picker
            selectedValue={assetDetails.employee_id}
            onValueChange={(itemValue) =>
              handleInputChange("employee_id", itemValue)
            }
            style={styles.picker}
          >
            <Picker.Item label="Select Employee" value="" color="gray" />
            {employees.map((employee) => (
              <Picker.Item
                key={employee.id}
                label={employee.name}
                value={employee.id}
              />
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
    backgroundColor: "#fff"
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
    textAlign: "center"
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    width: "100%",
    marginVertical: 20
  },
  button: {
    padding: 10,
    backgroundColor: "#2196F3", // Blue
    borderRadius: 5
  },
  buttonText: {
    color: "white",
    fontWeight: "bold"
  },
  formContainer: {
    flex: 1,
    width: "100%"
  },
  input: {
    height: 50,
    borderColor: "gray",
    borderWidth: 1,
    borderRadius: 5,
    paddingHorizontal: 10,
    marginBottom: 10,
    width: "90%",
    alignSelf: "center"
  },
  pickerContainer: {
    width: "90%",
    alignSelf: "center",
    marginBottom: 10
  },
  picker: {
    height: 50,
    borderColor: "gray",
    borderWidth: 1,
    borderRadius: 5
  },
  submitButton: {
    padding: 10,
    backgroundColor: "#4CAF50",
    borderRadius: 5,
    alignItems: "center",
    width: "90%",
    alignSelf: "center",
    marginBottom: 10
  }
});

export default App;
