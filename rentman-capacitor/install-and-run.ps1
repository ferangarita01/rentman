#!/usr/bin/env pwsh
# 📥 Rentman - Install & Run Script
# Installs existing APK and launches app

param(
    [switch]$Release,
    [switch]$UninstallFirst,
    [switch]$ShowLogs
)

$ErrorActionPreference = "Stop"

$PROJECT_ROOT = $PSScriptRoot
$APP_ID = "com.rentman.app"
$APP_NAME = "Rentman"

Write-Host "📥 $APP_NAME - INSTALL & RUN" -ForegroundColor Green
Write-Host "═══════════════════════════════════════════════════`n"

# Check ADB
Write-Host "📱 Verificando dispositivos..." -ForegroundColor Cyan
try {
    $devices = adb devices 2>&1 | Select-String "device$"
    if (-not $devices) {
        Write-Host "  ✗ No hay dispositivos conectados`n" -ForegroundColor Red
        exit 1
    }
    Write-Host "  ✓ Dispositivo conectado`n" -ForegroundColor Green
} catch {
    Write-Host "  ✗ ADB no encontrado`n" -ForegroundColor Red
    exit 1
}

# Locate APK
Write-Host "📦 Buscando APK..." -ForegroundColor Cyan
$apkName = if ($Release) { "rentman-release.apk" } else { "rentman-debug.apk" }
$apkPath = Join-Path $PROJECT_ROOT $apkName

if (-not (Test-Path $apkPath)) {
    # Try android build output
    $filter = if ($Release) { "app-release*.apk" } else { "app-debug.apk" }
    $apk = Get-ChildItem -Path (Join-Path $PROJECT_ROOT "android") -Recurse -Filter $filter | Select-Object -First 1
    if ($apk) {
        $apkPath = $apk.FullName
    } else {
        Write-Host "  ✗ APK no encontrado" -ForegroundColor Red
        Write-Host "  💡 Ejecuta: .\build-only.ps1`n" -ForegroundColor Yellow
        exit 1
    }
}

$apkSize = [math]::Round((Get-Item $apkPath).Length / 1MB, 2)
Write-Host "  ✓ APK: $apkName ($apkSize MB)`n" -ForegroundColor Green

# Uninstall if requested
if ($UninstallFirst) {
    Write-Host "🗑️  Desinstalando versión anterior..." -ForegroundColor Yellow
    adb uninstall $APP_ID 2>&1 | Out-Null
    Write-Host "  ✓ Desinstalado`n" -ForegroundColor Green
}

# Install
Write-Host "📥 Instalando..." -ForegroundColor Cyan
$installOutput = adb install -r $apkPath 2>&1
if ($installOutput -match "Success") {
    Write-Host "  ✓ Instalado correctamente`n" -ForegroundColor Green
} else {
    Write-Host "  ⚠️  $installOutput`n" -ForegroundColor Yellow
}

# Launch
Write-Host "🚀 Iniciando app..." -ForegroundColor Cyan
adb shell am start -n "$APP_ID/$APP_ID.MainActivity" 2>&1 | Out-Null
Write-Host "  ✓ App iniciada`n" -ForegroundColor Green

# Show logs if requested
if ($ShowLogs) {
    Write-Host "📊 Logs (Ctrl+C para salir):" -ForegroundColor Cyan
    Write-Host "═══════════════════════════════════════════════════`n"
    adb logcat -c 2>&1 | Out-Null
    Start-Sleep -Seconds 1
    adb logcat -s "Capacitor","$APP_NAME","chromium"
} else {
    Write-Host "💡 Para ver logs: .\install-and-run.ps1 -ShowLogs`n" -ForegroundColor Gray
}

Write-Host "✅ COMPLETADO`n" -ForegroundColor Green
