# ========================================
# RENTMAN - APK SIGNING UTILITY
# Signs an unsigned or debug APK with release keystore
# ========================================

param(
    [Parameter(Mandatory=$false)]
    [string]$InputAPK = "",
    
    [Parameter(Mandatory=$false)]
    [string]$OutputAPK = "",
    
    [Parameter(Mandatory=$false)]
    [string]$KeystorePath = "rentman.keystore",
    
    [Parameter(Mandatory=$false)]
    [string]$KeystorePassword = "rentman2026secure",
    
    [Parameter(Mandatory=$false)]
    [string]$KeyAlias = "rentman_release_key"
)

$ErrorActionPreference = "Stop"

Write-Host "╔════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║     RENTMAN APK SIGNING UTILITY        ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════╝" -ForegroundColor Cyan

# ========================================
# 1. VALIDATION
# ========================================
Write-Host "`n[1/4] 🔍 Validating Inputs..." -ForegroundColor Yellow

# Check for build-tools (zipalign, apksigner)
$androidHome = $env:ANDROID_HOME
if (-not $androidHome) {
    Write-Host "❌ ANDROID_HOME not set! Install Android SDK." -ForegroundColor Red
    exit 1
}

# Find latest build-tools version
$buildToolsPath = Join-Path $androidHome "build-tools"
$latestBuildTools = Get-ChildItem $buildToolsPath | Sort-Object Name -Descending | Select-Object -First 1

if (-not $latestBuildTools) {
    Write-Host "❌ Android build-tools not found in $buildToolsPath" -ForegroundColor Red
    exit 1
}

$zipalign = Join-Path $latestBuildTools.FullName "zipalign.exe"
$apksigner = Join-Path $latestBuildTools.FullName "apksigner.bat"

Write-Host "  ✅ Build-tools: $($latestBuildTools.Name)" -ForegroundColor Green

# If no input APK specified, try to find it
if (-not $InputAPK) {
    $possibleAPKs = @(
        "android/app/build/outputs/apk/release/app-release-unsigned.apk",
        "android/app/build/outputs/apk/debug/app-debug.apk",
        "build-output/*.apk"
    )
    
    foreach ($pattern in $possibleAPKs) {
        $found = Get-Item $pattern -ErrorAction SilentlyContinue | Select-Object -First 1
        if ($found) {
            $InputAPK = $found.FullName
            break
        }
    }
    
    if (-not $InputAPK) {
        Write-Host "❌ No APK found! Please specify with -InputAPK parameter." -ForegroundColor Red
        exit 1
    }
}

if (-not (Test-Path $InputAPK)) {
    Write-Host "❌ Input APK not found: $InputAPK" -ForegroundColor Red
    exit 1
}

Write-Host "  ✅ Input APK: $InputAPK" -ForegroundColor Green

# Check keystore
if (-not (Test-Path $KeystorePath)) {
    Write-Host "❌ Keystore not found: $KeystorePath" -ForegroundColor Red
    Write-Host "   Generate one with: keytool -genkeypair -v -keystore $KeystorePath ..." -ForegroundColor Yellow
    exit 1
}

Write-Host "  ✅ Keystore: $KeystorePath" -ForegroundColor Green

# Set output APK name
if (-not $OutputAPK) {
    $timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
    $OutputAPK = "rentman-signed-$timestamp.apk"
}

# ========================================
# 2. ZIPALIGN
# ========================================
Write-Host "`n[2/4] 📐 Aligning APK..." -ForegroundColor Yellow

$alignedAPK = "$InputAPK.aligned.apk"

try {
    & $zipalign -v -p 4 $InputAPK $alignedAPK
    Write-Host "  ✅ APK aligned" -ForegroundColor Green
} catch {
    Write-Host "❌ Zipalign failed: $_" -ForegroundColor Red
    exit 1
}

# ========================================
# 3. SIGN APK
# ========================================
Write-Host "`n[3/4] ✍️  Signing APK..." -ForegroundColor Yellow

try {
    & $apksigner sign `
        --ks $KeystorePath `
        --ks-key-alias $KeyAlias `
        --ks-pass pass:$KeystorePassword `
        --key-pass pass:$KeystorePassword `
        --out $OutputAPK `
        $alignedAPK
    
    Write-Host "  ✅ APK signed successfully" -ForegroundColor Green
} catch {
    Write-Host "❌ Signing failed: $_" -ForegroundColor Red
    Remove-Item $alignedAPK -ErrorAction SilentlyContinue
    exit 1
}

# Cleanup temporary aligned file
Remove-Item $alignedAPK -ErrorAction SilentlyContinue

# ========================================
# 4. VERIFY SIGNATURE
# ========================================
Write-Host "`n[4/4] ✅ Verifying Signature..." -ForegroundColor Yellow

try {
    & $apksigner verify --verbose $OutputAPK
    Write-Host "  ✅ Signature verified" -ForegroundColor Green
} catch {
    Write-Host "❌ Verification failed: $_" -ForegroundColor Red
    exit 1
}

# ========================================
# SUCCESS REPORT
# ========================================
$apkSize = [math]::Round((Get-Item $OutputAPK).Length / 1MB, 2)

Write-Host "`n╔════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║    APK SIGNED SUCCESSFULLY             ║" -ForegroundColor Green
Write-Host "╚════════════════════════════════════════╝" -ForegroundColor Green

Write-Host "`nOutput APK:" -ForegroundColor Cyan
Write-Host "  📱 File: $OutputAPK" -ForegroundColor White
Write-Host "  📊 Size: $apkSize MB" -ForegroundColor White

Write-Host "`nInstallation:" -ForegroundColor Cyan
Write-Host "  adb install -r $OutputAPK" -ForegroundColor White

Write-Host "`n✅ Done!`n" -ForegroundColor Green
