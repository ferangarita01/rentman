# Rentman Build and Deploy Script
# Builds APK (debug/release) and AAB (Play Store)

param(
    [Parameter(Mandatory=$false)]
    [ValidateSet('debug', 'release', 'playstore')]
    [string]$BuildType = 'debug',
    
    [Parameter(Mandatory=$false)]
    [switch]$Install,
    
    [Parameter(Mandatory=$false)]
    [switch]$Start
)

$ErrorActionPreference = "Stop"

Write-Host "🔨 Building Rentman App - Type: $BuildType" -ForegroundColor Cyan

# Step 1: Build Next.js
Write-Host "`n📦 Building Next.js app..." -ForegroundColor Yellow
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Next.js build failed!" -ForegroundColor Red
    exit 1
}

# Step 2: Sync Capacitor
Write-Host "`n🔄 Syncing Capacitor..." -ForegroundColor Yellow
npx cap sync android
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Capacitor sync failed!" -ForegroundColor Red
    exit 1
}

# Step 3: Build Android
Set-Location android

if ($BuildType -eq 'debug') {
    Write-Host "`n🔨 Building Debug APK..." -ForegroundColor Yellow
    .\gradlew assembleDebug --no-daemon
    $apkPath = "app\build\outputs\apk\debug\app-debug.apk"
}
elseif ($BuildType -eq 'release') {
    Write-Host "`n🔨 Building Release APK..." -ForegroundColor Yellow
    .\gradlew assembleRelease --no-daemon
    $apkPath = "app\build\outputs\apk\release\app-release.apk"
}
elseif ($BuildType -eq 'playstore') {
    Write-Host "`n🔨 Building Play Store Bundle (AAB)..." -ForegroundColor Yellow
    .\gradlew bundleRelease --no-daemon
    $aabPath = "app\build\outputs\bundle\release\app-release.aab"
}

Set-Location ..

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Android build failed!" -ForegroundColor Red
    exit 1
}

Write-Host "`n✅ Build successful!" -ForegroundColor Green

# Step 4: Install if requested
if ($Install -and ($BuildType -ne 'playstore')) {
    Write-Host "`n📲 Installing APK..." -ForegroundColor Yellow
    adb install -r "android\$apkPath"
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Installation failed!" -ForegroundColor Red
        exit 1
    }
    
    Write-Host "✅ Installation successful!" -ForegroundColor Green
}

# Step 5: Start app if requested
if ($Start -and $Install) {
    Write-Host "`n🚀 Starting app..." -ForegroundColor Yellow
    adb shell am start -n com.rentman.app/.MainActivity
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ App started!" -ForegroundColor Green
        
        # Show logs
        Write-Host "`n📋 Showing app logs (Ctrl+C to stop)..." -ForegroundColor Yellow
        Start-Sleep -Seconds 2
        adb logcat | Select-String "rentman|Capacitor|Console"
    }
}

# Step 6: Show output paths
Write-Host "`n📁 Build artifacts:" -ForegroundColor Cyan
if ($BuildType -eq 'playstore') {
    Write-Host "  AAB: android\$aabPath" -ForegroundColor White
    Write-Host "`n💡 Upload this AAB to Google Play Console" -ForegroundColor Green
} else {
    Write-Host "  APK: android\$apkPath" -ForegroundColor White
}
