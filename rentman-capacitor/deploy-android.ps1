# Sarah Habit Coach - Android Deployment Script
# PowerShell automation for building and deploying Android APK

param(
    [Parameter(Mandatory = $false)]
    [ValidateSet('build', 'install', 'run', 'clean', 'logs')]
    [string]$Action = 'run'
)

$ErrorActionPreference = "Stop"

# function definitions MUST be before they are called

function Test-ADB {
    if (Get-Command "adb" -ErrorAction SilentlyContinue) {
        return $true
    }
    Write-Host "❌ ADB not found. Please install Android SDK Platform Tools." -ForegroundColor Red
    return $false
}

function Test-Device {
    Write-Host "📱 Checking for connected devices..." -ForegroundColor Yellow
    
    # Use cmd /c to ensure consistent execution
    $output = cmd /c "adb devices"
    
    # Select-String might return MatchInfo objects, we want the pattern match
    $deviceConnected = $output | Select-String -Pattern "\s+device$"
    
    if (-not $deviceConnected) {
        Write-Host "❌ No devices connected." -ForegroundColor Red
        Write-Host "Raw ADB Output:" -ForegroundColor Gray
        $output | ForEach-Object { Write-Host "  $_" -ForegroundColor Gray }
        return $false
    }
    
    Write-Host "✅ Device connected!" -ForegroundColor Green
    return $true
}

function Build-NextJS {
    Write-Host "`n🏗️  Building Next.js app..." -ForegroundColor Yellow
    
    cmd /c "npm run build"
    if ($LASTEXITCODE -ne 0) { throw "Next.js build failed" }
    
    Write-Host "✅ Next.js build complete" -ForegroundColor Green
}

function Sync-Capacitor {
    Write-Host "`n🔄 Syncing Capacitor..." -ForegroundColor Yellow
    
    cmd /c "npx cap sync"
    if ($LASTEXITCODE -ne 0) { throw "Capacitor sync failed" }
    
    Write-Host "✅ Capacitor sync complete" -ForegroundColor Green
}

function Build-APK {
    Write-Host "`n📦 Building Android APK..." -ForegroundColor Yellow
    
    Push-Location android
    try {
        if (Test-Path ".\gradlew.bat") {
            cmd /c ".\gradlew.bat assembleDebug"
        }
        else {
            cmd /c "./gradlew assembleDebug"
        }
        
        if ($LASTEXITCODE -ne 0) { throw "Android build failed" }
    }
    finally {
        Pop-Location
    }
    
    Write-Host "✅ APK built successfully!" -ForegroundColor Green
}

function Install-APK {
    Write-Host "`n📲 Installing APK on device..." -ForegroundColor Yellow
    
    $apkPath = "android\app\build\outputs\apk\debug\app-debug.apk"
    
    if (-not (Test-Path $apkPath)) { throw "APK not found at $apkPath" }
    
    # Try install
    Write-Host "Installing..."
    adb install -r $apkPath
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "⚠️  Update failed. Re-installing..." -ForegroundColor Yellow
        adb uninstall com.sarah.habitcoach
        adb install $apkPath
        if ($LASTEXITCODE -ne 0) { throw "Installation failed" }
    }
    
    Write-Host "✅ App installed successfully!" -ForegroundColor Green
}

function Start-App {
    Write-Host "`n🚀 Launching app..." -ForegroundColor Yellow
    adb shell am start -n com.sarah.habitcoach/.MainActivity
    Write-Host "✅ App launched!" -ForegroundColor Green
}

function Remove-BuildArtifacts {
    Write-Host "`n🧹 Cleaning build cache..." -ForegroundColor Yellow
    
    Push-Location android
    try {
        if (Test-Path ".\gradlew.bat") { cmd /c ".\gradlew.bat clean" }
    }
    finally {
        Pop-Location
    }
    
    if (Test-Path "out") { Remove-Item -Recurse -Force out -ErrorAction SilentlyContinue }
    Write-Host "✅ Clean complete!" -ForegroundColor Green
}

function Show-Logs {
    Write-Host "`n📋 Showing Android logs..." -ForegroundColor Yellow
    Write-Host "Press Ctrl+C to stop." -ForegroundColor Gray
    # Using native Android tags from our app
    adb logcat SarahJS:V SarahMainActivity:V AudioStreamer:V WSAudioBridge:V NativeAudioPlugin:V chromium:I *:S
}

# Main Script Execution
try {
    Write-Host "`n🤖 Sarah Deployment: $Action" -ForegroundColor Cyan
    Write-Host "==============================" -ForegroundColor Cyan

    switch ($Action) {
        'clean' { Remove-BuildArtifacts }
        'build' {
            if (-not (Test-ADB)) { exit 1 }
            Build-NextJS
            Sync-Capacitor
            Build-APK
        }
        'install' {
            if (-not (Test-ADB)) { exit 1 }
            if (-not (Test-Device)) { exit 1 }
            Build-NextJS
            Sync-Capacitor
            Build-APK
            Install-APK
        }
        'run' {
            if (-not (Test-ADB)) { exit 1 }
            if (-not (Test-Device)) { exit 1 }
            Build-NextJS
            Sync-Capacitor
            Build-APK
            Install-APK
            Start-App
        }
        'logs' {
            if (-not (Test-ADB)) { exit 1 }
            if (-not (Test-Device)) { exit 1 }
            Show-Logs
        }
    }
}
catch {
    Write-Host "`n❌ Error: $_" -ForegroundColor Red
    exit 1
}
