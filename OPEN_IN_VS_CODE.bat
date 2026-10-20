@echo off
title Opening EcoRoute AI in VS Code...
cd /d "%~dp0"
echo ======================================================================
echo    ECO-ROUTE AI: OPENING IN VISUAL STUDIO CODE
echo ======================================================================
echo.

where code >nul 2>&1
if %errorlevel% equ 0 (
    echo [OK] Found VS Code CLI. Opening workspace...
    code .
) else (
    echo [INFO] Opening workspace file directly via Windows association...
    start "" "%~dp0EcoRoute-AI.code-workspace"
)

echo.
echo [DONE] Project opened in VS Code!
timeout /t 3 >nul
