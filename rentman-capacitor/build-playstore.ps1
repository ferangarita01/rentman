#!/usr/bin/env pwsh
# 🚀 Rentman - Build Release APK + AAB for Play Store

$ErrorActionPreference = "Stop"

$PROJECT_ROOT = $PSScriptRoot
$ANDROID_DIR = Join-Path $PROJECT_ROOT "android"
$OUTPUT_DIR = Join-Path $PROJECT_ROOT "playstore-release"

Write-Host "🚀 RENTMAN - PLAY STORE BUILD" -ForegroundColor Green
Write-Host "═══════════════════════════════════════════════════`n"

# Create output directory
New-Item -ItemType Directory -Force -Path $OUTPUT_DIR | Out-Null

# Step 1: Clean build
Write-Host "🧹 Limpiando build anterior..." -ForegroundColor Cyan
Push-Location $ANDROID_DIR
.\gradlew.bat clean --no-daemon | Out-Null
Write-Host "  ✓ Limpieza completada`n" -ForegroundColor Green

# Step 2: Build Release APK
Write-Host "📦 Compilando Release APK..." -ForegroundColor Cyan
.\gradlew.bat assembleRelease --no-daemon 2>&1 | Out-Null
if ($LASTEXITCODE -eq 0) {
    Write-Host "  ✓ APK Release completado`n" -ForegroundColor Green
} else {
    Write-Host "  ✗ Error compilando APK" -ForegroundColor Red
    Pop-Location
    exit 1
}

# Step 3: Build AAB (Android App Bundle)
Write-Host "📦 Compilando AAB (App Bundle)..." -ForegroundColor Cyan
.\gradlew.bat bundleRelease --no-daemon 2>&1 | Out-Null
if ($LASTEXITCODE -eq 0) {
    Write-Host "  ✓ AAB completado`n" -ForegroundColor Green
} else {
    Write-Host "  ✗ Error compilando AAB" -ForegroundColor Red
    Pop-Location
    exit 1
}

Pop-Location

# Step 4: Copy files to output directory
Write-Host "📂 Copiando archivos..." -ForegroundColor Cyan

$apkSource = Get-ChildItem -Path $ANDROID_DIR -Recurse -Filter "app-release.apk" | Select-Object -First 1
$aabSource = Get-ChildItem -Path $ANDROID_DIR -Recurse -Filter "app-release.aab" | Select-Object -First 1

if ($apkSource) {
    $apkDest = Join-Path $OUTPUT_DIR "rentman-release-$(Get-Date -Format 'yyyyMMdd-HHmmss').apk"
    Copy-Item $apkSource.FullName -Destination $apkDest
    $apkSize = [math]::Round($apkSource.Length / 1MB, 2)
    Write-Host "  ✓ APK: $apkDest" -ForegroundColor Green
    Write-Host "    📏 Tamaño: $apkSize MB" -ForegroundColor Gray
}

if ($aabSource) {
    $aabDest = Join-Path $OUTPUT_DIR "rentman-release-$(Get-Date -Format 'yyyyMMdd-HHmmss').aab"
    Copy-Item $aabSource.FullName -Destination $aabDest
    $aabSize = [math]::Round($aabSource.Length / 1MB, 2)
    Write-Host "  ✓ AAB: $aabDest" -ForegroundColor Green
    Write-Host "    📏 Tamaño: $aabSize MB" -ForegroundColor Gray
}

Write-Host "`n✅ BUILD COMPLETADO" -ForegroundColor Green
Write-Host "═══════════════════════════════════════════════════`n"
Write-Host "📁 Archivos en: $OUTPUT_DIR" -ForegroundColor Cyan
Write-Host "`n📤 Próximos pasos:" -ForegroundColor Yellow
Write-Host "  1. Prueba el APK en dispositivo: adb install $apkDest"
Write-Host "  2. Sube el AAB a Play Console: https://play.google.com/console"
Write-Host ""
