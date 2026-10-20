@echo off
title EcoRoute AI - Smart Waste Management System
color 0A

echo ======================================================================
echo    ECO-ROUTE AI: SMART WASTE MANAGEMENT SYSTEM (1-CLICK LAUNCHER)
echo ======================================================================
echo.

cd /d "%~dp0"

echo [1/3] Checking Node.js installation...
node -v >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not found in your system PATH!
    echo Please install Node.js from https://nodejs.org/ and restart.
    pause
    exit /b 1
)

echo [2/3] Checking project dependencies...
if not exist "node_modules\" (
    echo Installing dependencies (npm install)...
    call npm install
)

echo [3/3] Starting Backend (Port 5000) and Frontend (Port 5173)...
echo.
echo ======================================================================
echo   - Backend Server: http://localhost:5000
echo   - Frontend UI:    http://localhost:5173
echo   - Press Ctrl+C in this terminal to stop the system.
echo ======================================================================
echo.

call npm run dev:all

pause
