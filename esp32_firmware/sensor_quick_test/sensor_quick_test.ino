/*
  =============================================================================
  HC-SR04 Ultrasonic Sensor Quick Hardware Diagnostic Test (No Wi-Fi Needed)
  Use this sketch to instantly verify your wiring and ultrasonic sensor!
  =============================================================================
  Wiring:
    - HC-SR04 VCC   -> ESP32 VIN (Must be 5V, NOT 3.3V!)
    - HC-SR04 GND   -> ESP32 GND
    - HC-SR04 TRIG  -> ESP32 GPIO 13
    - HC-SR04 ECHO  -> ESP32 GPIO 14 (Connect directly or via 1k resistor)
  =============================================================================
*/

const int TRIG_PIN = 13;
const int ECHO_PIN = 14;

void setup() {
  Serial.begin(115200);
  delay(1000);

  pinMode(TRIG_PIN, OUTPUT);
  pinMode(ECHO_PIN, INPUT);

  digitalWrite(TRIG_PIN, LOW);

  Serial.println("\n=======================================================");
  Serial.println("  HC-SR04 Hardware Diagnostic Utility");
  Serial.println("  Testing GPIO 13 (TRIG) and GPIO 14 (ECHO)...");
  Serial.println("=======================================================\n");
}

void loop() {
  // 1. Check if ECHO pin is stuck HIGH or LOW before trigger
  int echoInitial = digitalRead(ECHO_PIN);

  // 2. Clear and trigger 10-microsecond ultrasonic pulse
  digitalWrite(TRIG_PIN, LOW);
  delayMicroseconds(2);
  digitalWrite(TRIG_PIN, HIGH);
  delayMicroseconds(10);
  digitalWrite(TRIG_PIN, LOW);

  // 3. Measure echo return duration (35000 us timeout = ~6 meters)
  unsigned long duration = pulseIn(ECHO_PIN, HIGH, 35000);

  if (duration == 0) {
    Serial.print("[DIAGNOSTIC] ❌ FAILED: Timeout (duration = 0 us). ECHO Pin was: ");
    Serial.println(echoInitial == HIGH ? "STUCK HIGH" : "LOW (No pulse detected)");
    Serial.println("   -> Checklist:");
    Serial.println("      1. Is HC-SR04 VCC connected to VIN (5V)? (3.3V won't work!)");
    Serial.println("      2. Are TRIG (13) and ECHO (14) swapped?");
    Serial.println("      3. If using voltage divider, remove resistors and connect ECHO directly to GPIO 14 to test.");
    Serial.println("      4. Check that HC-SR04 GND is plugged into ESP32 GND.");
  } else {
    float distanceCm = (duration * 0.0343f) / 2.0f;
    Serial.print("[DIAGNOSTIC] ✅ SUCCESS! Raw Duration: ");
    Serial.print(duration);
    Serial.print(" us | Distance: ");
    Serial.print(distanceCm, 1);
    Serial.println(" cm");
  }

  delay(1000); // Test once per second
}
