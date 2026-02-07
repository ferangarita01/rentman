# Build Production AAB for Play Console
# Usage: .\build_prod.ps1

$ErrorActionPreference = "Stop"

Write-Host "🚀 Starting Production Build (AAB)..." -ForegroundColor Cyan

# 1. Inject Signing Config into build.gradle
Write-Host "🔐 Configuring Release Signing..." -ForegroundColor Yellow
$gradlePath = "android/app/build.gradle"
$content = Get-Content $gradlePath -Raw

# Check if already patched
if ($content -notmatch "signingConfigs.release") {
    # Define release signing block
    $signingBlock = @"
    signingConfigs {
        debug {
            storeFile file('debug.keystore')
            storePassword 'android'
            keyAlias 'androiddebugkey'
            keyPassword 'android'
        }
        release {
            if (project.hasProperty('RENTMAN_KEYSTORE')) {
                storeFile file(RENTMAN_KEYSTORE)
                storePassword RENTMAN_KEY_PASSWORD
                keyAlias RENTMAN_KEY_ALIAS
                keyPassword RENTMAN_KEY_PASSWORD
            } else {
                storeFile file('rentman.keystore')
                storePassword 'rentman123'
                keyAlias 'rentman_key'
                keyPassword 'rentman123'
            }
        }
    }
"@
    # Replace the default signingConfigs block
    $content = $content -replace "signingConfigs\s+\{[\s\S]*?\}", $signingBlock

    # Update build types to use release signing
    $content = $content -replace "signingConfig signingConfigs.debug", "signingConfig signingConfigs.release"
    
    Set-Content $gradlePath $content
    Write-Host "✅ Injected signing config into build.gradle" -ForegroundColor Green
}
else {
    Write-Host "ℹ️  build.gradle already configured" -ForegroundColor Gray
}

# 2. Build Bundle (AAB)
Write-Host "`n📦 Building Android App Bundle (AAB)..." -ForegroundColor Yellow
Set-Location android

# Run bundleRelease
.\gradlew bundleRelease --no-daemon

Write-Host "`n✅ Production Build Success!" -ForegroundColor Green
Write-Host "📂 AAB Location: android/app/build/outputs/bundle/release/app-release.aab"
Write-Host "👉 Upload this file to Google Play Console"
