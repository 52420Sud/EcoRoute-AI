@echo off
title EcoRoute AI - Start Server
color 0A
cls

echo ======================================================================
echo           ECO-ROUTE AI - STARTING LOCAL SYSTEM SERVERS
echo ======================================================================
echo.

cd /d "%~dp0"

:: Step 1: Clean up any old lingering instances on ports 5000 and 5173
echo [1/3] Ensuring ports 5000 and 5173 are free...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":5000" ^| findstr "LISTENING" 2^>nul') do (
    taskkill /f /t /pid %%a >nul 2>&1
)
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":5173" ^| findstr "LISTENING" 2^>nul') do (
    taskkill /f /t /pid %%a >nul 2>&1
)

:: Step 2: Verify Node.js is installed
echo [2/3] Checking Node.js runtime...
node -v >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not found in system PATH.
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

:: Step 3: Launch both Backend and Frontend
echo [3/3] Starting Express Backend (Port 5000) and Vite Web (Port 5173)...
echo.
echo ======================================================================
echo   - Local PC Web:   http://localhost:5173
echo   - Backend & API:  http://localhost:5000
echo   - To stop the servers later, simply double-click STOP_SERVER.bat
echo ======================================================================
echo.

call npm start

pause
