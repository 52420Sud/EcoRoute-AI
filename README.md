# 🚛 EcoRoute AI – Smart Waste Management System Using IoT & AI

[![Node.js Version](https://img.shields.io/badge/Node.js-v20%2B-brightgreen.svg)](https://nodejs.org/)
[![React Version](https://img.shields.io/badge/React-19.x-blue.svg)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-6.x-blue.svg)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38B2AC.svg)](https://tailwindcss.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**EcoRoute AI** is a final-year major engineering project designed to revolutionize urban solid waste collection. It combines **IoT physical sensor telemetry**, **AI-driven route optimization heuristics**, **citizen grievance reporting**, and an **authoritative municipal command center** into a unified, responsive platform.

Developed by **[52420Sud](https://github.com/52420Sud)**.

---

## 🏛️ System Architecture

```
                          ┌─────────────────────────────┐
                          │   Physical Hardware Unit    │
                          │ ESP32 + HC-SR04 Ultrasonic  │
                          │   Active Buzzer + LEDs      │
                          └──────────────┬──────────────┘
                                         │ HTTP REST JSON Telemetry
                                         ▼
┌─────────────────────────┐       ┌───────────────────────────────┐       ┌──────────────────────────┐
│  Citizen Grievance App  │       │     EcoRoute AI Backend       │       │ Municipal Command Center │
│ • Photo Capture/Upload  │◄─────►│    (Node.js 22 + Express)     │◄─────►│ • Live Dustbin Statuses  │
│ • GPS Location Tagging  │       │ • SQLite Database Engine      │       │ • Interactive GIS Map    │
│ • Direct In-Place OTP   │       │ • RESTful API Endpoints       │       │ • Real-Time KPI Cards    │
│ • 5-Stage Life Tracking │       │ • IoT Sensor Calibration      │       │ • Automated Sound Alerts │
└─────────────────────────┘       └──────────────┬────────────────┘       └──────────────────────────┘
                                                 │
                                                 ▼
                                  ┌───────────────────────────────┐
                                  │   AI Route Optimization       │
                                  │ • Composite Priority Scoring  │
                                  │ • Nearest Neighbor Selection  │
                                  │ • 2-Opt TSP Path Optimization │
                                  └──────────────┬────────────────┘
                                                 │
                                                 ▼
                                  ┌───────────────────────────────┐
                                  │ Driver Collection Console     │
                                  │ • Turn-by-Turn Waypoints      │
                                  │ • 1-Click Collection Action   │
                                  │ • Real-Time 0% Reset & Audit  │
                                  └───────────────────────────────┘
```

---

## 🌟 Core Features & Modules

### 1. 🗑️ Smart-Bin IoT Monitoring & Hardware Integration
* **Ultrasonic Distance Sensing:** Measures waste fill level in real time using HC-SR04 ultrasonic sensors connected to an ESP32 microcontroller.
* **Three-Tier Operational Status:**
  * 🟢 **Normal (0% - 50%):** Standard operational state.
  * 🟡 **Nearly Full (51% - 80%):** Scheduled for upcoming collection cycle.
  * 🔴 **Critical (81% - 100%):** Immediate overflow alert triggered with buzzer and municipal dispatch recommendation.
* **Autonomous Telemetry Simulator:** Built-in dashboard simulator for testing hardware payloads, container depths, and emergency overflows without physical hardware.

### 2. 📱 Citizen Grievance Redressal (Objective 1)
* **Photographic Evidence:** Supports live camera capture, photo upload, and automatic image compression.
* **Anti-Spam Verification:** Strict Indian 10-digit mobile number validation with **direct, in-place automatic OTP delivery**.
* **5-Stage Lifecycle Tracking:** Real-time visual tracking stepper:
  `Submitted` ➔ `Under Review` ➔ `Assigned` ➔ `In Progress` ➔ `Resolved`.

### 3. 🧠 AI Route Optimization Engine (Objective 3)
* **Multi-Factor Priority Scoring:** Dynamically weights waste fill level ($W_{\text{fill}}$), citizen complaint density ($W_{\text{comp}}$), and emergency overflow urgency ($W_{\text{urg}}$).
* **2-Opt TSP Local Search Heuristic:** Eliminates route crossings and minimizes overall fuel consumption and collection travel distance.
* **Interactive GIS Leaflet Mapping:** Displays real-time dustbin markers, color-coded fill statuses, depot coordinates, and vehicle paths.

### 4. 🚛 Field Driver Collection Console
* Mobile-responsive interface designed for municipal truck drivers.
* Highlights the next recommended stop with waste volume, address, and navigation directions.
* **1-Click Verified Collection:** Empties the dustbin, resets fill level to 0%, resolves linked public grievances, and appends an immutable record to the collection audit log.

---

## 🛠️ Technology Stack

| Domain | Technologies Used |
| :--- | :--- |
| **Frontend** | React 19, TypeScript, Vite, Tailwind CSS, Lucide React, Canvas Confetti |
| **Backend** | Node.js (v20+ / v24), Express.js, Built-in SQLite (`node:sqlite`) |
| **GIS & Maps** | Leaflet, OpenStreetMap API |
| **IoT Hardware** | ESP32-WROOM-32, HC-SR04 Ultrasonic Sensor, C++ (Arduino IDE) |
| **Mobile App** | Flutter / Dart Cross-Platform Mobile Client |
| **Desktop App** | Electron Desktop Wrapper (Windows Portable & Installer) |
| **Cloud Hosting** | Vercel (Frontend SPA) + Render (Backend REST API) |

---

## 🚀 Cloud Deployment Guide

### A. Deploy Frontend on Vercel
1. Fork or push this repository to your GitHub account (`52420Sud/EcoRoute-AI`).
2. Log in to [Vercel](https://vercel.com/) and click **"Add New Project"** ➔ Import `EcoRoute-AI`.
3. Configure the build settings:
   * **Framework Preset:** Vite
   * **Build Command:** `npm run build`
   * **Output Directory:** `dist`
4. Add the Environment Variable:
   * `VITE_API_URL` = Your Render backend URL (e.g. `https://ecoroute-ai-backend.onrender.com/api`)
5. Click **Deploy**. Vercel will generate your live public HTTPS URL!

### B. Deploy Backend on Render
1. Log in to [Render](https://render.com/) and click **"New"** ➔ **"Web Service"**.
2. Connect your GitHub repository `52420Sud/EcoRoute-AI`.
3. Configure the service settings:
   * **Environment:** Node
   * **Build Command:** `npm install`
   * **Start Command:** `node server/index.js`
   * **Plan:** Free
4. Add Environment Variables:
   * `NODE_ENV` = `production`
   * `PORT` = `10000` (Render handles this automatically)
5. Click **Create Web Service**. Render will deploy your live backend API!

---

## 💻 Local Development Setup

### Prerequisites
* [Node.js](https://nodejs.org/) v20.0 or higher
* [Git](https://git-scm.com/)

### Installation & Run

1. **Clone the repository:**
   ```bash
   git clone https://github.com/52420Sud/EcoRoute-AI.git
   cd EcoRoute-AI
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start both Frontend and Backend concurrently:**
   ```bash
   npm run start:all
   ```
   * Frontend: [http://localhost:5173](http://localhost:5173)
   * Backend API: [http://localhost:5000](http://localhost:5000)

4. **Production Build:**
   ```bash
   npm run build
   ```

---

## 📡 REST API Specifications

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/health` | Service health status check |
| `GET` | `/api/dustbins` | List all smart bins with fill levels and statuses |
| `POST` | `/api/sensors/telemetry` | Receive real-time IoT ultrasonic readings from ESP32 |
| `POST` | `/api/dustbins/:id/collect` | Confirm waste collection and reset bin to 0% |
| `GET` | `/api/reports` | Retrieve citizen grievances and complaint statuses |
| `POST` | `/api/reports` | Submit a citizen waste report with photo evidence |
| `POST` | `/api/otp/send` | Generate and dispatch dynamic anti-spam mobile OTP |
| `POST` | `/api/otp/verify` | Cryptographically verify citizen OTP |
| `GET` | `/api/alerts` | List unread critical overflow and maintenance alerts |

---

## 🔌 ESP32 Hardware Wiring & Pinout

```
ESP32 Pin       HC-SR04 Ultrasonic Sensor
─────────       ─────────────────────────
5V / VIN  ────► VCC
GND       ────► GND
GPIO 5    ────► TRIG
GPIO 18   ────► ECHO (Via voltage divider 1kΩ / 2kΩ)

ESP32 Pin       Peripherals
─────────       ───────────
GPIO 2    ────► Status LED / Active Buzzer
```

The C++ source code for flashing your ESP32 board is available in [`esp32_firmware/esp32_waste_sensor.ino`](./esp32_firmware/esp32_waste_sensor.ino).

---

## 📄 License
This project is developed for academic and educational purposes under the [MIT License](LICENSE).
