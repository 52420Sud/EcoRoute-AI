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

// Container Depth: measure from the sensor down to the bottom of the empty bin.
// Default: 30.0 cm. (When empty/nothing inside = 0% full; when full = 80-100% full)
float binHeightCm         = 30.0f; 

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

  // 35ms timeout (~6 meters)
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
  return -1.0f; // Timeout / No reflection
}

void sendTelemetry() {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("[WiFi] ⚠️ Disconnected. Reconnecting to Wi-Fi...");
    WiFi.reconnect();
    return;
  }

  float distanceCm = measureDistanceCm();
  int fillLevelPercent = 0;

  // KEY LOGIC FIX:
  // If no object is detected (echo timeout) OR measured distance >= bin height,
  // that means the bin is EMPTY (phone/trash was removed)!
  if (distanceCm < 0 || distanceCm >= binHeightCm) {
    distanceCm = binHeightCm; // Sets to 30.0 cm
    fillLevelPercent = 0;     // Correctly reports 0% (Empty)

    Serial.println("\n----------------------------------------------");
    Serial.println("[Sensor] 🗑️ Bin is EMPTY (Phone/Trash Removed)!");
    Serial.print("[Sensor] Distance to Surface: "); Serial.print(distanceCm, 1); Serial.println(" cm");
    Serial.println("[Calculated] Fill Level:      0% (Empty)");
  } else {
    // An object (phone, trash, hand) is inside the container!
    float filledHeight = binHeightCm - distanceCm;
    if (filledHeight < 0.0f) filledHeight = 0.0f;
    if (filledHeight > binHeightCm) filledHeight = binHeightCm;

    fillLevelPercent = (int)round((filledHeight / binHeightCm) * 100.0f);

    Serial.println("\n----------------------------------------------");
    Serial.print("[Sensor] 📦 Waste/Phone Detected at: "); Serial.print(distanceCm, 1); Serial.println(" cm");
    Serial.print("[Calculated] Fill Level:            "); Serial.print(fillLevelPercent); Serial.println("%");
  }

  // Local Buzzer & LED Alert if Critical (>= 80%)
  if (fillLevelPercent >= 80) {
    Serial.println("[ALERT] ⚠️ Critical Overflow! Buzzer Alert Active!");
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
    digitalWrite(LED_PIN, HIGH); // Steady ON when normal & connected
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

  Serial.print("[Cloud POST Payload]: ");
  Serial.println(jsonPayload);

  // Transmit over Secure HTTPS to Render Cloud Backend
  WiFiClientSecure secureClient;
  secureClient.setInsecure(); // Connects over SSL without needing local root certificates

  HTTPClient http;
  http.setTimeout(4500);

  if (http.begin(secureClient, SERVER_URL)) {
    http.addHeader("Content-Type", "application/json");
    int httpResponseCode = http.POST(jsonPayload);

    if (httpResponseCode > 0) {
      Serial.print("[HTTP Success] Code: ");
      Serial.print(httpResponseCode);
      Serial.print(" | Server Response: ");
      Serial.println(http.getString());

      // Blink LED briefly to confirm cloud transmission
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
  Serial.println("  Pins: TRIG=13, ECHO=14, BUZZER=4, LED=27             ");
  Serial.println("  Target: Render Cloud (Synced to Vercel Frontend)     ");
  Serial.println("=======================================================");

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
    Serial.print("[Cloud Server]: ");
    Serial.println(SERVER_URL);
  } else {
    digitalWrite(LED_PIN, LOW);
    Serial.println("\n[WiFi] ⚠️ Connection timed out. ESP32 will auto-retry in loop.");
  }
}

void loop() {
  unsigned long currentMillis = millis();
  if (currentMillis - lastSendTime >= SEND_INTERVAL_MS) {
    lastSendTime = currentMillis;
    sendTelemetry();
  }
}
