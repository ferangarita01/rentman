# Rentman APK Build, Install & Launch Script (Windows PowerShell)
# Usage: .\build-install.ps1 [-BuildType debug|release]

param(
    [string]$BuildType = "debug"
)

$PROJECT_DIR = "C:\Users\Natan\Documents\predict\Rentman\rentman-capacitor"
$ANDROID_DIR = "$PROJECT_DIR\android"
$APP_PACKAGE = "com.rentman.app"

Write-Host "🚀 Rentman Build, Install & Launch Script" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "Build type: $BuildType" -ForegroundColor Yellow
Write-Host ""

# Step 1: Sync Capacitor
Write-Host "📦 Step 1/5: Syncing Capacitor..." -ForegroundColor Green
Set-Location $PROJECT_DIR
npx cap sync android
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Capacitor sync failed" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Capacitor synced" -ForegroundColor Green
Write-Host ""

# Step 2: Build APK
Write-Host "🔨 Step 2/5: Building APK..." -ForegroundColor Green
Set-Location $ANDROID_DIR

if ($BuildType -eq "release") {
    .\gradlew.bat assembleRelease
    $APK_PATH = "app\build\outputs\apk\release\app-release.apk"
} else {
    .\gradlew.bat assembleDebug
    $APK_PATH = "app\build\outputs\apk\debug\app-debug.apk"
}

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Build failed" -ForegroundColor Red
    exit 1
}
Write-Host "✅ APK built successfully" -ForegroundColor Green
Write-Host ""

# Step 3: Check for connected devices
Write-Host "📱 Step 3/5: Checking for connected devices..." -ForegroundColor Green
adb devices -l
$devices = adb devices | Select-String "device$"
if ($devices.Count -eq 0) {
    Write-Host "❌ No devices connected. Please connect a device or start an emulator." -ForegroundColor Red
    exit 1
}
Write-Host "✅ Found $($devices.Count) device(s)" -ForegroundColor Green
Write-Host ""

# Step 4: Uninstall old version (optional)
Write-Host "🗑️  Step 4/5: Removing old version..." -ForegroundColor Green
adb uninstall $APP_PACKAGE 2>$null
Write-Host "✅ Old version removed (if existed)" -ForegroundColor Green
Write-Host ""

# Step 5: Install APK
Write-Host "📲 Step 5/5: Installing APK..." -ForegroundColor Green
adb install -r "$APK_PATH"
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Installation failed" -ForegroundColor Red
    exit 1
}
Write-Host "✅ APK installed successfully" -ForegroundColor Green
Write-Host ""

# Step 6: Launch app
Write-Host "🎯 Launching app..." -ForegroundColor Green
adb shell am start -n "$APP_PACKAGE/.MainActivity"
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to launch app" -ForegroundColor Red
    exit 1
}
Write-Host "✅ App launched successfully" -ForegroundColor Green
Write-Host ""

Write-Host "✨ All done! App is running on your device." -ForegroundColor Cyan
Write-Host "📊 To view logs: adb logcat | Select-String -Pattern 'rentman'" -ForegroundColor Yellow
