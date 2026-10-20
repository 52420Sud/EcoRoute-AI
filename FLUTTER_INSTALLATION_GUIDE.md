# Complete Flutter SDK Installation Guide (Windows)

This guide walks you through installing Flutter on your Windows machine so you can run, build, and debug the **EcoRoute AI Mobile App** (`flutter_app/`).

---

## ⚡ Method 1: Automated 1-Click Installer (Recommended)

We have created an automated installer script directly in your project.

1. In your project folder `d:\waste mgt PRD REquriemtns\`, find and **double-click** the file:
   ```
   INSTALL_FLUTTER.bat
   ```
2. The script will automatically:
   - Check the latest stable Flutter Windows release from Google (`v3.47.7`).
   - Download the official archive (~1.1 GB).
   - Extract it into `C:\src\flutter` (or `%USERPROFILE%\flutter`).
   - Automatically configure your Windows **User PATH** environment variable so `flutter` works from anywhere.
   - Run `flutter --version` to confirm.
3. Once done, **close and reopen VS Code or PowerShell** so the new PATH is loaded.

---

## 🛠️ Method 2: Manual Step-by-Step Installation

If you prefer to install manually or your network firewall restricts automated downloads, follow these official Google steps:

### Step 1: Install Git for Windows
Flutter requires Git for downloading packages and managing versions.
1. Download Git from: **[https://git-scm.com/download/win](https://git-scm.com/download/win)**
2. Run the installer and click **Next** through default settings until finished.
*(Or run in your command prompt: `winget install --id Git.Git -e` and click **Yes** on the Administrator prompt).*

### Step 2: Download Flutter SDK
1. Download the official Flutter Windows bundle:
   👉 **[Download Flutter v3.47.7 Stable (Windows 64-bit)](https://storage.googleapis.com/flutter_infra_release/releases/stable/windows/flutter_windows_3.47.7-stable.zip)**
2. Create a folder named `C:\src` on your computer.
3. Extract the downloaded `.zip` file so the folder is located at:
   ```
   C:\src\flutter
   ```
   *(⚠️ Warning: Do **NOT** install Flutter in `C:\Program Files\` as it causes permission errors).*

### Step 3: Add Flutter to your Environment Variables (PATH)
1. Press the **Windows Key** on your keyboard, type **env**, and select **Edit the system environment variables** (or **Edit environment variables for your account**).
2. Under **User variables**, select **Path** and click **Edit...**.
3. Click **New** and paste:
   ```
   C:\src\flutter\bin
   ```
4. Click **OK** on all dialog boxes to save.

### Step 4: Verify in Terminal
1. Open a **new** PowerShell or Command Prompt terminal (or restart VS Code).
2. Type:
   ```powershell
   flutter --version
   ```
   You should see:
   ```
   Flutter 3.47.7 • channel stable
   Framework • revision abaf9c5...
   Engine • revision ...
   Tools • Dart 3.13...
   ```
3. Run the doctor check to see available devices:
   ```powershell
   flutter doctor
   ```

---

## 🚀 Running Your EcoRoute AI Mobile App

Once Flutter is installed:

### 1. Navigate to the project directory:
```powershell
cd "d:\waste mgt PRD REquriemtns\flutter_app"
```

### 2. Fetch dependencies:
```powershell
flutter pub get
```

### 3. Run the app:

#### Option A: Run in Google Chrome (Fastest & No setup needed!)
```powershell
flutter run -d chrome
```

#### Option B: Run on your physical Android phone:
1. Enable **Developer Options** and **USB Debugging** on your phone.
2. Connect your phone to your PC via USB cable.
3. Run:
   ```powershell
   flutter run
   ```

#### Option C: Run on Android Studio Emulator:
1. Open Android Studio and launch any Virtual Device (AVD).
2. Run:
   ```powershell
   flutter run
   ```

#### Option D: Build Installable Android APK:
```powershell
flutter build apk --release
```
The APK file will be ready at:
`flutter_app\build\app\outputs\flutter-apk\app-release.apk`
You can copy this file to any Android phone and install it directly!
