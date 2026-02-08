# Rentman Android Release Build Script (Secure)
# This script ensures environment variables are set before building

Write-Host "🔐 Rentman Secure Release Build" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

# Check if environment variables are set
$missingVars = @()

if (-not $env:RENTMAN_KEYSTORE_PASSWORD) {
    $missingVars += "RENTMAN_KEYSTORE_PASSWORD"
}
if (-not $env:RENTMAN_KEY_ALIAS) {
    $missingVars += "RENTMAN_KEY_ALIAS"
}
if (-not $env:RENTMAN_KEY_PASSWORD) {
    $missingVars += "RENTMAN_KEY_PASSWORD"
}

if ($missingVars.Count -gt 0) {
    Write-Host "❌ ERROR: Missing required environment variables:" -ForegroundColor Red
    $missingVars | ForEach-Object { Write-Host "   - $_" -ForegroundColor Yellow }
    Write-Host ""
    Write-Host "ℹ️  To set them, run:" -ForegroundColor Cyan
    Write-Host '   $env:RENTMAN_KEYSTORE_PASSWORD = "your_password"' -ForegroundColor Gray
    Write-Host '   $env:RENTMAN_KEY_ALIAS = "rentman"' -ForegroundColor Gray
    Write-Host '   $env:RENTMAN_KEY_PASSWORD = "your_password"' -ForegroundColor Gray
    Write-Host ""
    Write-Host "Or see SECURITY_SETUP.md for more options" -ForegroundColor Gray
    exit 1
}

Write-Host "✅ Environment variables verified" -ForegroundColor Green
Write-Host ""

# Verify keystore file exists
$keystorePath = ".\android\rentman-release-key.jks"
if (-not (Test-Path $keystorePath)) {
    Write-Host "❌ ERROR: Keystore file not found at: $keystorePath" -ForegroundColor Red
    Write-Host "   Please ensure the keystore file exists" -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ Keystore file found" -ForegroundColor Green
Write-Host ""

# Build process
Write-Host "🏗️  Starting build process..." -ForegroundColor Cyan
Write-Host ""

Write-Host "Step 1/3: Building Next.js app..." -ForegroundColor Yellow
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Next.js build failed" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Step 2/3: Syncing Capacitor..." -ForegroundColor Yellow
npx cap sync
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Capacitor sync failed" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Step 3/3: Building Release APK..." -ForegroundColor Yellow
Set-Location android
.\gradlew assembleRelease
$buildExitCode = $LASTEXITCODE
Set-Location ..

if ($buildExitCode -ne 0) {
    Write-Host ""
    Write-Host "❌ Android build failed" -ForegroundColor Red
    exit 1
}

# Success!
Write-Host ""
Write-Host "✅ BUILD SUCCESSFUL!" -ForegroundColor Green
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "📦 APK Location:" -ForegroundColor Cyan
Write-Host "   android\app\build\outputs\apk\release\app-release.apk" -ForegroundColor White
Write-Host ""

# Show APK info
$apkPath = ".\android\app\build\outputs\apk\release\app-release.apk"
if (Test-Path $apkPath) {
    $apkSize = (Get-Item $apkPath).Length / 1MB
    Write-Host "📊 APK Size: $([math]::Round($apkSize, 2)) MB" -ForegroundColor Cyan
    Write-Host ""
}

Write-Host "🚀 Next steps:" -ForegroundColor Cyan
Write-Host "   1. Test the APK on a device" -ForegroundColor Gray
Write-Host "   2. Upload to Google Play Console" -ForegroundColor Gray
Write-Host "   3. Submit for review" -ForegroundColor Gray
Write-Host ""
