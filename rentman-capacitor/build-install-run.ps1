#!/usr/bin/env pwsh
# 🚀 Rentman - Build, Install & Run Automation Script
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

Write-Host "🚀 $APP_NAME - BUILD, INSTALL & RUN" -ForegroundColor Green
Write-Host "═══════════════════════════════════════════════════`n"

# Step 1: Check ADB
Write-Host "📱 Verificando ADB y dispositivos..." -ForegroundColor Cyan
try {
    $devices = adb devices 2>&1 | Select-String "device$"
    if (-not $devices) {
        Write-Host "  ✗ No hay dispositivos conectados" -ForegroundColor Red
        Write-Host "  💡 Conecta tu dispositivo Android y habilita USB Debugging`n" -ForegroundColor Yellow
        exit 1
    }
    Write-Host "  ✓ Dispositivo conectado`n" -ForegroundColor Green
    adb devices
    Write-Host ""
} catch {
    Write-Host "  ✗ ADB no encontrado" -ForegroundColor Red
    Write-Host "  💡 Instala Android SDK Platform Tools`n" -ForegroundColor Yellow
    exit 1
}

# Step 2: Build APK
if (-not $SkipBuild) {
    Write-Host "🏗️  Compilando APK..." -ForegroundColor Cyan
    Push-Location $ANDROID_DIR
    
    $buildType = if ($Release) { "Release" } else { "Debug" }
    $gradleTask = if ($Release) { "assembleRelease" } else { "assembleDebug" }
    
    Write-Host "  Tipo: $buildType`n" -ForegroundColor Gray
    
    try {
        .\gradlew.bat clean $gradleTask --no-daemon 2>&1 | Out-Null
        Write-Host "  ✓ Build completado`n" -ForegroundColor Green
    } catch {
        Write-Host "  ✗ Build falló" -ForegroundColor Red
        Write-Host $_.Exception.Message
        Pop-Location
        exit 1
    }
    
    Pop-Location
} else {
    Write-Host "⏭️  Saltando build (usando APK existente)`n" -ForegroundColor Yellow
}

# Step 3: Locate APK
Write-Host "📦 Ubicando APK..." -ForegroundColor Cyan
$apkPath = if ($Release) {
    Get-ChildItem -Path $ANDROID_DIR -Recurse -Filter "app-release.apk" | Select-Object -First 1
} else {
    Get-ChildItem -Path $ANDROID_DIR -Recurse -Filter "app-debug.apk" | Select-Object -First 1
}

if (-not $apkPath) {
    Write-Host "  ✗ APK no encontrado" -ForegroundColor Red
    exit 1
}

$apkSize = [math]::Round($apkPath.Length / 1MB, 2)
Write-Host "  ✓ APK: $($apkPath.Name)" -ForegroundColor Green
Write-Host "  📏 Tamaño: $apkSize MB`n" -ForegroundColor Gray

# Step 4: Uninstall if requested
if ($UninstallFirst) {
    Write-Host "🗑️  Desinstalando versión anterior..." -ForegroundColor Yellow
    adb uninstall $APP_ID 2>&1 | Out-Null
    Write-Host "  ✓ Desinstalado`n" -ForegroundColor Green
}

# Step 5: Install APK
Write-Host "📥 Instalando APK..." -ForegroundColor Cyan
try {
    $installOutput = adb install -r $apkPath.FullName 2>&1
    if ($installOutput -match "Success|INSTALL_PARSE_FAILED_NO_CERTIFICATES") {
        Write-Host "  ✓ Instalado correctamente`n" -ForegroundColor Green
    } else {
        Write-Host "  ⚠️  Instalación completada con advertencias" -ForegroundColor Yellow
        Write-Host "  $installOutput`n" -ForegroundColor Gray
    }
} catch {
    Write-Host "  ✗ Instalación falló" -ForegroundColor Red
    Write-Host $_.Exception.Message
    exit 1
}

# Step 6: Launch App
Write-Host "🚀 Iniciando app..." -ForegroundColor Cyan
try {
    # Launch main activity
    adb shell am start -n "$APP_ID/$APP_ID.MainActivity" 2>&1 | Out-Null
    Write-Host "  ✓ App iniciada`n" -ForegroundColor Green
} catch {
    Write-Host "  ⚠️  No se pudo iniciar automáticamente" -ForegroundColor Yellow
    Write-Host "  💡 Inicia manualmente desde el dispositivo`n" -ForegroundColor Gray
}

# Step 7: Show logcat
Write-Host "📊 Mostrando logs (Ctrl+C para salir)..." -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════`n"

# Clear logcat and start monitoring
adb logcat -c 2>&1 | Out-Null
Start-Sleep -Seconds 1
adb logcat -s "Capacitor","$APP_NAME","chromium"

# Summary
Write-Host "`n✅ PROCESO COMPLETADO" -ForegroundColor Green
Write-Host "═══════════════════════════════════════════════════`n"
Write-Host "📱 App: $APP_NAME" -ForegroundColor Cyan
Write-Host "📦 APK: $($apkPath.Name)" -ForegroundColor Cyan
Write-Host "📏 Tamaño: $apkSize MB" -ForegroundColor Cyan
Write-Host ""
