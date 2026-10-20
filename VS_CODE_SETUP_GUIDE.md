# 💻 VS Code Complete Setup & Running Guide
### EcoRoute AI - Smart IoT Waste Management & Route Optimization System

This project is now fully pre-configured for **Visual Studio Code (VS Code)** with 1-click startup tasks, integrated debugging, recommended extensions, and clean workspace settings.

---

## 🚀 Quick Start (In 3 Simple Steps)

### Step 1: Open the Project in VS Code
- Open **VS Code**.
- Click **File** → **Open Folder...** (or press <kbd>Ctrl</kbd> + <kbd>K</kbd>, then <kbd>Ctrl</kbd> + <kbd>O</kbd>).
- Select the project directory: `D:\waste mgt PRD REquriemtns`.

> **Tip:** You can also open your terminal/PowerShell in this folder and type:
> ```bash
> code .
> ```

---

### Step 2: Install Recommended Extensions
When you open this folder, VS Code will display a notification:
> *"This workspace has extension recommendations."*

Click **Install All**, or press <kbd>Ctrl</kbd> + <kbd>Shift</kbd> + <kbd>X</kbd>, type `@recommended` in the search bar, and install:
- **Tailwind CSS IntelliSense** (`bradlc.vscode-tailwindcss`) — Live CSS auto-completion.
- **Prettier - Code Formatter** (`esbenp.prettier-vscode`) — Auto-formats code on save.
- **ESLint** (`dbaeumer.vscode-eslint`) — Real-time linting and bug prevention.
- **Python** & **Jupyter** (`ms-python.python`, `ms-toolsai.jupyter`) — Runs `.ipynb` & ML scripts.
- **Thunder Client** (`rangav.vscode-thunder-client`) — Lightweight REST API client for ESP32 pings.
- **Arduino** / **PlatformIO** (`vsciot-vscode.vscode-arduino`) — Flash ESP32 firmware inside VS Code.

---

### Step 3: Run the Whole Project (1-Click Options)

You have **3 convenient ways** to launch the entire project:

#### ⚡ Method A: The 1-Click Keyboard Shortcut (Recommended)
Press:
<kbd>Ctrl</kbd> + <kbd>Shift</kbd> + <kbd>B</kbd>
> This runs the default pre-configured VS Code build task: **`🚀 Start Full System (Frontend + Backend)`**.
> It automatically opens two parallel terminal panels inside VS Code:
> 1. **⚙️ Backend Server (Port 5000)**
> 2. **🌐 Frontend Web App (Port 5173)**

#### 🐞 Method B: Integrated F5 Debugger
Press:
<kbd>F5</kbd>
> Select **`🚀 Full Stack: Backend + Web App (Edge or Chrome)`**.
> VS Code will start the backend, start Vite, and automatically launch your browser connected to the debugger with live breakpoints enabled!

#### 💻 Method C: Integrated Terminal
Open the VS Code terminal (<kbd>Ctrl</kbd> + <kbd>`</kbd>) and run:
```bash
npm run dev:all
```
*(Or double-click `start_project.bat` in the file explorer)*.

---

## 🌐 URLs & Service Endpoints

| Service | Port / URL | Description |
| :--- | :--- | :--- |
| **Frontend Web App** | [`http://localhost:5173`](http://localhost:5173) | Citizen Portal, Authority Portal, Driver Console, Live Google Maps GIS |
| **Backend API** | [`http://localhost:5000`](http://localhost:5000) | Express REST API, SQLite database, OTP engine |
| **ESP32 IoT Endpoint** | `http://<YOUR_LOCAL_IP>:5000/api/sensors/telemetry` | Live hardware ultrasonic telemetry receiver |
| **Hardware Info** | [`http://localhost:5000/api/hardware/info`](http://localhost:5000/api/hardware/info) | Live server IP & connection parameters |

---

## 🛠️ Pre-Configured VS Code Tasks Menu

To access the tasks menu:
1. Press <kbd>Ctrl</kbd> + <kbd>Shift</kbd> + <kbd>P</kbd>.
2. Type **`Tasks: Run Task`** and press <kbd>Enter</kbd>.
3. You will see all custom project tasks:

- **`🚀 Start Full System (Frontend + Backend)`** — Runs both servers in parallel panels.
- **`🌐 Start Frontend Web App (Port 5173)`** — Runs Vite development server only.
- **`⚙️ Start Backend Server (Port 5000)`** — Runs Express SQLite backend only.
- **`📦 Build Production Web & Desktop App`** — Compiles TypeScript and builds production distribution.
- **`🖥️ Launch Electron Desktop App`** — Runs the standalone Windows desktop application.
- **`🧠 Train Waste Collection ML Model (Python)`** — Runs the machine learning evaluation pipeline.
- **`📐 Calibrate ESP32 Bin Depth (30 cm default)`** — Instant 1-click ultrasonic zero-calibration.

---

## 🔌 Developing & Flashing the ESP32 Firmware in VS Code

The firmware source code is located at:
`esp32_firmware/esp32_waste_sensor.ino`

To edit or flash it inside VS Code:
1. Install the **Arduino** or **PlatformIO** extension.
2. In the bottom status bar, set your Board to: **`DOIT ESP32 DEVKIT V1`** (or `ESP32 Dev Module`).
3. Set your COM Port (e.g., `COM3`, `COM4`).
4. Update your Wi-Fi SSID and Password in `esp32_waste_sensor.ino`:
   ```cpp
   const char* ssid = "YOUR_WIFI_NAME";
   const char* password = "YOUR_WIFI_PASSWORD";
   ```
5. Click the **Upload (→)** button in the top-right toolbar or press <kbd>Ctrl</kbd> + <kbd>Alt</kbd> + <kbd>U</kbd>.

---

## 🧠 Running the Machine Learning Notebook in VS Code

You can run the ML training pipeline directly inside VS Code without even opening a web browser:
1. In the VS Code file tree, click **[`Waste_Collection_Realtime_ML_Model.ipynb`](./Waste_Collection_Realtime_ML_Model.ipynb)**.
2. The interactive Jupyter Notebook interface will open.
3. In the top-right, select your Python kernel.
4. Click **Run All** to train the models and generate all 6 evaluation curves!

---

## ⌨️ VS Code Productivity Shortcuts for this Project

| Shortcut | Action |
| :--- | :--- |
| <kbd>Ctrl</kbd> + <kbd>Shift</kbd> + <kbd>B</kbd> | **Run Full System** (Frontend + Backend) |
| <kbd>F5</kbd> | **Start Debugging** (Full Stack with browser) |
| <kbd>Ctrl</kbd> + <kbd>`</kbd> | **Toggle Integrated Terminal** |
| <kbd>Ctrl</kbd> + <kbd>P</kbd> | **Quick Open File** (e.g. type `InteractiveMap`) |
| <kbd>Ctrl</kbd> + <kbd>Shift</kbd> + <kbd>F</kbd> | **Global Search** across codebase |
| <kbd>Shift</kbd> + <kbd>Alt</kbd> + <kbd>F</kbd> | **Format Document** (Prettier) |
