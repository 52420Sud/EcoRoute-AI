@echo off
title EcoRoute AI - Build Flutter Android APK & AAB
color 0B
cls
echo =====================================================================
echo           EcoRoute AI - Flutter Android APK & AAB Builder
echo =====================================================================
echo.
echo Production Backend: https://ecoroute-ai-v4jd.onrender.com/api
echo Target Package:     com.ecoroute.waste_management
echo.

set "PATH=D:\src\flutter\bin;%PATH%"

where flutter >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Flutter SDK is not detected in your PATH or at D:\src\flutter\bin.
    echo.
    echo Please run INSTALL_FLUTTER.bat first to set up Flutter on your D: drive.
    echo Or push this project to GitHub to let GitHub Actions automatically build
    echo your APK and AAB in the cloud!
    echo.
    pause
    exit /b 1
)

echo [1/3] Navigating to flutter_app directory...
cd /d "%~dp0flutter_app"

echo [2/3] Fetching Flutter dependencies (flutter pub get)...
call flutter pub get
if %errorlevel% neq 0 (
    echo [ERROR] Failed to fetch dependencies.
    pause
    exit /b 1
)

echo.
echo [3/3] Compiling Installable Release APK...
call flutter build apk --release
if %errorlevel% neq 0 (
    echo [ERROR] APK compilation encountered an issue.
    pause
    exit /b 1
)

echo.
echo =====================================================================
echo SUCCESS! Your installable Android APK is ready:
echo Location: flutter_app\build\app\outputs\flutter-apk\app-release.apk
echo =====================================================================
echo.
echo You can copy this app-release.apk directly to your Android phone
echo and install it!
echo.
pause
