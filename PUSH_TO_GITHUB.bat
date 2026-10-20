@echo off
title EcoRoute AI - Push to GitHub (52420Sud/EcoRoute-AI)
color 0A
cls

echo ======================================================================
echo    ECOROUTE AI: PUSH TO GITHUB REPOSITORY
echo    Target: https://github.com/52420Sud/EcoRoute-AI
echo ======================================================================
echo.
echo Step 1: Ensure you have created the empty repository on GitHub:
echo         https://github.com/new
echo         - Repository name: EcoRoute-AI
echo         - Visibility: Public
echo         - Do NOT initialize with README (already created locally)
echo.
echo Step 2: Press any key to push your committed project to GitHub...
echo         (A browser window or GitHub Credential Manager prompt may appear
echo          asking you to authorize your GitHub account "52420Sud")
echo ======================================================================
echo.
pause

set "PATH=%LOCALAPPDATA%\Programs\Git\cmd;%PATH%"

echo.
echo [*] Pushing to https://github.com/52420Sud/EcoRoute-AI.git ...
git push -u origin main

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ======================================================================
    echo [SUCCESS] EcoRoute AI pushed to GitHub successfully!
    echo URL: https://github.com/52420Sud/EcoRoute-AI
    echo ======================================================================
) else (
    echo.
    echo ======================================================================
    echo [NOTICE] Push encountered an issue.
    echo If GitHub asks for a password, use a Personal Access Token (PAT):
    echo 1. Generate token at: https://github.com/settings/tokens
    echo 2. Select scopes: 'repo'
    echo 3. Copy token and paste as password when prompted.
    echo ======================================================================
)

echo.
pause
