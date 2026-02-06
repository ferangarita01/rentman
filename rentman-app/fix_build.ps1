# Fix & Build Script for Rentman Android
$ErrorActionPreference = "Stop"

Write-Host "Starting Rentman Build Repair..." -ForegroundColor Cyan

# 1. Kill Zombies
Write-Host "Killing lingering processes..." -ForegroundColor Yellow
Stop-Process -Name "java" -Force -ErrorAction SilentlyContinue
Stop-Process -Name "node" -Force -ErrorAction SilentlyContinue
Stop-Process -Name "adb" -Force -ErrorAction SilentlyContinue

# 2. Clean (Robust)
Write-Host "Cleaning environment (CMD)..." -ForegroundColor Yellow
if (Test-Path "node_modules") { cmd /c "rmdir /s /q node_modules" }
if (Test-Path "android") { cmd /c "rmdir /s /q android" }
if (Test-Path ".expo") { cmd /c "rmdir /s /q .expo" }
if (Test-Path "package-lock.json") { Remove-Item -Force "package-lock.json" -ErrorAction SilentlyContinue }

# 2. Reinstall
Write-Host "Installing Dependencies..." -ForegroundColor Yellow
npm install --force
if ($LASTEXITCODE -ne 0) { Write-Error "npm install failed"; exit 1 }
npm install crypto-random-string@2.0.0
npm install react-native-url-polyfill

# 3. Assets
Write-Host "Verifying Assets..." -ForegroundColor Yellow
if (-not (Test-Path "assets/splash.png")) {
    if (Test-Path "assets/splash-icon.png") {
        Copy-Item "assets/splash-icon.png" "assets/splash.png"
        Write-Host "Created splash.png" -ForegroundColor Green
    }
}

# 4. Prebuild
Write-Host "Generating Android Project..." -ForegroundColor Yellow
npx expo prebuild --platform android --clean --no-install

# 5. Keystore
Write-Host "Configuring Keystore..." -ForegroundColor Yellow
if (-not (Test-Path "rentman.keystore")) {
    keytool -genkey -v -keystore rentman.keystore -alias rentman_key -keyalg RSA -keysize 2048 -validity 10000 -storepass rentman123 -keypass rentman123 -dname "CN=Rentman Dev, OU=Rentman, O=Rentman, L=City, S=State, C=US"
}
Copy-Item "rentman.keystore" "android/app/rentman.keystore"

# 6. Build
Write-Host "Building APK..." -ForegroundColor Yellow
Set-Location android
.\gradlew clean
.\gradlew assembleRelease --no-daemon

Write-Host "Build Success!" -ForegroundColor Green
Write-Host "APK: android/app/build/outputs/apk/release/app-release.apk"
