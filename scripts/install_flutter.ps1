# install_flutter.ps1 - Automated Flutter SDK Installer for Windows
# Uses curl.exe and tar.exe for fast download and extraction

$ErrorActionPreference = "Stop"

Write-Host "=========================================================="
Write-Host "EcoRoute AI - Automated Flutter SDK Installer"
Write-Host "=========================================================="

$targetParent = "D:\src"
$installDir = "D:\src\flutter"
$binDir = "D:\src\flutter\bin"
$zipFile = "D:\src\flutter_windows.zip"
$flutterUrl = "https://storage.googleapis.com/flutter_infra_release/releases/stable/windows/flutter_windows_3.29.0-stable.zip"

# 1. Ensure target parent folder exists
if (-not (Test-Path $targetParent)) {
    [IO.Directory]::CreateDirectory($targetParent) | Out-Null
    Write-Host "[1/5] Created directory $targetParent"
} else {
    Write-Host "[1/5] Directory $targetParent exists"
}

# 2. Check if already installed
if (Test-Path "$binDir\flutter.bat") {
    Write-Host "[2/5] Flutter SDK already exists at $installDir"
} else {
    # 3. Download Flutter zip if not already downloaded
    if (-not (Test-Path $zipFile)) {
        Write-Host "[2/5] Downloading Flutter SDK archive from Google (~1.1 GB)..."
        Write-Host "      Download URL: $flutterUrl"
        & curl.exe -L -# -o $zipFile $flutterUrl
        if ($LASTEXITCODE -ne 0 -or -not (Test-Path $zipFile)) {
            throw "Failed to download Flutter SDK from $flutterUrl"
        }
        Write-Host "[2/5] Download completed successfully!"
    } else {
        Write-Host "[2/5] Using existing downloaded zip: $zipFile"
    }

    # 4. Extract archive using tar.exe
    Write-Host "[3/5] Extracting Flutter SDK into $targetParent..."
    & tar.exe -xf $zipFile -C $targetParent
    if ($LASTEXITCODE -ne 0) {
        throw "Failed to extract $zipFile into $targetParent"
    }
    Write-Host "[3/5] Extraction completed successfully!"
}

# 5. Add to User PATH
Write-Host "[4/5] Adding $binDir to User Environment PATH..."
$userPath = [Environment]::GetEnvironmentVariable("Path", [EnvironmentVariableTarget]::User)
if (-not $userPath) { $userPath = "" }

if ($userPath -notlike "*$binDir*") {
    $newUserPath = ($userPath.TrimEnd(';') + ";$binDir").TrimStart(';')
    [Environment]::SetEnvironmentVariable("Path", $newUserPath, [EnvironmentVariableTarget]::User)
    Write-Host "[4/5] SUCCESS: Added '$binDir' to User PATH permanently!"
} else {
    Write-Host "[4/5] '$binDir' is already present in User PATH."
}

# Also update current session Path
if ($env:Path -notlike "*$binDir*") {
    $env:Path = "$env:Path;$binDir"
}

# 6. Verify Flutter
Write-Host "[5/5] Verifying Flutter installation..."
if (Test-Path "$binDir\flutter.bat") {
    & "$binDir\flutter.bat" --version
    Write-Host "=========================================================="
    Write-Host "SUCCESS: Flutter SDK is fully installed and ready!"
    Write-Host "Location: $installDir"
    Write-Host "=========================================================="
} else {
    Write-Host "WARNING: flutter.bat not found at $binDir"
}
