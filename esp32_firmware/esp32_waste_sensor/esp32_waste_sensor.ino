/*
  =============================================================================
  AI-Based Smart Waste Management System - ESP32 IoT Node Firmware (Production)
  Target: Live Render Backend (Updates your Vercel Dashboard in Real-Time!)
  =============================================================================
  Hardware Connections:
    1. ESP32 VIN   -> HC-SR04 VCC (5V Power from USB)
    2. ESP32 GND   -> HC-SR04 GND, Buzzer -, LED Cathode
    3. ESP32 IO13  -> HC-SR04 TRIG (GPIO 13)
    4. ESP32 IO14  -> HC-SR04 ECHO (GPIO 14 - Direct wire, NO resistors)
    5. ESP32 IO4   -> Piezo Buzzer + (GPIO 4 via 100 Ohm)
    6. ESP32 IO27  -> Status LED Anode (GPIO 27 via 130 Ohm)
  =============================================================================
*/

#include <WiFi.h>
#include <WiFiClientSecure.h>
#include <HTTPClient.h>

// =============================================================================
// --- 1. Wi-Fi Configuration ---
// =============================================================================
const char* WIFI_SSID     = "SUDARSHAN 9159";      
const char* WIFI_PASSWORD = "2235mE1^";            

// =============================================================================
// --- 2. Target Server (Live Render Cloud - Connected to Vercel!) ---
// =============================================================================
const char* SERVER_URL    = "https://ecoroute-ai-v4jd.onrender.com/api/sensors/telemetry";

// =============================================================================
// --- 3. Hardware & Dustbin Parameters ---
// =============================================================================
const char* DUSTBIN_ID    = "DB-003"; 

// YOUR PHYSICAL DUSTBIN DEPTH:
// Your sensor measured 23 cm to the bottom of the empty dustbin!
// When empty = 23 cm (0% full). When waste/phone is added, distance gets smaller.
float binHeightCm         = 23.0f; 

const int TRIG_PIN   = 13; // HC-SR04 TRIG (GPIO 13)
const int ECHO_PIN   = 14; // HC-SR04 ECHO (GPIO 14 - Direct wire)
const int BUZZER_PIN = 4;  // Piezo Buzzer (GPIO 4)
const int LED_PIN    = 27; // Status LED (GPIO 27)

// Telemetry interval (transmit every 4 seconds)
const unsigned long SEND_INTERVAL_MS = 4000; 
unsigned long lastSendTime = 0;

// Single ultrasonic pulse measurement
float singlePingCm() {
  digitalWrite(TRIG_PIN, LOW);
  delayMicroseconds(4);
  digitalWrite(TRIG_PIN, HIGH);
  delayMicroseconds(10);
  digitalWrite(TRIG_PIN, LOW);

  unsigned long duration = pulseIn(ECHO_PIN, HIGH, 35000);
  if (duration == 0) return -1.0f; // No echo received
  return (duration * 0.0343f) / 2.0f;
}

// Multi-sample filter for steady readings
float measureDistanceCm() {
  float readings[3];
  int count = 0;
  for (int i = 0; i < 3; i++) {
    float d = singlePingCm();
    if (d >= 2.0f && d <= 450.0f) readings[count++] = d;
    delay(25);
  }
  if (count == 3) {
    if ((readings[0] <= readings[1] && readings[1] <= readings[2]) ||
        (readings[2] <= readings[1] && readings[1] <= readings[0])) return readings[1];
    if ((readings[1] <= readings[0] && readings[0] <= readings[2]) ||
        (readings[2] <= readings[0] && readings[0] <= readings[1])) return readings[0];
    return readings[2];
  }
  if (count >= 1) return readings[0];
  return -1.0f;
}

void sendTelemetry() {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("[WiFi] ⚠️ Disconnected. Reconnecting to Wi-Fi...");
    WiFi.reconnect();
    return;
  }

  float distanceCm = measureDistanceCm();
  int fillLevelPercent = 0;

  // =========================================================================
  // LOGIC FIX:
  // Your bin is 23 cm tall.
  // 1. If distance is close to the bottom (within 1.5 cm of 23 cm) or timeout:
  //    The bin is completely EMPTY -> ALWAYS report 0%!
  // 2. If distance is smaller (e.g. 5 to 15 cm):
  //    An object/phone is inside -> calculate exact fill percentage!
  // =========================================================================
  if (distanceCm < 0 || distanceCm >= (binHeightCm - 1.5f)) {
    // Bin is empty!
    distanceCm = binHeightCm; // Sets to 23.0 cm
    fillLevelPercent = 0;     // 0% Empty!

    Serial.println("\n----------------------------------------------");
    Serial.println("[Sensor] 🗑️ Dustbin is EMPTY (0% Full)");
    Serial.print("[Sensor] Distance to Bottom: "); Serial.print(distanceCm, 1); Serial.println(" cm");
    Serial.println("[Calculated] Fill Level:     0%");
  } else {
    // Phone or waste is inside the bin
    float filledHeight = binHeightCm - distanceCm;
    if (filledHeight < 0.0f) filledHeight = 0.0f;
    if (filledHeight > binHeightCm) filledHeight = binHeightCm;

    fillLevelPercent = (int)round((filledHeight / binHeightCm) * 100.0f);

    Serial.println("\n----------------------------------------------");
    Serial.print("[Sensor] 📦 Waste/Phone Inside Bin! Distance: "); Serial.print(distanceCm, 1); Serial.println(" cm");
    Serial.print("[Calculated] Fill Level:                    "); Serial.print(fillLevelPercent); Serial.println("%");
  }

  // Local Buzzer & LED Alert if Critical (>= 80%)
  if (fillLevelPercent >= 80) {
    Serial.println("[ALERT] ⚠️ Critical Overflow! Buzzer Beeping!");
    for (int i = 0; i < 3; i++) {
      digitalWrite(BUZZER_PIN, HIGH);
      digitalWrite(LED_PIN, HIGH);
      delay(120);
      digitalWrite(BUZZER_PIN, LOW);
      digitalWrite(LED_PIN, LOW);
      delay(80);
    }
    digitalWrite(LED_PIN, HIGH);
  } else {
    digitalWrite(LED_PIN, HIGH);
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

  Serial.print("[Cloud POST]: ");
  Serial.println(jsonPayload);

  // Send over Secure HTTPS to Render Cloud
  WiFiClientSecure secureClient;
  secureClient.setInsecure();

  HTTPClient http;
  http.setTimeout(4500);

  if (http.begin(secureClient, SERVER_URL)) {
    http.addHeader("Content-Type", "application/json");
    int httpResponseCode = http.POST(jsonPayload);

    if (httpResponseCode > 0) {
      Serial.print("[HTTP Success] Code: ");
      Serial.print(httpResponseCode);
      Serial.print(" | Server: ");
      Serial.println(http.getString());

      // Blink LED to confirm transmission
      digitalWrite(LED_PIN, LOW);
      delay(60);
      digitalWrite(LED_PIN, HIGH);
    } else {
      Serial.print("[HTTP Error]: ");
      Serial.println(httpResponseCode);
      Serial.println(http.errorToString(httpResponseCode).c_str());
    }
    http.end();
  }
}

void setup() {
  Serial.begin(115200);
  delay(1000);

  pinMode(TRIG_PIN, OUTPUT);
  pinMode(ECHO_PIN, INPUT);
  pinMode(LED_PIN, OUTPUT);
  pinMode(BUZZER_PIN, OUTPUT);

  digitalWrite(TRIG_PIN, LOW);
  digitalWrite(LED_PIN, LOW);
  digitalWrite(BUZZER_PIN, LOW);

  Serial.println("\n=======================================================");
  Serial.println("  EcoRoute AI - ESP32 Smart Waste IoT Sensor Starting  ");
  Serial.println("=======================================================");

  // Auto-Detect Empty Bin Depth on Startup:
  // If the bin is empty when powered on, it accurately locks the baseline!
  Serial.println("[Auto-Detect] Measuring empty bin depth...");
  float detectedDist = 0;
  int goodSamples = 0;
  for (int i = 0; i < 5; i++) {
    float d = singlePingCm();
    if (d >= 10.0f && d <= 100.0f) {
      detectedDist += d;
      goodSamples++;
    }
    delay(100);
  }

  if (goodSamples >= 3) {
    binHeightCm = detectedDist / goodSamples;
    Serial.print("[Auto-Detect] ✅ Empty Bin Depth detected as: ");
    Serial.print(binHeightCm, 1);
    Serial.println(" cm");
  } else {
    binHeightCm = 23.0f; // Default to your 23 cm dustbin
    Serial.print("[Auto-Detect] Using calibrated depth: ");
    Serial.print(binHeightCm, 1);
    Serial.println(" cm");
  }

  WiFi.mode(WIFI_STA);
  WiFi.setAutoReconnect(true);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  Serial.print("[WiFi] Connecting to ");
  Serial.println(WIFI_SSID);

  int attempts = 0;
  bool toggle = false;
  while (WiFi.status() != WL_CONNECTED && attempts < 40) {
    toggle = !toggle;
    digitalWrite(LED_PIN, toggle ? HIGH : LOW);
    delay(500);
    Serial.print(".");
    attempts++;
  }

  if (WiFi.status() == WL_CONNECTED) {
    digitalWrite(LED_PIN, HIGH);
    Serial.println("\n[WiFi] ✅ Connected Successfully!");
    Serial.print("[WiFi] IP: ");
    Serial.println(WiFi.localIP());
  } else {
    digitalWrite(LED_PIN, LOW);
    Serial.println("\n[WiFi] ⚠️ Wi-Fi timed out. Will auto-retry.");
  }
}

void loop() {
  unsigned long currentMillis = millis();
  if (currentMillis - lastSendTime >= SEND_INTERVAL_MS) {
    lastSendTime = currentMillis;
    sendTelemetry();
  }
}
