# Sarah Habit Coach - Android RELEASE Deployment Script
# PowerShell automation for building and deploying RELEASE Android APK

param(
    [Parameter(Mandatory = $false)]
    [ValidateSet('build', 'install', 'run', 'clean', 'logs')]
    [string]$Action = 'run',

    [Parameter(Mandatory = $false)]
    [ValidateSet('patch', 'minor', 'major', 'none')]
    [string]$Bump = 'none'
)

$ErrorActionPreference = "Stop"

# function definitions MUST be before they are called

function Get-Version {
    $pkg = Get-Content "package.json" | ConvertFrom-Json
    return $pkg.version
}

function Update-Version {
    param([string]$Type)

    if ($Type -eq 'none') { return }

    Write-Host "`n🆙 Bumping version ($Type)..." -ForegroundColor Cyan
    
    # 1. Update package.json
    $pkgJson = Get-Content "package.json" -Raw | ConvertFrom-Json
    $verParts = $pkgJson.version -split '\.'
    [int]$major = $verParts[0]
    [int]$minor = $verParts[1]
    [int]$patch = $verParts[2]

    switch ($Type) {
        'patch' { $patch++ }
        'minor' { $minor++; $patch = 0 }
        'major' { $major++; $minor = 0; $patch = 0 }
    }

    $newVersion = "$major.$minor.$patch"
    $pkgJson.version = $newVersion
    $pkgJson | ConvertTo-Json -Depth 10 | Set-Content "package.json"
    Write-Host "   Updated package.json to $newVersion" -ForegroundColor Gray

    # 2. Update Android build.gradle
    $gradlePath = "android\app\build.gradle"
    $gradleContent = Get-Content $gradlePath
    
    $newGradleContent = $gradleContent | ForEach-Object {
        if ($_ -match 'versionName ".*"') {
            return "        versionName ""$newVersion"""
        }
        elseif ($_ -match 'versionCode (\d+)') {
            $currentCode = [int]$matches[1]
            return "        versionCode $($currentCode + 1)"
        }
        else {
            return $_
        }
    }
    
    $newGradleContent | Set-Content $gradlePath
    Write-Host "   Updated build.gradle to $newVersion (Code bumped)" -ForegroundColor Gray
    
    Write-Host "✅ Version bumped to $newVersion" -ForegroundColor Green
}

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
    Write-Host "`n🏗️  Building Next.js app (PRODUCTION)..." -ForegroundColor Yellow
    
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
    Write-Host "`n📦 Building Android RELEASE APK..." -ForegroundColor Yellow
    Write-Host "⚠️  This will use the production keystore" -ForegroundColor Cyan
    
    Push-Location android
    try {
        if (Test-Path ".\gradlew.bat") {
            cmd /c ".\gradlew.bat assembleRelease"
        }
        else {
            cmd /c "./gradlew assembleRelease"
        }
        
        if ($LASTEXITCODE -ne 0) { throw "Android build failed" }
    }
    finally {
        Pop-Location
    }
    
    Write-Host "✅ RELEASE APK built successfully!" -ForegroundColor Green
}

function Install-APK {
    Write-Host "`n📲 Installing RELEASE APK on device..." -ForegroundColor Yellow
    
    $apkPath = "android\app\build\outputs\apk\release\app-release.apk"
    
    if (-not (Test-Path $apkPath)) { throw "APK not found at $apkPath" }
    
    # Show APK info
    $apkInfo = Get-Item $apkPath
    $sizeMB = [math]::Round($apkInfo.Length / 1MB, 2)
    Write-Host "📦 APK Size: $sizeMB MB" -ForegroundColor Cyan
    
    # Try install
    Write-Host "Installing..."
    adb install -r $apkPath
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "⚠️  Update failed (signature mismatch). Uninstalling old version..." -ForegroundColor Yellow
        adb uninstall com.sarah.habitcoach
        Write-Host "Installing fresh..."
        adb install $apkPath
        if ($LASTEXITCODE -ne 0) { throw "Installation failed" }
    }
    
    Write-Host "✅ RELEASE App installed successfully!" -ForegroundColor Green
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
    if (Test-Path ".next") { Remove-Item -Recurse -Force .next -ErrorAction SilentlyContinue }
    Write-Host "✅ Clean complete!" -ForegroundColor Green
}

function Show-Logs {
    Write-Host "`n📋 Showing Sarah Logs (Live)..." -ForegroundColor Yellow
    Write-Host "Press Ctrl+C to stop." -ForegroundColor Gray
    
    # Limpiar logs anteriores
    adb logcat -c
    
    Write-Host "🔍 Capturing... (filtered by Sarah tags)" -ForegroundColor Yellow
    
    try {
        # Tags específicos de nuestra app nativa Android + importantes del sistema
        adb logcat SarahJS:V SarahMainActivity:V AudioStreamer:V WSAudioBridge:V NativeAudioPlugin:V chromium:I *:S | ForEach-Object {
            $line = $_.Line
            
            # Colorear según tipo de log para mejor legibilidad
            if ($line -match "🟢|✅") {
                Write-Host $line -ForegroundColor Green
            }
            elseif ($line -match "🔵") {
                Write-Host $line -ForegroundColor Cyan
            }
            elseif ($line -match "⚠️") {
                Write-Host $line -ForegroundColor Yellow
            }
            elseif ($line -match "❌|🔴|ERROR|FATAL") {
                Write-Host $line -ForegroundColor Red
            }
            elseif ($line -match "🎤") {
                Write-Host $line -ForegroundColor Magenta
            }
            elseif ($line -match "WebSocket|wss://") {
                Write-Host $line -ForegroundColor DarkCyan
            }
            else {
                Write-Host $line
            }
        }
    }
    catch {
        Write-Host "`n⚠️ Log capture stopped" -ForegroundColor Yellow
    }
}

# Main Script Execution
try {
    Write-Host "`n🚀 Sarah RELEASE Deployment: $Action" -ForegroundColor Cyan
    Write-Host "======================================" -ForegroundColor Cyan
    Write-Host "⚠️  PRODUCTION BUILD - Using release keystore" -ForegroundColor Yellow
    
    # Version Bump Logic
    if ($Bump -ne 'none' -and ($Action -eq 'build' -or $Action -eq 'install' -or $Action -eq 'run')) {
        Update-Version -Type $Bump
    }
    else {
        Write-Host "ℹ️  Version: $(Get-Version) (No bump)" -ForegroundColor Gray
    }

    Write-Host ""

    switch ($Action) {
        'clean' { Remove-BuildArtifacts }
        'build' {
            if (-not (Test-ADB)) { exit 1 }
            Build-NextJS
            Sync-Capacitor
            Build-APK
            
            Write-Host "`n✅ Build complete!" -ForegroundColor Green
            Write-Host "📦 APK Location: android\app\build\outputs\apk\release\app-release.apk" -ForegroundColor Cyan
        }
        'install' {
            if (-not (Test-ADB)) { exit 1 }
            if (-not (Test-Device)) { exit 1 }
            Build-NextJS
            Sync-Capacitor
            Build-APK
            Install-APK
            
            Write-Host "`n✅ Installation complete!" -ForegroundColor Green
        }
        'run' {
            if (-not (Test-ADB)) { exit 1 }
            if (-not (Test-Device)) { exit 1 }
            Build-NextJS
            Sync-Capacitor
            Build-APK
            Install-APK
            Start-App
            
            Write-Host "`n✅ Deployment complete!" -ForegroundColor Green
            
            # Auto-log prompt
            Write-Host "`n❓ Do you want to view the logs now? (y/n)" -ForegroundColor Yellow -NoNewline
            $choice = Read-Host " "
            if ($choice -eq 'y' -or $choice -eq 'Y') {
                Show-Logs
            }
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

