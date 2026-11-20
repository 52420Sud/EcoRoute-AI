/*
  =============================================================================
  AI-Based Smart Waste Management System - ESP32 IoT Node Firmware (Production)
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
#include <WiFiClient.h>
#include <HTTPClient.h>

// =============================================================================
// --- 1. Wi-Fi Configuration ---
// Connect your ESP32 to the same Wi-Fi network as the laptop/server
// =============================================================================
const char* WIFI_SSID     = "SUDARSHAN 9159";      // <-- Put your Wi-Fi SSID here
const char* WIFI_PASSWORD = "2235mE1^";  // <-- Put your Wi-Fi password here

// =============================================================================
// --- 2. Backend Server Endpoint ---
// Laptop IP on current Wi-Fi network: 10.255.74.76
// =============================================================================
const char* SERVER_URL    = "http://10.255.74.76:5000/api/sensors/telemetry";

// =============================================================================
// --- 3. Hardware & Dustbin Parameters ---
// =============================================================================
const char* DUSTBIN_ID        = "DB-003"; // Assigned Dustbin ID

// Calibration settings:
// Default to fixed 30.0 cm depth. If you want automatic calibration at boot, set to true.
const bool AUTO_CALIBRATE_ON_BOOT = false;
float binHeightCm                 = 30.0f; // Standard container depth in cm (30 cm = 0% full, 5 cm = 83% full)

// Exact Pin Definitions from Circuit Schematic:
const int TRIG_PIN   = 13; // HC-SR04 Trigger (ESP32 IO13)
const int ECHO_PIN   = 14; // HC-SR04 Echo (ESP32 IO14 via R2 4.7k / R1 3.3k divider)
const int BUZZER_PIN = 4;  // Piezo Buzzer (ESP32 IO4 via R4 100 ohm)
const int LED_PIN    = 27; // External Status LED (ESP32 IO27 via R3 130 ohm)

// Telemetry transmit interval (5000 ms = every 5 seconds)
const unsigned long SEND_INTERVAL_MS = 5000;
unsigned long lastSendTime = 0;

// Forward function declarations
float singlePingCm();
float measureDistanceCm();
void sendTelemetry();

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

  // Set Wi-Fi to Station Mode & Enable Auto-Reconnect
  WiFi.mode(WIFI_STA);
  WiFi.setAutoReconnect(true);

  // Connect to Wi-Fi with a 20-second timeout to prevent watchdog freeze
  Serial.print("Connecting to Wi-Fi: ");
  Serial.println(WIFI_SSID);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  int attempts = 0;
  bool ledToggle = false;
  while (WiFi.status() != WL_CONNECTED && attempts < 40) {
    ledToggle = !ledToggle;
    digitalWrite(LED_PIN, ledToggle ? HIGH : LOW); // Blink status LED during search
    delay(500);
    Serial.print(".");
    attempts++;
  }

  if (WiFi.status() == WL_CONNECTED) {
    digitalWrite(LED_PIN, HIGH); // Solid LED indicates Wi-Fi connected
    Serial.println("\n[WiFi] Connected Successfully!");
    Serial.print("[WiFi] ESP32 IP Address: ");
    Serial.println(WiFi.localIP());
    Serial.print("[Server] Target URL: ");
    Serial.println(SERVER_URL);
  } else {
    digitalWrite(LED_PIN, LOW);
    Serial.println("\n[WiFi] ⚠️ Wi-Fi connection timed out!");
    Serial.println("[WiFi] Check SSID/Password. ESP32 will auto-retry in background.");
  }

  // Auto-Calibrate Empty Container Depth (if enabled)
  if (AUTO_CALIBRATE_ON_BOOT) {
    Serial.println("\n----------------------------------------------");
    Serial.println("[Auto-Calibration] Sampling empty container depth in 2 seconds...");
    Serial.println("[Auto-Calibration] Ensure container is EMPTY under the sensor!");
    delay(2000);

    float totalDist = 0;
    int validReadings = 0;
    for (int i = 0; i < 5; i++) {
      float d = measureDistanceCm();
      if (d > 5.0f && d < 400.0f) {
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
      Serial.println("[Auto-Calibration] Empty container will accurately report 0% full!");
    } else {
      Serial.print("[Auto-Calibration] ⚠️ Surface reflection weak. Using fallback depth: ");
      Serial.print(binHeightCm, 1);
      Serial.println(" cm");
    }
    Serial.println("----------------------------------------------\n");
  }

  // Ensure minimum depth to prevent division-by-zero
  if (binHeightCm < 5.0f) {
    binHeightCm = 30.0f;
  }
}

// Single ultrasonic ping measurement
float singlePingCm() {
  // Ensure trigger pin is low
  digitalWrite(TRIG_PIN, LOW);
  delayMicroseconds(4);

  // Send 10-microsecond trigger pulse
  digitalWrite(TRIG_PIN, HIGH);
  delayMicroseconds(10);
  digitalWrite(TRIG_PIN, LOW);

  // Read echo time in microseconds (35ms timeout = ~6 meters maximum)
  unsigned long duration = pulseIn(ECHO_PIN, HIGH, 35000);

  if (duration == 0) {
    return -1.0f; // Timed out (no pulse received)
  }

  // Distance = (duration * speed of sound 0.0343 cm/us) / 2
  return (duration * 0.0343f) / 2.0f;
}

// 3-sample median filter for stable distance reading (with single-ping fallback)
float measureDistanceCm() {
  float readings[3];
  int count = 0;

  for (int i = 0; i < 3; i++) {
    float d = singlePingCm();
    if (d >= 2.0f && d <= 450.0f) {
      readings[count++] = d;
    }
    delay(30); // Wait between pings so ultrasonic echoes fully attenuate
  }

  // If median samples succeeded, calculate clean median
  if (count == 3) {
    if ((readings[0] <= readings[1] && readings[1] <= readings[2]) ||
        (readings[2] <= readings[1] && readings[1] <= readings[0])) return readings[1];
    if ((readings[1] <= readings[0] && readings[0] <= readings[2]) ||
        (readings[2] <= readings[0] && readings[0] <= readings[1])) return readings[0];
    return readings[2];
  }
  if (count == 2) return (readings[0] + readings[1]) / 2.0f;
  if (count == 1) return readings[0];

  // Fallback: one direct attempt
  return singlePingCm();
}

void sendTelemetry() {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("[WiFi] Not connected. Attempting reconnection...");
    WiFi.reconnect();
    return;
  }

  float distanceCm = measureDistanceCm();

  if (distanceCm < 0) {
    Serial.println("\n[Sensor] ⚠️ HC-SR04 Echo Timeout (No distance reading)!");
    Serial.println("  1. Verify HC-SR04 VCC is connected to VIN (5V), NOT 3.3V.");
    Serial.println("  2. Check if TRIG (GPIO 13) and ECHO (GPIO 14) are swapped.");
    Serial.println("  3. If using resistors on ECHO: try connecting ECHO directly to GPIO 14.");
    Serial.println("  4. Ensure sensor GND is connected to ESP32 GND.");
    return;
  }

  // Calculate fill percentage based on container depth
  // As waste accumulates, distance to the ultrasonic sensor decreases
  if (binHeightCm < 5.0f) binHeightCm = 30.0f; // Division-by-zero safeguard

  float filledHeight = binHeightCm - distanceCm;
  if (filledHeight < 0.0f) filledHeight = 0.0f;
  if (filledHeight > binHeightCm) filledHeight = binHeightCm;

  int fillLevelPercent = (int)round((filledHeight / binHeightCm) * 100.0f);

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

  // Actuate Local Alerts (Buzzer & LED) based on Fill Threshold (>= 80% Critical)
  if (fillLevelPercent >= 80) {
    Serial.println("[ALERT] ⚠️ Critical Overflow (>=80%)! Sounding Buzzer!");
    for (int i = 0; i < 3; i++) {
      digitalWrite(BUZZER_PIN, HIGH);
      digitalWrite(LED_PIN, HIGH);
      delay(120);
      digitalWrite(BUZZER_PIN, LOW);
      digitalWrite(LED_PIN, LOW);
      delay(80);
    }
    digitalWrite(LED_PIN, HIGH); // Keep warning LED illuminated
  }
  digitalWrite(BUZZER_PIN, LOW); // Explicitly ensure buzzer is off

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
  WiFiClient client;
  HTTPClient http;
  http.setTimeout(4000); // 4-second timeout prevents loop locking if server unreachable

  if (http.begin(client, SERVER_URL)) {
    http.addHeader("Content-Type", "application/json");
    int httpResponseCode = http.POST(jsonPayload);

    if (httpResponseCode > 0) {
      String response = http.getString();
      Serial.print("[HTTP] Success Code: ");
      Serial.println(httpResponseCode);
      Serial.print("[Server Response]: ");
      Serial.println(response);

      // Brief LED blink to indicate transmission success
      digitalWrite(LED_PIN, LOW);
      delay(80);
      digitalWrite(LED_PIN, HIGH);
    } else {
      Serial.print("[HTTP] Error sending POST: ");
      Serial.println(httpResponseCode);
      Serial.println(http.errorToString(httpResponseCode).c_str());
    }
    http.end();
  } else {
    Serial.println("[HTTP] Error: Unable to begin connection to server.");
  }
}

void loop() {
  unsigned long currentMillis = millis();

  // Transmit telemetry periodically
  if (currentMillis - lastSendTime >= SEND_INTERVAL_MS) {
    lastSendTime = currentMillis;
    sendTelemetry();
  }
}
