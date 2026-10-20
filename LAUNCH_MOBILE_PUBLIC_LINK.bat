@echo off
title EcoRoute AI - Public Mobile Link (4G/5G & Wi-Fi)
color 0A
cls

echo ======================================================================
echo    ECO-ROUTE AI: INSTANT PUBLIC LINK FOR MOBILE ACCESS
echo ======================================================================
echo.
echo This generates a live public HTTPS link that works on:
echo   - Any mobile phone (Samsung, iPhone, etc.)
echo   - Mobile 4G/5G data OR Wi-Fi
echo   - Even if your Wi-Fi router blocks device-to-device connections!
echo.
echo Generating public link... please wait...
echo ======================================================================
echo.

cmd /c npx localtunnel --port 5173

pause
