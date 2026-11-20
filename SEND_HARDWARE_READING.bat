@echo off
title EcoRoute AI - Send IoT Hardware Reading
color 0A
cls

echo ======================================================================
echo           ECO-ROUTE AI: SEND LIVE IOT DUSTBIN READING
echo ======================================================================
echo.
echo This tool sends a live telemetry reading directly to your cloud Render
echo database and updates your Vercel Dashboard in real time!
echo.
echo Choose a Fill Level to send to DB-003:
echo   [1] Critical Overflow (95%% Full - 1.5 cm distance) -- Buzzer & Route Alert
echo   [2] High Waste Level  (82%% Full - 5.4 cm distance) -- Critical Alert
echo   [3] Half Full         (50%% Full - 15.0 cm distance) -- Warning State
echo   [4] Emptied Dustbin   (10%% Full - 27.0 cm distance) -- Normal Clean Bin
echo   [5] Custom Fill Percentage
echo.
set /p choice="Enter your choice (1-5) [Default 1]: "

set FILL=95
if "%choice%"=="1" set FILL=95
if "%choice%"=="2" set FILL=82
if "%choice%"=="3" set FILL=50
if "%choice%"=="4" set FILL=10
if "%choice%"=="5" (
    echo.
    set /p custom_fill="Enter fill percentage (0-100): "
    set FILL=%custom_fill%
)

echo.
echo Transmitting %FILL%%% fill level to cloud backend...
node "%~dp0scripts\send_hardware_reading.cjs" %FILL%

echo.
echo Press any key to exit...
pause >nul
