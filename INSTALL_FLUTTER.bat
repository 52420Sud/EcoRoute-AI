@echo off
title EcoRoute AI - Flutter SDK Installer
color 0A
cls
echo =====================================================================
echo           EcoRoute AI - Automated Flutter SDK Installation
echo =====================================================================
echo.
echo This script will automatically:
echo   1. Fetch the latest official Google Flutter SDK (v3.47.7 Stable)
echo   2. Install it cleanly to C:\src\flutter (or %%USERPROFILE%%\flutter)
echo   3. Add Flutter to your User PATH environment variable
echo   4. Verify the setup with 'flutter doctor'
echo.
echo Press any key to begin download and setup...
pause >nul

powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\install_flutter.ps1"

echo.
echo =====================================================================
echo Installation process finished!
echo If flutter was installed, please restart your command prompt or VS Code.
echo =====================================================================
echo.
pause
