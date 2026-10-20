@echo off
title EcoRoute AI - Live Launcher for PC & Mobile
color 0A
cls
echo ======================================================================
echo    ECO-ROUTE AI: DUAL LAUNCHER (PC + SAMSUNG GALAXY M21)
echo ======================================================================
echo.
cd /d "%~dp0"

echo [1/2] Checking system readiness...
call npm -v >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js not detected in system PATH.
    pause
    exit /b 1
)

echo [2/2] Launching Backend & Mobile Network Server...
echo.
call npm run dev:all

pause
