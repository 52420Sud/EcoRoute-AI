@echo off
title EcoRoute AI - Stop Server
color 0C
cls

echo ======================================================================
echo           ECO-ROUTE AI - STOPPING ALL SYSTEM SERVERS
echo ======================================================================
echo.

setlocal enabledelayedexpansion
set FOUND=0

:: Terminate processes on port 5000 (Node.js Express Backend)
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":5000" ^| findstr "LISTENING" 2^>nul') do (
    echo [*] Stopping Backend process on port 5000 with PID %%a ...
    taskkill /f /t /pid %%a >nul 2>&1
    set FOUND=1
)

:: Terminate processes on port 5173 (Vite Web Frontend)
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":5173" ^| findstr "LISTENING" 2^>nul') do (
    echo [*] Stopping Frontend process on port 5173 with PID %%a ...
    taskkill /f /t /pid %%a >nul 2>&1
    set FOUND=1
)

echo.
if !FOUND! equ 1 (
    echo ======================================================================
    echo   [SUCCESS] All EcoRoute AI servers have been stopped cleanly!
    echo ======================================================================
) else (
    echo ======================================================================
    echo   [INFO] No active EcoRoute servers were running on ports 5000 or 5173.
    echo ======================================================================
)

echo.
echo Press any key to exit...
pause >nul
