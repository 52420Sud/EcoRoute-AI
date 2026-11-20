/*
  =============================================================================
  AI-Based Smart Waste Management System - ESP32 IoT Node Firmware (Production)
  Compatible with: ESP32 DevKit V1 (DOIT) + HC-SR04 Ultrasonic Sensor + Buzzer + LED
  =============================================================================
  Circuit Connections:
    1. ESP32 VIN       -> HC-SR04 VCC (5V Power from USB - MUST be 5V, not 3.3V!)
    2. ESP32 GND       -> Common Ground Rail (HC-SR04 GND, Buzzer -, LED Cathode)
    3. ESP32 IO13      -> HC-SR04 TRIG (GPIO 13)
    4. ESP32 IO14      -> HC-SR04 ECHO (GPIO 14 - DIRECT connection, NO resistor divider!)
    5. ESP32 IO4       -> Piezo Buzzer + (GPIO 4 via R4 100 Ohm resistor)
    6. ESP32 IO27      -> Status LED Anode (GPIO 27 via R3 130 Ohm resistor)
  =============================================================================
*/

#include <WiFi.h>
#include <WiFiClientSecure.h>
#include <HTTPClient.h>

// =============================================================================
// --- 1. Wi-Fi Configuration ---
// =============================================================================
const char* WIFI_SSID     = "SUDARSHAN 9159";      // <-- Your Wi-Fi SSID
const char* WIFI_PASSWORD = "2235mE1^";            // <-- Your Wi-Fi password

// =============================================================================
// --- 2. Backend Server Endpoint Selection ---
// Choose between Cloud Render (Production for Vercel) or Local Laptop
// =============================================================================
// Option A: Live Render Cloud Backend (Updates your Vercel Dashboard in real-time!)
const char* SERVER_URL    = "https://ecoroute-ai-v4jd.onrender.com/api/sensors/telemetry";
const bool USE_HTTPS      = true;

// Option B: Local Laptop Backend (Uncomment if testing locally on same Wi-Fi)
// const char* SERVER_URL = "http://10.156.67.76:5000/api/sensors/telemetry";
// const bool USE_HTTPS   = false;

// =============================================================================
// --- 3. Hardware & Dustbin Parameters ---
// =============================================================================
const char* DUSTBIN_ID        = "DB-003"; // Assigned Dustbin ID

// Calibration settings:
const bool AUTO_CALIBRATE_ON_BOOT = true;
float binHeightCm                 = 30.0f; // Default container depth in cm (measure with ruler)

// Pin Definitions:
const int TRIG_PIN   = 13; // HC-SR04 Trigger (ESP32 IO13)
const int ECHO_PIN   = 14; // HC-SR04 Echo (ESP32 IO14 - Direct connection)
const int BUZZER_PIN = 4;  // Piezo Buzzer (ESP32 IO4)
const int LED_PIN    = 27; // External Status LED (ESP32 IO27)

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

  Serial.println("\n=======================================================");
  Serial.println("  EcoRoute AI - ESP32 Smart Waste IoT Sensor Starting  ");
  Serial.println("  Pins: TRIG=13, ECHO=14, BUZZER=4, LED=27             ");
  Serial.println("=======================================================");

  // Set Wi-Fi to Station Mode & Enable Auto-Reconnect
  WiFi.mode(WIFI_STA);
  WiFi.setAutoReconnect(true);

  // Connect to Wi-Fi with timeout
  Serial.print("[WiFi] Connecting to: ");
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
    Serial.println("\n[WiFi] ✅ Connected Successfully!");
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
    Serial.println("\n-------------------------------------------------------");
    Serial.println("[Auto-Calibration] Sampling empty container depth in 2 seconds...");
    Serial.println("[Auto-Calibration] Ensure container is EMPTY under the sensor!");
    delay(2000);

    float totalDist = 0;
    int validReadings = 0;
    for (int i = 0; i < 5; i++) {
      float d = measureDistanceCm();
      if (d > 3.0f && d < 400.0f) {
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
    } else {
      Serial.print("[Auto-Calibration] ⚠️ Surface reflection weak. Using fallback depth: ");
      Serial.print(binHeightCm, 1);
      Serial.println(" cm");
    }
    Serial.println("-------------------------------------------------------\n");
  }

  // Ensure minimum depth to prevent division-by-zero
  if (binHeightCm < 5.0f) {
    binHeightCm = 30.0f;
  }
}

// Single ultrasonic ping measurement with microsecond timing
float singlePingCm() {
  // Ensure trigger pin is low
  digitalWrite(TRIG_PIN, LOW);
  delayMicroseconds(4);

  // Send 10-microsecond trigger pulse
  digitalWrite(TRIG_PIN, HIGH);
  delayMicroseconds(10);
  digitalWrite(TRIG_PIN, LOW);

  // Read echo time in microseconds (35ms timeout = ~600 cm maximum)
  unsigned long duration = pulseIn(ECHO_PIN, HIGH, 35000);

  if (duration == 0) {
    return -1.0f; // Timed out (no pulse detected)
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
    delay(30); // Wait between pings so ultrasonic echoes attenuate
  }

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
  float distanceCm = measureDistanceCm();

  if (distanceCm < 0) {
    Serial.println("\n[Sensor] ❌ HC-SR04 Echo Timeout (distanceCm = -1)!");
    Serial.println("  ==> HARDWARE FIX CHECKLIST:");
    Serial.println("  1. Connect HC-SR04 ECHO directly to ESP32 GPIO 14 (REMOVE the 4.7k/3.3k resistors).");
    Serial.println("  2. Ensure HC-SR04 VCC is plugged into VIN (5V), NOT 3.3V!");
    Serial.println("  3. Verify TRIG is in GPIO 13 and ECHO is in GPIO 14 (not swapped).");
    Serial.println("  4. Ensure HC-SR04 GND is plugged into ESP32 GND.");
    return;
  }

  // Calculate fill percentage based on container depth
  // As waste accumulates, distance to the ultrasonic sensor decreases
  if (binHeightCm < 5.0f) binHeightCm = 30.0f;

  float filledHeight = binHeightCm - distanceCm;
  if (filledHeight < 0.0f) filledHeight = 0.0f;
  if (filledHeight > binHeightCm) filledHeight = binHeightCm;

  int fillLevelPercent = (int)round((filledHeight / binHeightCm) * 100.0f);

  Serial.println("\n-------------------------------------------------------");
  Serial.print("[Sensor] Distance to Waste: ");
  Serial.print(distanceCm, 1);
  Serial.println(" cm");
  Serial.print("[Sensor] Calibrated Depth:  ");
  Serial.print(binHeightCm, 1);
  Serial.println(" cm");
  Serial.print("[Calculated] Fill Level:    ");
  Serial.print(fillLevelPercent);
  Serial.println("%");

  // Actuate Local Alerts (Buzzer & LED) for Critical Overflow (>=80%)
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
    digitalWrite(LED_PIN, HIGH); // Keep warning LED lit
  }
  digitalWrite(BUZZER_PIN, LOW);

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

  // Transmit over Wi-Fi
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("[WiFi] ⚠️ Not connected. Attempting reconnection...");
    WiFi.reconnect();
    return;
  }

  HTTPClient http;
  http.setTimeout(5000);

  bool beginSuccess = false;
  if (USE_HTTPS) {
    WiFiClientSecure secureClient;
    secureClient.setInsecure(); // Allows connecting to Render HTTPS without bundling SSL root certs
    beginSuccess = http.begin(secureClient, SERVER_URL);
  } else {
    WiFiClient standardClient;
    beginSuccess = http.begin(standardClient, SERVER_URL);
  }

  if (beginSuccess) {
    http.addHeader("Content-Type", "application/json");
    int httpResponseCode = http.POST(jsonPayload);

    if (httpResponseCode > 0) {
      String response = http.getString();
      Serial.print("[HTTP] ✅ Success Code: ");
      Serial.println(httpResponseCode);
      Serial.print("[Server Response]: ");
      Serial.println(response);

      // Quick LED blink on transmission
      digitalWrite(LED_PIN, LOW);
      delay(80);
      digitalWrite(LED_PIN, HIGH);
    } else {
      Serial.print("[HTTP] ❌ Error sending POST: ");
      Serial.println(httpResponseCode);
      Serial.println(http.errorToString(httpResponseCode).c_str());
    }
    http.end();
  } else {
    Serial.println("[HTTP] ❌ Error: Unable to begin connection to server.");
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
