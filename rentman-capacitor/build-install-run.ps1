#!/usr/bin/env pwsh
# Rentman - Build, Install & Run Automation Script
# Builds APK, installs via ADB, and launches app

param(
    [switch]$Release,
    [switch]$SkipBuild,
    [switch]$UninstallFirst
)

$ErrorActionPreference = "Stop"

# Configuration
$PROJECT_ROOT = $PSScriptRoot
$ANDROID_DIR = Join-Path $PROJECT_ROOT "android"
$APP_ID = "com.rentman.app"
$APP_NAME = "Rentman"

# Fix Java Home if missing
if (-not $env:JAVA_HOME) {
    $possiblePath = "C:\Program Files\Eclipse Adoptium\jdk-21.0.9.10-hotspot"
    if (Test-Path $possiblePath) {
        $env:JAVA_HOME = $possiblePath
        Write-Host "[i] Automatically set JAVA_HOME: $possiblePath" -ForegroundColor Gray
    }
}


Write-Host "Rentman - BUILD, INSTALL & RUN" -ForegroundColor Green
Write-Host "==================================================="

# Step 1: Check ADB
Write-Host "[*] Checking ADB and devices..." -ForegroundColor Cyan
try {
    $devices = adb devices 2>&1 | Select-String "device$"
    if (-not $devices) {
        Write-Host "  [!] No devices connected" -ForegroundColor Red
        Write-Host "  [?] Connect your Android device and enable USB Debugging" -ForegroundColor Yellow
        exit 1
    }
    Write-Host "  [+] Device connected" -ForegroundColor Green
    adb devices
    Write-Host ""
}
catch {
    Write-Host "  [!] ADB not found" -ForegroundColor Red
    Write-Host "  [?] Install Android SDK Platform Tools" -ForegroundColor Yellow
    exit 1
}

# Step 2: Build APK
if (-not $SkipBuild) {
    Write-Host "[*] Compiling APK..." -ForegroundColor Cyan
    Push-Location $ANDROID_DIR
    
    if ($Release) {
        $buildType = "Release"
        $gradleTask = "assembleRelease"
    }
    else {
        $buildType = "Debug"
        $gradleTask = "assembleDebug"
    }
    
    Write-Host "  Type: $buildType" -ForegroundColor Gray
    
    try {
        if ($IsWindows) {
            .\gradlew.bat clean $gradleTask --no-daemon 2>&1 | Out-Null
        }
        else {
            ./gradlew clean $gradleTask --no-daemon 2>&1 | Out-Null
        }
        Write-Host "  [+] Build completed" -ForegroundColor Green
    }
    catch {
        Write-Host "  [!] Build failed" -ForegroundColor Red
        Write-Host $_.Exception.Message
        Pop-Location
        exit 1
    }
    
    Pop-Location
}
else {
    Write-Host "[>] Skipping build (using existing APK)" -ForegroundColor Yellow
}

# Step 3: Locate APK
Write-Host "[*] Locating APK..." -ForegroundColor Cyan
if ($Release) {
    $apkPath = Get-ChildItem -Path $ANDROID_DIR -Recurse -Filter "app-release.apk" | Select-Object -First 1
}
else {
    $apkPath = Get-ChildItem -Path $ANDROID_DIR -Recurse -Filter "app-debug.apk" | Select-Object -First 1
}

if (-not $apkPath) {
    Write-Host "  [!] APK not found" -ForegroundColor Red
    exit 1
}

$apkSize = [math]::Round($apkPath.Length / 1MB, 2)
Write-Host "  [+] APK: $($apkPath.Name)" -ForegroundColor Green
Write-Host "  [i] Size: $apkSize MB" -ForegroundColor Gray

# Step 4: Uninstall if requested
if ($UninstallFirst) {
    Write-Host "[*] Uninstalling previous version..." -ForegroundColor Yellow
    adb uninstall $APP_ID 2>&1 | Out-Null
    Write-Host "  [+] Uninstalled" -ForegroundColor Green
}

# Step 5: Install APK
Write-Host "[*] Installing APK..." -ForegroundColor Cyan
try {
    $installOutput = adb install -r $apkPath.FullName 2>&1
    if ($installOutput -match "Success|INSTALL_PARSE_FAILED_NO_CERTIFICATES") {
        Write-Host "  [+] Installed successfully" -ForegroundColor Green
    }
    else {
        Write-Host "  [!] Installation completed with warnings" -ForegroundColor Yellow
        Write-Host "  $installOutput" -ForegroundColor Gray
    }
}
catch {
    Write-Host "  [!] Installation failed" -ForegroundColor Red
    Write-Host $_.Exception.Message
    exit 1
}

# Step 6: Launch App
Write-Host "[*] Launching app..." -ForegroundColor Cyan
try {
    # Launch main activity
    adb shell am start -n "$APP_ID/$APP_ID.MainActivity" 2>&1 | Out-Null
    Write-Host "  [+] App launched" -ForegroundColor Green
}
catch {
    Write-Host "  [!] Could not launch automatically" -ForegroundColor Yellow
    Write-Host "  [?] Launch manually from device" -ForegroundColor Gray
}

# Step 7: Show logcat
Write-Host "[*] Showing logs (Ctrl+C to exit)..." -ForegroundColor Cyan
Write-Host "==================================================="

# Clear logcat and start monitoring
adb logcat -c 2>&1 | Out-Null
Start-Sleep -Seconds 1
adb logcat -s "Capacitor" "$APP_NAME" "chromium"

# Summary (Unreachable if logcat loops, but good for structure)
Write-Host "`n[+] PROCESS COMPLETED" -ForegroundColor Green
