# Rentman App - Quick Verification Script
# Run this to verify all components are ready for build

Write-Host "🎯 RENTMAN APP - VERIFICATION CHECK" -ForegroundColor Cyan
Write-Host "====================================`n" -ForegroundColor Cyan

$projectRoot = "C:\Users\Natan\Documents\predict\Rentman\rentman-app"
Set-Location $projectRoot

# 1. Check Assets
Write-Host "📦 Checking Assets..." -ForegroundColor Yellow
$assets = @("icon.png", "adaptive-icon.png", "splash.png", "splash-icon.png", "favicon.png")
foreach ($asset in $assets) {
    $path = "assets\$asset"
    if (Test-Path $path) {
        $size = (Get-Item $path).Length
        Write-Host "  ✅ $asset ($([math]::Round($size/1KB, 1)) KB)" -ForegroundColor Green
    } else {
        Write-Host "  ❌ $asset MISSING!" -ForegroundColor Red
    }
}

# 2. Check Key Files
Write-Host "`n📄 Checking Key Files..." -ForegroundColor Yellow
$files = @(
    "app\mission\[id].tsx",
    "services\location.ts",
    "services\notifications.ts",
    "components\ui\CyberpunkCard.tsx",
    "app.json",
    "package.json",
    "eas.json"
)
foreach ($file in $files) {
    if (Test-Path $file) {
        Write-Host "  ✅ $file" -ForegroundColor Green
    } else {
        Write-Host "  ❌ $file MISSING!" -ForegroundColor Red
    }
}

# 3. Check Dependencies
Write-Host "`n📚 Checking Critical Dependencies..." -ForegroundColor Yellow
$deps = @("expo-location", "expo-notifications", "expo-task-manager", "expo-image-picker")
foreach ($dep in $deps) {
    $check = npm ls $dep 2>&1 | Select-String -Pattern "$dep@"
    if ($check) {
        Write-Host "  ✅ $dep installed" -ForegroundColor Green
    } else {
        Write-Host "  ❌ $dep NOT FOUND!" -ForegroundColor Red
    }
}

# 4. Check app.json configuration
Write-Host "`n⚙️  Checking app.json..." -ForegroundColor Yellow
$appJson = Get-Content "app.json" -Raw | ConvertFrom-Json
if ($appJson.expo.extra.eas.projectId) {
    Write-Host "  ✅ ProjectId: $($appJson.expo.extra.eas.projectId)" -ForegroundColor Green
} else {
    Write-Host "  ❌ ProjectId missing!" -ForegroundColor Red
}
if ($appJson.expo.android.permissions -contains "ACCESS_BACKGROUND_LOCATION") {
    Write-Host "  ✅ Background location permission configured" -ForegroundColor Green
} else {
    Write-Host "  ❌ Background location permission missing!" -ForegroundColor Red
}

# 5. Check keystore
Write-Host "`n🔐 Checking Keystore..." -ForegroundColor Yellow
if (Test-Path "rentman.keystore") {
    Write-Host "  ✅ rentman.keystore found" -ForegroundColor Green
} else {
    Write-Host "  ❌ rentman.keystore NOT FOUND!" -ForegroundColor Red
}

# 6. Check build scripts
Write-Host "`n🛠️  Checking Build Scripts..." -ForegroundColor Yellow
if (Test-Path "build_android_release.ps1") {
    Write-Host "  ✅ build_android_release.ps1" -ForegroundColor Green
} else {
    Write-Host "  ❌ build_android_release.ps1 missing" -ForegroundColor Red
}

# Summary
Write-Host "`n====================================`n" -ForegroundColor Cyan
Write-Host "✅ VERIFICATION COMPLETE" -ForegroundColor Green
Write-Host "`nNext steps:" -ForegroundColor Yellow
Write-Host "  1. npm start          - Test in development" -ForegroundColor White
Write-Host "  2. npm run android    - Test on emulator/device" -ForegroundColor White
Write-Host "  3. .\build_android_release.ps1  - Build APK" -ForegroundColor White
Write-Host ""
