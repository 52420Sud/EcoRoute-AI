# PowerShell Launcher for EcoRoute AI
$Host.UI.RawUI.WindowTitle = "EcoRoute AI - Smart Waste Management"
Write-Host "======================================================================" -ForegroundColor Cyan
Write-Host "   ECO-ROUTE AI: SMART WASTE MANAGEMENT SYSTEM (POWERSHELL LAUNCHER)  " -ForegroundColor Green
Write-Host "======================================================================" -ForegroundColor Cyan

Set-Location -Path $PSScriptRoot

# Check Node.js
try {
    $nodeVer = node -v
    Write-Host "✅ Node.js detected: $nodeVer" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js not detected in PATH! Please install Node.js." -ForegroundColor Red
    pause
    exit 1
}

# Check node_modules
if (-not (Test-Path "node_modules")) {
    Write-Host "📦 Installing project dependencies..." -ForegroundColor Yellow
    npm install
}

Write-Host "`n🚀 Launching Backend (Port 5000) and Frontend (Port 5173)..." -ForegroundColor Cyan
Write-Host "   - Backend:  http://localhost:5000" -ForegroundColor White
Write-Host "   - Frontend: http://localhost:5173`n" -ForegroundColor White

npm run dev:all
