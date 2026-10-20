# 🚀 Beginner-Friendly Setup Guide: Firebase Database, Auth & Hardware Integration

This comprehensive guide is designed for beginners. It explains how to set up **Firebase Authentication**, **Cloud Firestore Database**, and connect your friend's **ESP32 IoT hardware sensor** to feed live data into the system.

---

## 📑 Table of Contents
1. [Overview: How Data Flows](#1-overview-how-data-flows)
2. [Step-by-Step Firebase Console Setup (5 Minutes)](#2-step-by-step-firebase-console-setup-5-minutes)
   - [Step A: Create a Firebase Project](#step-a-create-a-firebase-project)
   - [Step B: Enable Email/Password Authentication](#step-b-enable-emailpassword-authentication)
   - [Step C: Create Cloud Firestore Database](#step-c-create-cloud-firestore-database)
   - [Step D: Get Your Firebase Web Config Keys](#step-d-get-your-firebase-web-config-keys)
3. [Connecting Firebase to the App (1-Click In-App Setup)](#3-connecting-firebase-to-the-app-1-click-in-app-setup)
4. [Hardware Integration: How Your Friend's ESP32 Sends Data](#4-hardware-integration-how-your-friends-esp32-sends-data)
   - [Hardware Circuit Diagram (ESP32 + HC-SR04)](#hardware-circuit-diagram-esp32--hc-sr04)
   - [Flashing the Code to the ESP32](#flashing-the-code-to-the-esp32)
   - [Testing the Hardware via cURL / Postman](#testing-the-hardware-via-curl--postman)
5. [User Authentication (Roles & Permissions)](#5-user-authentication-roles--permissions)
6. [Summary Checklist for Academic Review](#6-summary-checklist-for-academic-review)

---

## 1. Overview: How Data Flows

```
  [ESP32 Ultrasonic Sensor (HC-SR04)]
                 │
                 │ (Wi-Fi HTTP POST with distance_cm & battery_pct)
                 ▼
     [Local Node.js Server :5000] ──▶ Stores in SQLite (`server/waste_management.db`)
                 │
                 │ (Real-time Webhook / React Web App)
                 ▼
      [Firebase Cloud Firestore] ──▶ Live Cloud Database
                 ▲
                 │ (Email & Password Login / Role Verification)
        [Firebase Authentication]
```

- **ESP32 Hardware:** Measures the empty depth of the dustbin using high-frequency ultrasound waves (2cm - 400cm range) and computes fill percentage.
- **Node.js Express Backend:** Runs on your computer (`http://localhost:5000` or Wi-Fi IP `http://10.115.29.76:5000`) to collect hardware pings and guarantee zero data loss.
- **Firebase Firestore:** Synchronizes the latest bin status, public citizen complaints, and driver collection records to Google Cloud.
- **Firebase Auth:** Handles secure user registration and login for Citizens, Municipal Officers, and Sanitation Drivers.

---

## 2. Step-by-Step Firebase Console Setup (5 Minutes)

You don't need to write any backend code for Firebase—Google hosts everything! Just follow these easy steps:

### Step A: Create a Firebase Project
1. Open your web browser and go to: **[https://console.firebase.google.com/](https://console.firebase.google.com/)**
2. Sign in with your standard Google Account (Gmail).
3. Click **"Add project"** (or **"Create a project"**).
4. Enter a project name, for example: `smart-waste-management-2026`.
5. Google Analytics is optional (you can disable it for now to keep things fast and simple).
6. Click **"Create project"** and wait ~15 seconds until it says *"Your new project is ready"*. Click **Continue**.

---

### Step B: Enable Email/Password Authentication
1. In the left-hand sidebar menu, click on **Build** ➜ **Authentication**.
2. Click the blue **"Get started"** button.
3. Under the **"Sign-in method"** tab, click on **Email/Password**.
4. Toggle the first switch **"Enable"** to ON. (Leave *Email link (passwordless sign-in)* unchecked).
5. Click **"Save"**.
> ✅ Authentication is now active! Citizens, officers, and drivers can now sign up and log in.

---

### Step C: Create Cloud Firestore Database
1. In the left-hand sidebar menu, click on **Build** ➜ **Firestore Database**.
2. Click **"Create database"**.
3. Choose a database location close to you (e.g., `asia-south1 (Mumbai)` or `us-central1`).
4. Under **Secure rules**, choose **"Start in test mode"**.
   *(Test mode allows your web app and hardware to read and write without complex security rules during testing and project presentation).*
5. Click **"Create"** (or **"Enable"**).
> ✅ Cloud Firestore is now live and ready to receive dustbin telemetry and complaints!

---

### Step D: Get Your Firebase Web Config Keys
1. At the top of the left sidebar, click the **Gear icon (⚙️ Project Settings)** next to *Project Overview*.
2. Scroll down to the **"Your apps"** section at the bottom of the page.
3. Click the **Web icon (`</>`)**.
4. Enter an app nickname, e.g. `waste-mgt-web`, and click **"Register app"**.
5. You will see a code snippet like this:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSyD-xxxxxxxxxxxxxxxxxxxx",
  authDomain: "smart-waste-management-2026.firebaseapp.com",
  projectId: "smart-waste-management-2026",
  storageBucket: "smart-waste-management-2026.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdef123456"
};
```

6. Copy the keys inside that `firebaseConfig` object!

---

## 3. Connecting Firebase to the App (1-Click In-App Setup)

We built an automatic setup modal right into your running web app:

1. Open your web app at: **`http://localhost:5173/`**
2. In the top navigation bar, click the orange **"🔥 Firebase Setup"** button.
3. Paste the `firebaseConfig` snippet you copied from Google into the box.
4. Click **"Save & Connect to Firebase"**.
5. The button in the navbar will immediately change to green: **"🔥 Firebase Connected"**!

> 💡 **Bonus (Zero-Setup Demo Accounts):**
> Even if you haven't opened Firebase Console yet, you can test the system immediately!
> Click the **"👤 Sign In"** button on the top right, and click any of the 1-click demo logins:
> - **Demo Citizen** (`citizen@ecoroute.ai`)
> - **Demo Municipal Officer** (`admin@ecoroute.ai`)
> - **Demo Truck Driver** (`driver1@ecoroute.ai`)

---

## 4. Hardware Integration: How Your Friend's ESP32 Sends Data

Your friend is working on the hardware component (ESP32 microcontroller + HC-SR04 ultrasonic distance sensor). We have prepared the complete Arduino C++ code ready to flash!

### File Location in Project:
📂 **[`esp32_firmware/esp32_waste_sensor.ino`](file:///d:/waste%20mgt%20PRD%20REquriemtns/esp32_firmware/esp32_waste_sensor.ino)**

### Hardware Circuit Diagram (ESP32 + HC-SR04)
Connect the 4 pins of the HC-SR04 ultrasonic sensor to the ESP32 as follows:

| HC-SR04 Pin | ESP32 Pin | Note |
|---|---|---|
| **VCC** | **VIN / 5V** | Power supply (5V) |
| **GND** | **GND** | Ground |
| **TRIG** | **GPIO 5** | Trigger pulse pin |
| **ECHO** | **GPIO 18** | Echo return pulse pin (via 1kΩ / 2kΩ voltage divider recommended) |
| **Status LED** | **GPIO 2** | Built-in Blue LED (blinks when transmitting) |

---

### Flashing the Code to the ESP32

Ask your friend to follow these 4 steps in the **Arduino IDE**:

1. Open **Arduino IDE** and open [`esp32_firmware/esp32_waste_sensor.ino`](file:///d:/waste%20mgt%20PRD%20REquriemtns/esp32_firmware/esp32_waste_sensor.ino).
2. Edit lines 21-23 with your Wi-Fi name and password:
   ```cpp
   const char* WIFI_SSID     = "Your_WiFi_Name";
   const char* WIFI_PASSWORD = "Your_WiFi_Password";
   ```
3. Set the server URL to your computer's IP address (your current Wi-Fi IP is `10.115.29.76`):
   ```cpp
   const char* SERVER_URL = "http://10.115.29.76:5000/api/sensors/telemetry";
   ```
4. Select board: **"ESP32 Dev Module"**, connect via USB cable, and click **Upload (➡️)**!

### What the ESP32 Does:
- Every 10 seconds, it sends a 10µs ultrasonic burst.
- It measures how many centimeters of air are between the sensor (dustbin lid) and the garbage inside.
- If the bin is 100 cm deep and garbage is 10 cm from the top, it calculates:
  $$\text{Fill Level} = \frac{100 - 10}{100} \times 100\% = 90\% \text{ (Critical Alarm!)}$$
- It sends this JSON payload over Wi-Fi to your server:
  ```json
  {
    "dustbin_id": "DB-003",
    "distance_cm": 10.4,
    "bin_height_cm": 100.0,
    "battery_pct": 98
  }
  ```
- Your Node.js server receives it, writes it to SQLite, and updates the live web map instantly!

---

### Testing the Hardware via cURL / Postman (Without Physical ESP32)

You or your friend can test the endpoint right now from PowerShell or Command Prompt:

```powershell
curl.exe -X POST http://localhost:5000/api/sensors/telemetry `
  -H "Content-Type: application/json" `
  -d '{"dustbin_id":"DB-003","distance_cm":6,"battery_pct":94}'
```

Output:
```json
{
  "success": true,
  "message": "Telemetry processed and alert generated",
  "data": {
    "dustbin_id": "DB-003",
    "fill_level": 94,
    "status": "Critical",
    "alertCreated": true
  }
}
```

Check the web dashboard: Dustbin **DB-003** will turn red (94%), trigger a sound alert, and automatically be prioritized into the AI collection route!

---

## 5. User Authentication (Roles & Permissions)

The system supports 3 roles with specific privileges:

| Role | Permissions & Views |
|---|---|
| **Citizen (`citizen`)** | • Report overflowing or unmaintained bins with photos & GPS.<br>• Track grievance status (`REPORT-2026-001`).<br>• View public clean city educational statistics. |
| **Municipal Officer (`authority`)** | • Full Command Center Dashboard.<br>• Real-time IoT sensor telemetry & alerts management.<br>• Trigger AI Route Optimization engine (Nearest Neighbor + 2-Opt TSP).<br>• Assign vehicles & view historical analytics. |
| **Sanitation Driver (`driver`)** | • Driver Navigation Console with turn-by-turn waypoints.<br>• Interactive "Mark as Collected" button (resets dustbin to 0% and logs collection weight in kilograms). |

---

## 6. Summary Checklist for Academic Review

1. [x] **Frontend:** React 19 + TypeScript + Tailwind CSS + OpenStreetMap Leaflet.
2. [x] **Real-time Map:** 18 geo-located smart dustbins with color-coded fill statuses and pulsing critical radar rings.
3. [x] **AI Route Optimizer:** Computes multi-factor priority scoring and optimal Hamiltonian path for garbage trucks.
4. [x] **IoT Sensor Telemetry:** Real-time polling and live WebSocket/HTTP contract for ESP32 + HC-SR04 sensors.
5. [x] **Backend & Database:** Local Node.js Express server on port 5000 with persistent SQLite + Cloud Firestore.
6. [x] **Authentication:** Firebase Auth with email/password login, role access, and zero-setup fallback.
7. [x] **Hardware Firmware:** Production-ready Arduino `.ino` sketch created in `esp32_firmware/esp32_waste_sensor.ino`.
