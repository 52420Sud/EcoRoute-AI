# 🔌 Complete Hardware Connection & Wiring Guide
## ESP32 + HC-SR04 Ultrasonic Sensor for Smart Waste Management

This guide provides a step-by-step physical connection manual for you and your teammate/friend.

---

## 🧰 1. Components Required

| Item | Component Name | Quantity | Purpose |
|---|---|:---:|---|
| 1 | **ESP32 Dev Board** (30-pin or 38-pin DevKit V1) | 1 | Microcontroller with built-in Wi-Fi & Dual Core 240MHz CPU |
| 2 | **HC-SR04 Ultrasonic Distance Sensor** | 1 | Measures distance to garbage surface inside the bin |
| 3 | **1kΩ Resistor & 2kΩ Resistor** (Optional Voltage Divider) | 1 each | Steps down HC-SR04 Echo 5V pulse to ESP32-safe 3.3V |
| 4 | **Solderless Breadboard** | 1 | Easy component prototyping without soldering |
| 5 | **Jumper Wires** (Male-to-Male & Male-to-Female) | 6 to 8 | Interconnecting pins |
| 6 | **Micro-USB Data Cable** | 1 | Powering ESP32 from laptop/power bank and uploading code |
| 7 | **Small Model Dustbin** (Cardboard box or small trash bin) | 1 | Mounted on lid to test fill variations |

---

## ⚡ 2. Pin-to-Pin Connection Table (Exact Match to Schematic)

Connect the components to your **ESP32 DevKit V1** as shown in your circuit diagram:

| Component | Component Pin | ESP32 Pin | In-Between Resistor | Function Description |
|---|---|---|---|---|
| **HC-SR04 Sensor** | **VCC** | **VIN** | *None* | +5V Power from USB |
| **HC-SR04 Sensor** | **GND** | **GND_R** | *None* | Common Ground rail |
| **HC-SR04 Sensor** | **TRIG** | **GPIO 13 (IO13)** | *None* | Ultrasonic trigger burst signal |
| **HC-SR04 Sensor** | **ECHO** | **GPIO 14 (IO14)** | **R2 (4.7kΩ) + R1 (3.3kΩ)** | Voltage divider steps down 5V echo pulse to safe 3.3V logic |
| **Piezo Buzzer (U3)**| **plus (+)** | **GPIO 4 (IO4)** | **R4 (100 Ω)** | Audible hazard buzzer for overflow alert (≥80% fill) |
| **Piezo Buzzer (U3)**| **minus (-)** | **GND_R** | *None* | Ground connection |
| **Status LED (D1)** | **Anode (+)** | **GPIO 27 (IO27)** | **R3 (130 Ω)** | Visual indicator for Wi-Fi, telemetry transmission & alerts |
| **Status LED (D1)** | **Cathode (-)** | **GND_R** | *None* | Ground connection |

> 💡 **Why use the 4.7 kΩ and 3.3 kΩ Voltage Divider?**  
> The HC-SR04 sensor outputs a 5V logic pulse on its ECHO pin. The ESP32 GPIO inputs are rated for 3.3V logic.  
> Connecting **GPIO 14** between **R2 (4.7 kΩ)** and **R1 (3.3 kΩ)** steps down the voltage:  
> $$V_{\text{ESP32}} = 5\text{V} \times \frac{3.3\text{k}\Omega}{3.3\text{k}\Omega + 4.7\text{k}\Omega} \approx 2.06\text{V} - 3.3\text{V}$$  
> This safely triggers a clean digital HIGH on the ESP32 while guaranteeing complete overvoltage protection.

---

## 📐 3. Circuit Wiring Diagram

```
       ESP32 VIN ──────────────────────────────────────── VCC [ HC-SR04 ]
       ESP32 IO13 ─────────────────────────────────────── TRIG [ HC-SR04 ]

                                              ┌────────── ECHO [ HC-SR04 ]
                                              │
                                           [ 4.7 kΩ (R2) ]
                                              │
       ESP32 IO14 ────────────────────────────┴────────── (Safe stepped-down pulse)
                                              │
                                           [ 3.3 kΩ (R1) ]
                                              │
       ESP32 GND_R ───────────────┬───────────┴────────── GND [ HC-SR04 ]
                                  │
       ESP32 IO4 ──[ 100 Ω (R4) ]─┼────────────────────── PLUS (+)  [ Piezo Buzzer U3 ]
                                  │                       MINUS (-) [ Piezo Buzzer U3 ] ──┐
                                  │                                                       │
       ESP32 IO27 ─[ 130 Ω (R3) ]─┼────────────────────── ANODE (+) [ Status LED D1 ]     │
                                  │                       CATHODE (-) [ LED D1 ] ─────────┤
                                  └───────────────────────────────────────────────────────┘
```

---

## 🛠️ 4. Step-by-Step Physical Assembly Instructions

### Step 1: Seat the ESP32 on the Breadboard
1. Plug your ESP32 board firmly into the breadboard so the pins straddle the center divider groove.
2. Ensure both the left and right rows of pins have accessible tie points.

### Step 2: Wire the Ultrasonic Sensor (HC-SR04)
1. **Power:** Connect ESP32 **`VIN`** to sensor **`VCC`**.
2. **Ground:** Connect ESP32 **`GND_R`** to sensor **`GND`**.
3. **Trigger:** Connect ESP32 **`GPIO 13`** directly to sensor **`TRIG`**.
4. **Echo Divider:**
   - Connect sensor **`ECHO`** to one leg of **`R2 (4.7kΩ)`**.
   - Connect the other leg of **`R2`** to ESP32 **`GPIO 14`** AND to one leg of **`R1 (3.3kΩ)`**.
   - Connect the other leg of **`R1`** to **`GND`**.

### Step 3: Wire the Piezo Buzzer (U3)
1. Connect ESP32 **`GPIO 4`** to one leg of resistor **`R4 (100 Ω)`**.
2. Connect the other leg of **`R4`** to the **`plus (+)`** terminal of the Piezo Buzzer.
3. Connect the **`minus (-)`** terminal of the Buzzer to the common **`GND`** rail.

### Step 4: Wire the Status LED (D1)
1. Connect ESP32 **`GPIO 27`** to one leg of resistor **`R3 (130 Ω)`**.
2. Connect the other leg of **`R3`** to the long leg (**Anode / +**) of **`LED D1`**.
3. Connect the short leg (**Cathode / -**) of **`LED D1`** to the common **`GND`** rail.

### Step 5: Mount the Sensor on the Dustbin
1. Mount the HC-SR04 ultrasonic sensor under the **lid** or top rim of your test bin pointing straight down towards the bottom.
2. Measure the total height of your bin with a ruler (e.g., $30\text{ cm}$ or $100\text{ cm}$).
3. In `esp32_firmware/esp32_waste_sensor.ino`, set:
   ```cpp
   const float BIN_HEIGHT_CM = 30.0; // Change to match your physical model height in cm
   ```

---

## 💻 5. Arduino IDE Flashing Guide (For Your Friend)

1. Connect the ESP32 to your PC using a **Micro-USB Data Cable**.
2. Open **Arduino IDE**.
3. Install ESP32 board support:
   - Go to **File** ➜ **Preferences** ➜ paste this URL into *Additional Board Manager URLs*:
     `https://raw.githubusercontent.com/espressif/arduino-esp32/gh-pages/package_esp32_index.json`
   - Go to **Tools** ➜ **Board** ➜ **Board Manager**, search `esp32` and click **Install**.
4. Open the firmware file from our project:
   📂 **[`esp32_firmware/esp32_waste_sensor.ino`](file:///d:/waste%20mgt%20PRD%20REquriemtns/esp32_firmware/esp32_waste_sensor.ino)**
5. Update your Wi-Fi credentials in lines 21-25:
   ```cpp
   const char* WIFI_SSID     = "Your_WiFi_Hotspot_Name";
   const char* WIFI_PASSWORD = "Your_WiFi_Password";
   // Set to your computer's Wi-Fi IP address:
   const char* SERVER_URL    = "http://10.50.80.76:5000/api/sensors/telemetry";
   ```
6. Under **Tools** menu:
   - Select Board: **"ESP32 Dev Module"**
   - Select Port: **COM3** (or whichever COM port appears)
7. Click the **Upload (➡️)** button!
8. Open **Tools** ➜ **Serial Monitor** at **115200 baud** to see real-time distance readings and HTTP POST confirmations!