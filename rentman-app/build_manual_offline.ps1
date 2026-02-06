# ========================================
# RENTMAN ANDROID - PRODUCTION BUILD SCRIPT
# No EAS Dependencies | Fully Offline
# ========================================

$ErrorActionPreference = "Stop"
$BuildVersion = "1.0.0"
$BuildDate = Get-Date -Format "yyyy-MM-dd_HHmmss"

Write-Host "╔════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║  RENTMAN ANDROID PRODUCTION BUILD     ║" -ForegroundColor Cyan
Write-Host "║  Version: $BuildVersion                    ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════╝" -ForegroundColor Cyan

# ========================================
# 1. PRE-BUILD VALIDATION
# ========================================
Write-Host "`n[1/7] 🔍 Validating Environment..." -ForegroundColor Yellow

# Check Node.js
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Node.js not found! Install from https://nodejs.org" -ForegroundColor Red
    exit 1
}
$nodeVersion = node --version
Write-Host "  ✅ Node.js: $nodeVersion" -ForegroundColor Green

# Check Java (required for Gradle)
if (-not (Get-Command java -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Java not found! Install JDK 17 or later" -ForegroundColor Red
    exit 1
}
$javaVersion = java -version 2>&1 | Select-Object -First 1
Write-Host "  ✅ Java: $javaVersion" -ForegroundColor Green

# Check Gradle (via project gradlew)
if (Test-Path "android/gradlew") {
    Write-Host "  ✅ Gradle: Found (project wrapper)" -ForegroundColor Green
}

# Check package.json
if (-not (Test-Path "package.json")) {
    Write-Host "❌ package.json not found! Run from project root." -ForegroundColor Red
    exit 1
}

# ========================================
# 2. CLEAN PREVIOUS BUILD
# ========================================
Write-Host "`n[2/7] 🧹 Cleaning Previous Build..." -ForegroundColor Yellow

if (Test-Path "android") {
    Write-Host "  🗑️  Removing old android/ folder..."
    Remove-Item -Recurse -Force "android"
}

if (Test-Path "build-output") {
    Write-Host "  🗑️  Cleaning build-output/ folder..."
    Remove-Item -Recurse -Force "build-output"
}
New-Item -ItemType Directory -Force -Path "build-output" | Out-Null

# ========================================
# 3. GENERATE NATIVE CODE (PREBUILD)
# ========================================
Write-Host "`n[3/7] ⚙️  Generating Native Android Code..." -ForegroundColor Yellow
Write-Host "  📦 Running expo prebuild..." -ForegroundColor Gray

try {
    npx expo prebuild --platform android --clean --no-install
    Write-Host "  ✅ Native code generated" -ForegroundColor Green
} catch {
    Write-Host "❌ Prebuild failed! Check errors above." -ForegroundColor Red
    exit 1
}

# ========================================
# 4. KEYSTORE SETUP
# ========================================
Write-Host "`n[4/7] 🔐 Configuring Keystore..." -ForegroundColor Yellow

$keystorePath = "rentman.keystore"
$keystorePassword = "rentman2026secure"
$keyAlias = "rentman_release_key"

if (-not (Test-Path $keystorePath)) {
    Write-Host "  ⚠️  Keystore not found! Generating production keystore..." -ForegroundColor Yellow
    
    # Check if keytool is available
    if (-not (Get-Command keytool -ErrorAction SilentlyContinue)) {
        Write-Host "❌ keytool not found! Make sure JDK is installed and in PATH." -ForegroundColor Red
        exit 1
    }
    
    keytool -genkeypair `
        -v `
        -keystore $keystorePath `
        -alias $keyAlias `
        -keyalg RSA `
        -keysize 2048 `
        -validity 10000 `
        -storepass $keystorePassword `
        -keypass $keystorePassword `
        -dname "CN=Rentman, OU=Rentman Dev, O=Rentman Inc, L=San Francisco, S=CA, C=US"
    
    Write-Host "  ✅ Keystore generated: $keystorePath" -ForegroundColor Green
    Write-Host "  ⚠️  BACKUP THIS FILE! Without it, you cannot update the app." -ForegroundColor Red
} else {
    Write-Host "  ✅ Existing keystore found: $keystorePath" -ForegroundColor Green
}

# Copy keystore to Android project
Copy-Item $keystorePath "android/app/$keystorePath" -Force
Write-Host "  📋 Keystore copied to android/app/" -ForegroundColor Gray

# ========================================
# 5. CONFIGURE GRADLE SIGNING
# ========================================
Write-Host "`n[5/7] ✍️  Configuring Gradle Signing..." -ForegroundColor Yellow

# Add signing properties to gradle.properties
$gradlePropsPath = "android/gradle.properties"
$signingProps = @"

# Release Signing Configuration
RENTMAN_KEYSTORE_FILE=$keystorePath
RENTMAN_KEYSTORE_PASSWORD=$keystorePassword
RENTMAN_KEY_ALIAS=$keyAlias
RENTMAN_KEY_PASSWORD=$keystorePassword
"@

Add-Content -Path $gradlePropsPath -Value $signingProps
Write-Host "  ✅ Signing properties added to gradle.properties" -ForegroundColor Green

# Inject signing config into build.gradle
$buildGradlePath = "android/app/build.gradle"
$buildGradleContent = Get-Content $buildGradlePath -Raw

# Check if signing config already exists
if ($buildGradleContent -notmatch "signingConfigs\.release") {
    Write-Host "  📝 Injecting signing configuration into build.gradle..." -ForegroundColor Gray
    
    # Find the android { block and inject signingConfigs
    $signingConfigBlock = @"

    signingConfigs {
        release {
            if (project.hasProperty('RENTMAN_KEYSTORE_FILE')) {
                storeFile file(RENTMAN_KEYSTORE_FILE)
                storePassword RENTMAN_KEYSTORE_PASSWORD
                keyAlias RENTMAN_KEY_ALIAS
                keyPassword RENTMAN_KEY_PASSWORD
            }
        }
    }
"@
    
    # Find buildTypes and add signingConfig reference
    $buildGradleContent = $buildGradleContent -replace "(buildTypes\s*{)", "`$1$signingConfigBlock"
    $buildGradleContent = $buildGradleContent -replace "(release\s*{[^}]*minifyEnabled)", "release {`n            signingConfig signingConfigs.release`n            minifyEnabled"
    
    Set-Content -Path $buildGradlePath -Value $buildGradleContent
    Write-Host "  ✅ Signing config injected" -ForegroundColor Green
} else {
    Write-Host "  ℹ️  Signing config already exists" -ForegroundColor Gray
}

# ========================================
# 6. BUILD APK & AAB
# ========================================
Write-Host "`n[6/7] 🔨 Building Android Artifacts..." -ForegroundColor Yellow
Write-Host "  ⏱️  This may take 5-15 minutes depending on your machine..." -ForegroundColor Gray

Push-Location "android"

try {
    # Clean previous build
    Write-Host "`n  🧹 Cleaning Gradle cache..." -ForegroundColor Gray
    .\gradlew clean
    
    # Build Release APK
    Write-Host "`n  📱 Building Release APK..." -ForegroundColor Cyan
    .\gradlew assembleRelease --warning-mode all
    
    if (-not (Test-Path "app/build/outputs/apk/release/app-release.apk")) {
        throw "APK build failed - output not found"
    }
    Write-Host "  ✅ APK built successfully" -ForegroundColor Green
    
    # Build Release AAB (for Google Play)
    Write-Host "`n  📦 Building Release AAB (App Bundle)..." -ForegroundColor Cyan
    .\gradlew bundleRelease --warning-mode all
    
    if (-not (Test-Path "app/build/outputs/bundle/release/app-release.aab")) {
        throw "AAB build failed - output not found"
    }
    Write-Host "  ✅ AAB built successfully" -ForegroundColor Green
    
} catch {
    Write-Host "`n❌ Build failed! Error: $_" -ForegroundColor Red
    Pop-Location
    exit 1
} finally {
    Pop-Location
}

# ========================================
# 7. COPY ARTIFACTS & GENERATE REPORT
# ========================================
Write-Host "`n[7/7] 📦 Packaging Build Artifacts..." -ForegroundColor Yellow

# Copy artifacts to build-output folder
$apkSource = "android/app/build/outputs/apk/release/app-release.apk"
$aabSource = "android/app/build/outputs/bundle/release/app-release.aab"
$mappingSource = "android/app/build/outputs/mapping/release/mapping.txt"

$apkDest = "build-output/rentman-v$BuildVersion-$BuildDate.apk"
$aabDest = "build-output/rentman-v$BuildVersion-$BuildDate.aab"

Copy-Item $apkSource $apkDest -Force
Copy-Item $aabSource $aabDest -Force

if (Test-Path $mappingSource) {
    Copy-Item $mappingSource "build-output/mapping-$BuildDate.txt" -Force
}

# Get file sizes
$apkSize = [math]::Round((Get-Item $apkDest).Length / 1MB, 2)
$aabSize = [math]::Round((Get-Item $aabDest).Length / 1MB, 2)

# Generate build report
$buildReport = @"
╔════════════════════════════════════════╗
║     BUILD COMPLETED SUCCESSFULLY       ║
╚════════════════════════════════════════╝

Build Information:
  📅 Date:     $BuildDate
  🏷️  Version:  $BuildVersion
  📦 Package:  com.rentman.app

Build Artifacts:
  📱 APK:      $apkDest ($apkSize MB)
  📦 AAB:      $aabDest ($aabSize MB)
  🔐 Keystore: $keystorePath

Installation Options:
  
  📲 ADB Install (USB):
     adb install -r "$apkDest"
     
  📲 ADB Install + Launch:
     adb install -r "$apkDest"
     adb shell am start -n com.rentman.app/.MainActivity
     
  📲 Multiple Devices:
     adb devices
     adb -s DEVICE_ID install -r "$apkDest"
  
  📂 Manual Install:
     1. Copy APK to device
     2. Enable "Install from Unknown Sources"
     3. Tap APK to install
     
  📊 View Logs:
     adb logcat | Select-String "Rentman"
     adb logcat -s ReactNativeJS:V
  
Play Store Upload:
  1. Go to https://play.google.com/console
  2. Upload: $aabDest
  
Security Reminder:
  ⚠️  BACKUP '$keystorePath' SECURELY!
  ⚠️  Without it, you CANNOT update the app in Play Store.
  
Next Steps:
  1. Test APK on physical device
  2. Verify all features (GPS, notifications, auth)
  3. Upload AAB to Google Play Console
  4. Submit for review

╔════════════════════════════════════════╗
║       BUILD COMPLETED SUCCESSFULLY     ║
╚════════════════════════════════════════╝
"@

Write-Host $buildReport -ForegroundColor Green

# Save report to file
$buildReport | Out-File "build-output/BUILD_REPORT_$BuildDate.txt" -Encoding UTF8

Write-Host "`n📄 Build report saved: build-output/BUILD_REPORT_$BuildDate.txt" -ForegroundColor Cyan

# ========================================
# 8. ADB INSTALL & LAUNCH (OPTIONAL)
# ========================================
Write-Host "`n[8/8] 📱 ADB Installation (Optional)..." -ForegroundColor Yellow

# Check if ADB is available
$adbAvailable = Get-Command adb -ErrorAction SilentlyContinue

if ($adbAvailable) {
    # Check for connected devices
    $devices = adb devices | Select-String -Pattern "device$"
    
    if ($devices) {
        Write-Host "  ✅ ADB found - Connected devices detected" -ForegroundColor Green
        
        $install = Read-Host "`n  Install APK on connected device? (Y/N)"
        
        if ($install -eq "Y" -or $install -eq "y") {
            Write-Host "`n  📲 Installing APK via ADB..." -ForegroundColor Cyan
            
            try {
                # Uninstall old version first (ignore errors if not installed)
                adb uninstall com.rentman.app 2>&1 | Out-Null
                
                # Install new APK
                adb install -r $apkDest
                
                if ($LASTEXITCODE -eq 0) {
                    Write-Host "  ✅ APK installed successfully" -ForegroundColor Green
                    
                    $launch = Read-Host "`n  Launch app now? (Y/N)"
                    
                    if ($launch -eq "Y" -or $launch -eq "y") {
                        Write-Host "`n  🚀 Launching Rentman app..." -ForegroundColor Cyan
                        
                        # Launch the app
                        adb shell am start -n com.rentman.app/.MainActivity
                        
                        Write-Host "  ✅ App launched on device" -ForegroundColor Green
                        Write-Host "`n  💡 Tip: View logs with: adb logcat | Select-String 'Rentman'" -ForegroundColor Gray
                    }
                } else {
                    Write-Host "  ❌ Installation failed. Try manually: adb install -r $apkDest" -ForegroundColor Red
                }
            } catch {
                Write-Host "  ❌ ADB installation error: $_" -ForegroundColor Red
            }
        } else {
            Write-Host "  ℹ️  Skipped ADB installation" -ForegroundColor Gray
            Write-Host "  💡 Install manually: adb install -r $apkDest" -ForegroundColor Gray
        }
    } else {
        Write-Host "  ⚠️  No devices connected via ADB" -ForegroundColor Yellow
        Write-Host "  💡 Connect device and enable USB Debugging" -ForegroundColor Gray
    }
} else {
    Write-Host "  ℹ️  ADB not found - Install Android Platform Tools" -ForegroundColor Gray
    Write-Host "  💡 Manual install: Copy APK to device and tap to install" -ForegroundColor Gray
}

Write-Host "`n🎉 Build process completed successfully!`n" -ForegroundColor Green
