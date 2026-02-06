# RENTMAN - ADB INSTALL & LAUNCH
param(
    [string]$DeviceId = ""
)

$PackageName = "com.rentman.app"
$MainActivity = "$PackageName/.MainActivity"

Write-Host "Checking ADB..." -ForegroundColor Yellow
if (-not (Get-Command adb -ErrorAction SilentlyContinue)) {
    Write-Host "ADB not found!" -ForegroundColor Red
    exit 1
}

if ($DeviceId -ne "") {
    $adb = "adb -s $DeviceId"
}
else {
    $adb = "adb"
}

# Auto-detect APK
Write-Host "Locating APK..." -ForegroundColor Yellow
$ApkPath = ""
if (Test-Path "android\app\build\outputs\apk\release\app-release.apk") {
    $ApkPath = "android\app\build\outputs\apk\release\app-release.apk"
}
elseif (Test-Path "android\app\build\outputs\apk\debug\app-debug.apk") {
    $ApkPath = "android\app\build\outputs\apk\debug\app-debug.apk"
}

if ($ApkPath -eq "") {
    Write-Host "APK not found!" -ForegroundColor Red
    exit 1
}

Write-Host "Installing $ApkPath..." -ForegroundColor Cyan

# Uninstall first
Write-Host "Uninstalling old version..."
Invoke-Expression "$adb uninstall $PackageName" | Out-Null

# Install
Write-Host "Installing new version..."
Invoke-Expression "$adb install -r $ApkPath"
if ($LASTEXITCODE -eq 0) {
    Write-Host "Success!" -ForegroundColor Green
    
    # Launch
    Write-Host "Launching app..."
    Invoke-Expression "$adb shell am start -n $MainActivity"
}
else {
    Write-Host "Install Failed!" -ForegroundColor Red
    exit 1
}
