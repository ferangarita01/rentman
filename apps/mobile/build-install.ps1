#!/usr/bin/env pwsh
# Rentman Mobile - Build and Install Script
# Automates: Build → Sync → APK Generation → ADB Install

param(
    [switch]$SkipBuild,
    [switch]$SkipSync,
    [string]$Device = ""
)

Write-Host ""
Write-Host "╔════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║                                                    ║" -ForegroundColor Cyan
Write-Host "║      RENTMAN MOBILE - BUILD & INSTALL              ║" -ForegroundColor Cyan
Write-Host "║                                                    ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# Check if ADB is available
try {
    $null = adb devices
} catch {
    Write-Host "❌ ERROR: ADB not found in PATH" -ForegroundColor Red
    Write-Host "Please install Android SDK Platform Tools" -ForegroundColor Yellow
    exit 1
}

# Check for connected devices
Write-Host "[1/6] Checking for connected devices..." -ForegroundColor Yellow
$devices = adb devices | Select-String "device$" | Where-Object { $_ -notmatch "List of devices" }

if ($devices.Count -eq 0) {
    Write-Host "❌ No Android devices connected" -ForegroundColor Red
    Write-Host "Please connect a device via USB and enable USB Debugging" -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ Found $($devices.Count) device(s)" -ForegroundColor Green
Write-Host ""

# Build Next.js app
if (-not $SkipBuild) {
    Write-Host "[2/6] Building Next.js application..." -ForegroundColor Yellow
    npm run build
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Build failed" -ForegroundColor Red
        exit 1
    }
    Write-Host "✅ Build successful" -ForegroundColor Green
} else {
    Write-Host "[2/6] Skipping build (--SkipBuild)" -ForegroundColor Gray
}
Write-Host ""

# Sync with Capacitor
if (-not $SkipSync) {
    Write-Host "[3/6] Syncing with Capacitor..." -ForegroundColor Yellow
    npx cap sync android
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Sync failed" -ForegroundColor Red
        exit 1
    }
    Write-Host "✅ Sync successful" -ForegroundColor Green
} else {
    Write-Host "[3/6] Skipping sync (--SkipSync)" -ForegroundColor Gray
}
Write-Host ""

# Build Android APK
Write-Host "[4/6] Building Android APK..." -ForegroundColor Yellow
Set-Location android
.\gradlew assembleDebug --quiet
$buildResult = $LASTEXITCODE
Set-Location ..

if ($buildResult -ne 0) {
    Write-Host "❌ APK build failed" -ForegroundColor Red
    exit 1
}
Write-Host "✅ APK built successfully" -ForegroundColor Green
Write-Host ""

# Verify APK exists
$apkPath = ".\android\app\build\outputs\apk\debug\app-debug.apk"
if (-not (Test-Path $apkPath)) {
    Write-Host "❌ APK not found at: $apkPath" -ForegroundColor Red
    exit 1
}

$apk = Get-Item $apkPath
Write-Host "[5/6] APK Information:" -ForegroundColor Yellow
Write-Host "  Path: $($apk.FullName)" -ForegroundColor Gray
Write-Host "  Size: $([math]::Round($apk.Length / 1MB, 2)) MB" -ForegroundColor Gray
Write-Host "  Modified: $($apk.LastWriteTime)" -ForegroundColor Gray
Write-Host ""

# Install on device
Write-Host "[6/6] Installing APK on device..." -ForegroundColor Yellow

if ($Device) {
    adb -s $Device install -r $apkPath
} else {
    adb install -r $apkPath
}

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Installation failed" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Installation successful!" -ForegroundColor Green
Write-Host ""

# Summary
Write-Host "╔════════════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║                                                    ║" -ForegroundColor Green
Write-Host "║      ✅ RENTMAN MOBILE INSTALLED SUCCESSFULLY     ║" -ForegroundColor Green
Write-Host "║                                                    ║" -ForegroundColor Green
Write-Host "╚════════════════════════════════════════════════════╝" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "  1. Open the Rentman app on your device" -ForegroundColor White
Write-Host "  2. Test the new features:" -ForegroundColor White
Write-Host "     • Inbox real-time messaging" -ForegroundColor Gray
Write-Host "     • Settings persistence" -ForegroundColor Gray
Write-Host "     • Issuer profile navigation" -ForegroundColor Gray
Write-Host "     • Contract geolocation" -ForegroundColor Gray
Write-Host "     • Trust score display" -ForegroundColor Gray
Write-Host ""
Write-Host "To rebuild and reinstall:" -ForegroundColor Cyan
Write-Host "  .\build-install.ps1" -ForegroundColor White
Write-Host ""
Write-Host "To install only (skip build):" -ForegroundColor Cyan
Write-Host "  .\build-install.ps1 -SkipBuild -SkipSync" -ForegroundColor White
Write-Host ""
