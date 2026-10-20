@echo off
title EcoRoute AI - Randomize Bins for Objective 3
color 0B
cls

echo ======================================================================
echo    ECO-ROUTE AI: RANDOMIZE BINS FOR OBJECTIVE 3 ROUTE OPTIMIZATION
echo ======================================================================
echo.

cd /d "%~dp0"

:: Check Node.js
node -v >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is required to execute this script.
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

:: Run the randomizer script
node "%~dp0scripts\randomize_bins.cjs"

echo Press any key to exit...
pause >nul
