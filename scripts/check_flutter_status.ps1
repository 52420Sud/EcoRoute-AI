Write-Host "=== CHECKING FLUTTER INSTALLATION STATUS ===" -ForegroundColor Cyan
Write-Host "C:\src exists: $(Test-Path 'C:\src')"
Write-Host "C:\src\flutter exists: $(Test-Path 'C:\src\flutter')"
Write-Host "C:\src\flutter\bin\flutter.bat exists: $(Test-Path 'C:\src\flutter\bin\flutter.bat')"

$userFlutter = "$env:USERPROFILE\flutter"
Write-Host "USERPROFILE\flutter exists: $(Test-Path $userFlutter)"
Write-Host "USERPROFILE\flutter\bin\flutter.bat exists: $(Test-Path "$userFlutter\bin\flutter.bat")"

Write-Host "`n=== ZIP CACHE IN TEMP ===" -ForegroundColor Cyan
Get-ChildItem $env:TEMP -Filter "flutter*" -ErrorAction SilentlyContinue | Select-Object Name, Length, LastWriteTime

Write-Host "`n=== CURRENT USER PATH ===" -ForegroundColor Cyan
[Environment]::GetEnvironmentVariable("Path", "User")

Write-Host "`n=== PROCESS PATH ===" -ForegroundColor Cyan
$env:Path
