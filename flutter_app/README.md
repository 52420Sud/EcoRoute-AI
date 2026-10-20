# EcoRoute AI — Mobile Flutter Application
## Real-Time Smart Waste Management, IoT Telemetry & Dynamic Route Optimization

This directory contains the production-ready **Flutter Mobile Application** for **Android, iOS, and Web/PWA**, allowing **Citizens**, **Municipal Authorities**, and **Collection Drivers** to access the system anywhere in real time.

---

## 📱 Core Features & User Roles

### 1. Citizen Role (`CitizenReportScreen` & `TrackReportScreen`)
- **Clean Form Defaults**: Complainant Full Name and Mobile Phone fields start strictly empty.
- **Direct Phone Camera Capture**: High-resolution image capture directly from the device's camera using `image_picker` with automatic memory compression and instant upload preview.
- **6-Digit Mobile OTP Verification**: Real 2-factor OTP verification ensuring authentic grievance submission.
- **Real-Time Grievance Tracking**: Search status by Report ID or Phone number with multi-stage timeline.
- **Official PDF Receipt Generator**: 1-tap download and print of official municipal grievance receipts via `pdf` and `printing` packages.

### 2. Municipal Authority Role (`AuthorityDashboardScreen` & `LiveMapScreen`)
- **Municipal Telemetry Console**: Real-time KPI summary (Total Bins, Critical >70%, Medium 40–70%, Average Fill %, Active Nodes).
- **Interactive GIS Map (`flutter_map`)**: Real-time OpenStreetMap rendering of municipal zones with color-coded marker pins (Red: Critical >70%, Amber: Medium 40–70%, Green: Normal <40%).
- **Hardware Ultrasonic Calibration**: 1-tap hardware depth calibration setting physical container baseline to **30.0 cm** for all ESP32 nodes.

### 3. Hierarchical Route Optimizer (`RouteOptimizerScreen`)
- **3-Tier Scope Selector**:
  1. `Critical Only (>70%)`: Dispatches immediate runs strictly for overflowing containers.
  2. `Critical -> Medium (Recommended)`: Prioritizes all Critical bins (>70%) first, followed by Medium bins (40–70%).
  3. `All Priority Tiers`: Complete sweep visiting Critical, Medium, and Normal containers.
- **Nearest-Neighbor TSP Algorithm**: Minimizes distance, fuel consumption, and CO₂ emissions.
- **Route Polyline Preview**: Visual interactive map with stop numbers and directional path.
- **Dispatch Action**: Transmits optimized navigation order directly to the Driver Console.

### 4. Driver Collection Console (`DriverConsoleScreen`)
- **Turn-by-Turn Navigation Manifest**: Step-by-step checklist of assigned bins in prioritized sequence.
- **Prominent Next-Stop Card**: Highlights current stop, distance from previous location, and fill percentage.
- **1-Tap Collection & Telemetry Reset**: When driver empties a bin, tapping **"Mark Collected"** immediately sets fill level to **0%** and resets ultrasonic distance reading to **30.0 cm** in the database.

---

## 🌐 Anywhere Accessibility & IoT Network Setup

The mobile app includes a built-in **Network Host Switcher** accessible via the top-right toolbar icon (`Settings EtherNet` icon on the Home screen):

| Mode | Base URL | Usage |
|------|----------|-------|
| **Android Emulator** | `http://10.0.2.2:5000/api` | Connects from Android Studio / VS Code Emulator to your PC |
| **Physical Phone (Same Wi-Fi)** | `http://<YOUR_PC_IP>:5000/api` (e.g. `http://10.241.198.76:5000/api`) | Connects from any Android or iPhone on the local Wi-Fi |
| **Anywhere / Cloud Server** | `https://your-domain.com/api` or `https://xxxx.ngrok-free.app/api` | Connects from any cellular 4G/5G network worldwide |

---

## 🚀 How to Run the Flutter App

### Prerequisites
1. Install [Flutter SDK](https://flutter.dev/docs/get-started/install) (version 3.3.0 or higher).
2. Install Android Studio (for Android device/emulator) or Xcode (for macOS/iOS).

### Step 1: Install Dependencies
Open a terminal in `flutter_app/`:
```bash
cd flutter_app
flutter pub get
```

### Step 2: Ensure Node.js Backend is Running
In the project root directory:
```bash
# Verify backend is running on port 5000:
npm start
```

### Step 3: Launch Flutter App
```bash
# To run on connected Android phone or Emulator:
flutter run

# To run in Google Chrome browser:
flutter run -d chrome

# To build production APK:
flutter build apk --release
```
The compiled APK will be located at:
`flutter_app/build/app/outputs/flutter-apk/app-release.apk`

---

## 📁 Architecture Overview

```
flutter_app/
├── pubspec.yaml                       # Dependencies (flutter_map, http, provider, image_picker, pdf, printing)
├── android/
│   └── app/src/main/AndroidManifest.xml # Permissions (INTERNET, CAMERA, ACCESS_FINE_LOCATION)
├── web/
│   └── index.html                     # Web / PWA shell
└── lib/
    ├── main.dart                      # App entry point with MultiProvider & Dark Emerald Theme
    ├── core/
    │   ├── constants/api_constants.dart # API routes, 30cm depth constant, 70% critical threshold
    │   └── theme/app_theme.dart       # Material 3 emerald and dark slate theme
    ├── data/
    │   ├── models/
    │   │   ├── dustbin_model.dart     # Dustbin data model, 30cm depth formula, priority tier
    │   │   ├── report_model.dart      # Public grievance report model with OTP flag
    │   │   └── route_plan_model.dart  # Route plan, optimized stops, scope filter enum
    │   └── services/
    │       └── api_service.dart       # REST API client for backend & ESP32 IoT endpoints
    ├── providers/
    │   └── waste_provider.dart        # Real-time state manager (4s polling, TSP optimizer, depth calibration)
    └── ui/
        ├── widgets/
        │   ├── dustbin_card.dart      # Reusable card with progress bar, depth in cm, 1-tap actions
        │   └── priority_tier_badge.dart # Critical, Medium, and Low tier badge pills
        └── screens/
            ├── home_screen.dart       # 4-role bottom navigation & Network Host Switcher
            ├── citizen/
            │   ├── citizen_report_screen.dart # Camera photo upload & 6-digit OTP verification
            │   └── track_report_screen.dart   # Grievance timeline & PDF receipt generator
            ├── authority/
            │   ├── authority_dashboard_screen.dart # KPI tiles, 30cm calibration, filterable table
            │   ├── live_map_screen.dart       # Live GIS OpenStreetMap with color-coded markers
            │   └── route_optimizer_screen.dart # Hierarchical 3-tier route optimizer & mini-map
            └── driver/
                └── driver_console_screen.dart # Active route checklist & 1-tap empty collection
```
