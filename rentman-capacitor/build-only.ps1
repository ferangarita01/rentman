#!/usr/bin/env pwsh
# 🏗️  Rentman - Build Only Script
# Just builds the APK without installing

param(
    [switch]$Release,
    [switch]$Clean
)

$ErrorActionPreference = "Stop"

$PROJECT_ROOT = $PSScriptRoot
$ANDROID_DIR = Join-Path $PROJECT_ROOT "android"

Write-Host "🏗️  RENTMAN - BUILD APK" -ForegroundColor Green
Write-Host "═══════════════════════════════════════════════════`n"

Push-Location $ANDROID_DIR

$buildType = if ($Release) { "Release" } else { "Debug" }
$gradleTask = if ($Release) { "assembleRelease" } else { "assembleDebug" }

Write-Host "📋 Configuración:" -ForegroundColor Cyan
Write-Host "  Tipo: $buildType" -ForegroundColor Gray
Write-Host "  Clean: $(if($Clean){'Sí'}else{'No'})`n" -ForegroundColor Gray

# Clean if requested
if ($Clean) {
    Write-Host "🧹 Limpiando build anterior..." -ForegroundColor Yellow
    .\gradlew.bat clean --no-daemon 2>&1 | Out-Null
    Write-Host "  ✓ Limpieza completada`n" -ForegroundColor Green
}

# Build
Write-Host "🏗️  Compilando..." -ForegroundColor Cyan
$startTime = Get-Date

try {
    $buildOutput = .\gradlew.bat $gradleTask --no-daemon 2>&1
    
    if ($buildOutput -match "BUILD SUCCESSFUL") {
        $endTime = Get-Date
        $duration = ($endTime - $startTime).TotalSeconds
        
        Write-Host "  ✅ BUILD EXITOSO" -ForegroundColor Green
        Write-Host "  ⏱️  Duración: $([math]::Round($duration, 1))s`n" -ForegroundColor Gray
        
        # Locate APK
        $apkFilter = if ($Release) { "app-release*.apk" } else { "app-debug.apk" }
        $apk = Get-ChildItem -Recurse -Filter $apkFilter | Select-Object -First 1
        
        if ($apk) {
            $size = [math]::Round($apk.Length / 1MB, 2)
            Write-Host "📦 APK Generado:" -ForegroundColor Green
            Write-Host "  📍 $($apk.FullName)" -ForegroundColor Cyan
            Write-Host "  📏 $size MB`n" -ForegroundColor Cyan
            
            # Copy to root
            $destName = if ($Release) { "rentman-release.apk" } else { "rentman-debug.apk" }
            $destPath = Join-Path $PROJECT_ROOT $destName
            Copy-Item $apk.FullName $destPath -Force
            Write-Host "  ✓ Copiado a: $destPath`n" -ForegroundColor Green
        }
    } else {
        Write-Host "  ✗ BUILD FALLÓ" -ForegroundColor Red
        Write-Host $buildOutput
        Pop-Location
        exit 1
    }
} catch {
    Write-Host "  ✗ Error durante build" -ForegroundColor Red
    Write-Host $_.Exception.Message
    Pop-Location
    exit 1
}

Pop-Location

Write-Host "✅ COMPLETADO`n" -ForegroundColor Green
