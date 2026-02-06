# Build Script for Rentman Android Release
# Usage: .\build_android_release.ps1

Write-Host "🏗️  Starting Rentman Android Build Process..." -ForegroundColor Cyan

# 1. Check for EAS CLI
if (-not (Get-Command eas -ErrorAction SilentlyContinue)) {
    Write-Host "📦 Installing EAS CLI globally..." -ForegroundColor Yellow
    npm install -g eas-cli
}

# 2. Login Check
Write-Host "🔑 Checking EAS Authentication..." -ForegroundColor Yellow
try {
    eas whoami
} catch {
    Write-Host "⚠️  Please log in to Expo:" -ForegroundColor Red
    eas login
}

# 3. Build APK for ADB (Preview)
Write-Host "`n📱 Building APK for local testing (ADB)..." -ForegroundColor Cyan
Write-Host "   Profile: preview"
Write-Host "   Output: rentman-app.apk"
eas build --platform android --profile preview --local --output rentman-app.apk

# 4. Build AAB for Play Store (Production)
Write-Host "`n🚀 Building AAB for Play Store..." -ForegroundColor Cyan
Write-Host "   Profile: production"
Write-Host "   Output: rentman-app.aab"
eas build --platform android --profile production --local --output rentman-app.aab

Write-Host "`n✅ Build Process Complete!" -ForegroundColor Green
Write-Host "📂 Files created:"
Write-Host "   - rentman-app.apk (Install with: adb install rentman-app.apk)"
Write-Host "   - rentman-app.aab (Upload to Google Play Console)"
