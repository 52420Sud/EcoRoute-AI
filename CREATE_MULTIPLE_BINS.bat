@echo off
title EcoRoute AI - Add Multiple Smart Bins
color 0E
cls

echo ======================================================================
echo           ECO-ROUTE AI: ADD MULTIPLE SMART BINS TO FLEET
echo ======================================================================
echo.

cd /d "%~dp0"

node -v >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is required to execute this script.
    pause
    exit /b 1
)

echo Adding 5 new smart dustbins across the municipal map...
echo.

node "%~dp0scripts\create_multiple_bins.cjs" 5

echo Press any key to exit...
pause >nul
