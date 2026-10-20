# EcoRoute AI – Flutter Android Mobile Application Architecture & Deployment Guide

This document explains the mobile architecture, backend connectivity, IoT hardware integration, and APK/AAB build instructions for the **EcoRoute AI Flutter Android Mobile Application**.

---

## 🏗️ 1. Architecture Overview & Unified Cloud Backend

The EcoRoute AI platform now operates with a single unified backend serving both web and mobile clients:

```
                          ┌─────────────────────────────────────┐
                          │     ESP32 IoT Sensor Nodes          │
                          │   (HC-SR04 Ultrasonic Telemetry)    │
                          └──────────────────┬──────────────────┘
                                             │ HTTP POST /api/sensors/telemetry
                                             ▼
                          ┌─────────────────────────────────────┐
                          │      Render Cloud Backend API       │
                          │ https://ecoroute-ai-v4jd.onrender.  │
                          │               com/api               │
                          └──────────┬──────────────┬───────────┘
                                     │              │
                   Live REST API Sync│              │Live REST API Sync
                                     ▼              ▼
           ┌───────────────────────────────┐  ┌───────────────────────────────┐
           │     Vercel Web Portal         │  │   Flutter Android Mobile App  │
           │  https://eco-route-ai.vercel. │  │   (Citizen, Authority, Driver)│
           │             app               │  │   com.ecoroute.waste_management│
           └───────────────────────────────┘  └───────────────────────────────┘
```

### Key Highlights:
- **Shared Database:** Both the Vercel website and the Flutter Android app communicate with the same SQLite database hosted on Render. Any report submitted on the phone immediately appears on the website, and vice-versa!
- **Zero Localhost in Production:** The Flutter app connects by default to `https://ecoroute-ai-v4jd.onrender.com/api`.
- **Dynamic Host Switcher:** If testing on a closed Wi-Fi bench without internet, users can tap the network host icon in the app header and choose local IP with 1 click.

---

## 📡 2. Clarification: How the App Works When Connecting IoT Hardware

> **Question:** *"will this app be working when i connect iot device also please do that."*

### **Answer: YES! 100% seamlessly!**

Here is the exact step-by-step data flow when you connect your ESP32 hardware:

1. **Hardware Measurement:**  
   The ESP32 microcontroller with HC-SR04 ultrasonic sensor measures the real-time distance to the waste inside the dustbin (e.g. `DB-003`).
2. **Transmission to Cloud:**  
   The ESP32 sends an HTTP POST request to:  
   `https://ecoroute-ai-v4jd.onrender.com/api/sensors/telemetry`  
   *(Or your laptop's local Wi-Fi IP `http://10.24.177.25:5000/api/sensors/telemetry` if testing offline)*.
3. **Backend Processing:**  
   The Node.js server updates `DB-003`'s fill level, battery percentage, and status in SQLite, and logs a real-time event.
4. **Instant Mobile Reflection:**  
   The Flutter app's `WasteProvider` polls the backend every **4 seconds**:
   ```dart
   _pollingTimer = Timer.periodic(const Duration(seconds: 4), (_) {
     refreshDataSilently();
   });
   ```
   As soon as waste is dropped into the physical dustbin, the fill level percentage bar in the **Flutter mobile app updates on your phone in real time** without requiring any manual page refresh!

---

## 📦 3. How to Build & Download the Installable Android APK & AAB

### **Method A: Automated GitHub Cloud Build (Recommended — No Laptop Disk Space Used)**

Because your project is synced to GitHub (`52420Sud/EcoRoute-AI`), we configured **GitHub Actions** (`.github/workflows/build-flutter-apk.yml`):

1. Double-click [`PUSH_TO_GITHUB.bat`](file:///d:/waste%20mgt%20PRD%20REquriemtns/PUSH_TO_GITHUB.bat).
2. Go to your repository on GitHub:  
   👉 **[https://github.com/52420Sud/EcoRoute-AI/actions](https://github.com/52420Sud/EcoRoute-AI/actions)**
3. GitHub's high-speed cloud servers will automatically compile:
   - **`app-release.apk`**: Directly downloadable installable APK for any Android phone.
   - **`app-release.aab`**: Google Play Store Android App Bundle.
4. Download the `.apk` directly to your phone and tap to install!

---

### **Method B: Local Build on D: Drive (278 GB Free)**

To avoid filling up your C: drive (which has only 2.4 GB remaining):

1. Run [`INSTALL_FLUTTER.bat`](file:///d:/waste%20mgt%20PRD%20REquriemtns/INSTALL_FLUTTER.bat) to install the Flutter SDK cleanly into `D:\src\flutter`.
2. Run [`BUILD_FLUTTER_APK.bat`](file:///d:/waste%20mgt%20PRD%20REquriemtns/BUILD_FLUTTER_APK.bat).
3. The APK will be generated at:
   ```
   flutter_app\build\app\outputs\flutter-apk\app-release.apk
   ```

---

### **Method C: Instant 1-Tap App Install on Your Phone (Zero Wait)**

You do not even need to wait for a 20-minute SDK build to have this exact app on your Samsung Galaxy M21 / Android phone right now:

1. Open **[https://eco-route-ai.vercel.app](https://eco-route-ai.vercel.app)** on your phone in Chrome.
2. Tap the **"Install App"** button at the top (or Chrome menu `⋮` ➔ **"Install app"**).
3. The native app icon will be added to your phone's home screen with camera access, GPS, and live Render backend sync!
