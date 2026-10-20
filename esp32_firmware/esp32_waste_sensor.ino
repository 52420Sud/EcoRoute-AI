/*
  =============================================================================
  AI-Based Smart Waste Management System - ESP32 IoT Node Firmware
  Compatible with: ESP32 DevKit V1 (DOIT) + HC-SR04 Ultrasonic Sensor + Buzzer + LED
  =============================================================================
  Circuit Connections (Exact Match to Schematic):
    1. ESP32 VIN       -> HC-SR04 VCC (5V Power)
    2. ESP32 GND_R     -> Common Ground Rail (HC-SR04 GND, Buzzer -, LED Cathode, R1)
    3. ESP32 IO13      -> HC-SR04 TRIG (GPIO 13)
    4. ESP32 IO14      -> HC-SR04 ECHO (GPIO 14 via Voltage Divider: R2 4.7k + R1 3.3k)
    5. ESP32 IO4       -> Piezo Buzzer + (GPIO 4 via R4 100 Ohm resistor)
    6. ESP32 IO27      -> Status LED Anode (GPIO 27 via R3 130 Ohm resistor)
  =============================================================================
*/

#include <WiFi.h>
#include <HTTPClient.h>

// --- 1. Wi-Fi Configuration ---
// Connect your ESP32 to the same Wi-Fi network as the laptop/server
const char* WIFI_SSID     = "YOUR_WIFI_NAME";
const char* WIFI_PASSWORD = "YOUR_WIFI_PASSWORD";

// --- 2. Backend Server Endpoint ---
// Replace with the IP address of your server (Your current laptop Wi-Fi IP is: 10.50.80.76)
const char* SERVER_URL    = "http://10.50.80.76:5000/api/sensors/telemetry";

// --- 3. Hardware & Dustbin Parameters ---
const char* DUSTBIN_ID        = "DB-003"; // Assigned Dustbin ID

// Calibration settings for your physical container:
// If AUTO_CALIBRATE_ON_BOOT is true, the ESP32 takes 5 readings when you power it on
// above your empty container and automatically sets 0% fill level!
const bool AUTO_CALIBRATE_ON_BOOT = true;
float binHeightCm                 = 30.0; // Physical container depth in cm (measure with a ruler)

// Exact Pin Definitions from Circuit Schematic:
const int TRIG_PIN        = 13;       // HC-SR04 Trigger (ESP32 IO13)
const int ECHO_PIN        = 14;       // HC-SR04 Echo (ESP32 IO14 via R2 4.7k / R1 3.3k divider)
const int BUZZER_PIN      = 4;        // Piezo Buzzer (ESP32 IO4 via R4 100 ohm)
const int LED_PIN         = 27;       // External Status LED (ESP32 IO27 via R3 130 ohm)

// Telemetry interval in milliseconds (e.g. 5000 ms = every 5 seconds)
const unsigned long SEND_INTERVAL_MS = 5000;
unsigned long lastSendTime = 0;

// Forward declaration of distance measurement function
float measureDistanceCm();

void setup() {
  Serial.begin(115200);
  delay(1000);

  // Initialize Pin Modes
  pinMode(TRIG_PIN, OUTPUT);
  pinMode(ECHO_PIN, INPUT);
  pinMode(LED_PIN, OUTPUT);
  pinMode(BUZZER_PIN, OUTPUT);

  // Default Pin States
  digitalWrite(TRIG_PIN, LOW);
  digitalWrite(LED_PIN, LOW);
  digitalWrite(BUZZER_PIN, LOW);

  Serial.println("\n==============================================");
  Serial.println("  ESP32 Smart Waste IoT Sensor Starting...    ");
  Serial.println("  Schematic: TRIG=13, ECHO=14, BUZZER=4, LED=27");
  Serial.println("==============================================");

  // Connect to Wi-Fi
  Serial.print("Connecting to Wi-Fi: ");
  Serial.println(WIFI_SSID);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  while (WiFi.status() != WL_CONNECTED) {
    digitalWrite(LED_PIN, !digitalRead(LED_PIN)); // Flash LED while connecting
    delay(500);
    Serial.print(".");
  }

  digitalWrite(LED_PIN, HIGH); // Solid LED when connected
  Serial.println("\n[WiFi] Connected Successfully!");
  Serial.print("[WiFi] ESP32 IP Address: ");
  Serial.println(WiFi.localIP());
  Serial.print("[Server] Target URL: ");
  Serial.println(SERVER_URL);

  // Auto-Calibrate Empty Container Depth (if enabled)
  if (AUTO_CALIBRATE_ON_BOOT) {
    Serial.println("\n----------------------------------------------");
    Serial.println("[Auto-Calibration] Sampling empty container depth in 2 seconds...");
    Serial.println("[Auto-Calibration] Please ensure the container is EMPTY under the sensor!");
    delay(2000);

    float totalDist = 0;
    int validReadings = 0;
    for (int i = 0; i < 5; i++) {
      float d = measureDistanceCm();
      if (d > 5.0 && d < 400.0) {
        totalDist += d;
        validReadings++;
      }
      delay(200);
    }

    if (validReadings >= 3) {
      binHeightCm = totalDist / validReadings;
      Serial.print("[Auto-Calibration] ✅ Calibrated Empty Depth: ");
      Serial.print(binHeightCm, 1);
      Serial.println(" cm");
      Serial.println("[Auto-Calibration] Your empty container will now accurately report 0% full!");
    } else {
      Serial.print("[Auto-Calibration] ⚠️ Surface reflection weak. Using fallback depth: ");
      Serial.print(binHeightCm, 1);
      Serial.println(" cm");
    }
    Serial.println("----------------------------------------------\n");
  }
}

// Function to measure distance using HC-SR04 ultrasonic sensor
float measureDistanceCm() {
  // Clear the trigger
  digitalWrite(TRIG_PIN, LOW);
  delayMicroseconds(2);

  // Trigger sound pulse for 10 microseconds
  digitalWrite(TRIG_PIN, HIGH);
  delayMicroseconds(10);
  digitalWrite(TRIG_PIN, LOW);

  // Read the echo return time in microseconds (timeout 30ms = ~5 meters max)
  long duration = pulseIn(ECHO_PIN, HIGH, 30000);

  if (duration == 0) {
    // Sensor reading timed out
    return -1.0;
  }

  // Speed of sound = 343 m/s = 0.0343 cm/microsecond
  // Distance = (duration * speed) / 2
  float distance = (duration * 0.0343) / 2.0;
  return distance;
}

void sendTelemetry() {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("[WiFi] Lost connection, attempting to reconnect...");
    WiFi.reconnect();
    return;
  }

  float distanceCm = measureDistanceCm();

  if (distanceCm < 0) {
    Serial.println("[Sensor] Warning: Ultrasonic echo timeout!");
    return;
  }

  // Calculate fill percentage based on calibrated bin height
  // As waste accumulates, distance to sensor decreases
  float filledHeight = binHeightCm - distanceCm;
  if (filledHeight < 0) filledHeight = 0;
  if (filledHeight > binHeightCm) filledHeight = binHeightCm;

  int fillLevelPercent = round((filledHeight / binHeightCm) * 100.0);

  Serial.println("\n----------------------------------------------");
  Serial.print("[Sensor] Distance to Surface: ");
  Serial.print(distanceCm, 1);
  Serial.println(" cm");
  Serial.print("[Sensor] Calibrated Depth:    ");
  Serial.print(binHeightCm, 1);
  Serial.println(" cm");
  Serial.print("[Calculated] Fill Level:      ");
  Serial.print(fillLevelPercent);
  Serial.println("%");

  // Actuate Local Alerts (Buzzer & LED) based on Fill Threshold
  if (fillLevelPercent >= 80) {
    Serial.println("[ALERT] ⚠️ Critical Overflow (>=80%)! Triggering Buzzer Alarm!");
    // Sound 3 rapid audible alert beeps
    for (int i = 0; i < 3; i++) {
      digitalWrite(BUZZER_PIN, HIGH);
      digitalWrite(LED_PIN, HIGH);
      delay(150);
      digitalWrite(BUZZER_PIN, LOW);
      digitalWrite(LED_PIN, LOW);
      delay(100);
    }
    digitalWrite(LED_PIN, HIGH); // Keep warning LED illuminated
  } else {
    // Normal level: Keep buzzer silent
    digitalWrite(BUZZER_PIN, LOW);
  }

  // Construct JSON Payload
  String jsonPayload = "{";
  jsonPayload += "\"dustbin_id\":\"" + String(DUSTBIN_ID) + "\",";
  jsonPayload += "\"distance_cm\":" + String(distanceCm, 1) + ",";
  jsonPayload += "\"fill_level\":" + String(fillLevelPercent) + ",";
  jsonPayload += "\"bin_height_cm\":" + String(binHeightCm, 1) + ",";
  jsonPayload += "\"battery_pct\":95";
  jsonPayload += "}";

  Serial.print("[HTTP POST] Payload: ");
  Serial.println(jsonPayload);

  // Send HTTP POST Request
  HTTPClient http;
  http.begin(SERVER_URL);
  http.addHeader("Content-Type", "application/json");

  int httpResponseCode = http.POST(jsonPayload);

  if (httpResponseCode > 0) {
    String response = http.getString();
    Serial.print("[HTTP] Success Code: ");
    Serial.println(httpResponseCode);
    Serial.print("[Database Response]: ");
    Serial.println(response);

    // Blink LED briefly to indicate successful transmission
    digitalWrite(LED_PIN, LOW);
    delay(100);
    digitalWrite(LED_PIN, HIGH);
  } else {
    Serial.print("[HTTP] Error on sending POST: ");
    Serial.println(httpResponseCode);
    Serial.println(http.errorToString(httpResponseCode).c_str());
  }

  http.end();
}

void loop() {
  unsigned long currentMillis = millis();

  // Transmit telemetry periodically
  if (currentMillis - lastSendTime >= SEND_INTERVAL_MS) {
    lastSendTime = currentMillis;
    sendTelemetry();
  }
}
