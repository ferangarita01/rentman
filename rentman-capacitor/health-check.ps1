# Quick Health Check - Sarah Habit Coach
# Verifies deployment readiness

Write-Host ""
Write-Host "🔍 Sarah Habit Coach - Deployment Health Check" -ForegroundColor Cyan
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host ""

$allGood = $true

# Check Node.js
Write-Host "📦 Checking Node.js..." -NoNewline
try {
    $nodeVersion = node --version
    Write-Host " ✅ $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host " ❌ Not found" -ForegroundColor Red
    $allGood = $false
}

# Check npm
Write-Host "📦 Checking npm..." -NoNewline
try {
    $npmVersion = npm --version
    Write-Host " ✅ v$npmVersion" -ForegroundColor Green
} catch {
    Write-Host " ❌ Not found" -ForegroundColor Red
    $allGood = $false
}

# Check Java
Write-Host "☕ Checking Java..." -NoNewline
try {
    $javaVersion = java -version 2>&1 | Select-String "version"
    Write-Host " ✅ $javaVersion" -ForegroundColor Green
} catch {
    Write-Host " ❌ Not found" -ForegroundColor Red
    Write-Host "   Install: https://adoptium.net/" -ForegroundColor Yellow
    $allGood = $false
}

# Check ADB
Write-Host "🤖 Checking ADB (Android Debug Bridge)..." -NoNewline
try {
    $adbVersion = adb version 2>&1 | Select-String "Version"
    Write-Host " ✅ $adbVersion" -ForegroundColor Green
} catch {
    Write-Host " ❌ Not found" -ForegroundColor Red
    Write-Host "   Install Android Studio or platform-tools" -ForegroundColor Yellow
    $allGood = $false
}

# Check for connected devices
Write-Host ""
Write-Host "📱 Checking for connected Android devices..." -ForegroundColor Yellow
try {
    $devices = adb devices | Select-String "device$"
    if ($devices.Count -eq 0) {
        Write-Host "   ⚠️  No devices connected" -ForegroundColor Yellow
        Write-Host "   Connect via USB and enable USB Debugging" -ForegroundColor Gray
    } else {
        Write-Host "   ✅ $($devices.Count) device(s) connected" -ForegroundColor Green
        $devices | ForEach-Object { Write-Host "      - $_" -ForegroundColor Gray }
    }
} catch {
    Write-Host "   ❌ Cannot check devices (ADB not available)" -ForegroundColor Red
}

# Check project structure
Write-Host ""
Write-Host "📂 Checking project structure..." -ForegroundColor Yellow

$requiredFiles = @(
    "package.json",
    "next.config.ts",
    "capacitor.config.ts",
    "android\app\build.gradle"
)

foreach ($file in $requiredFiles) {
    $exists = Test-Path $file
    if ($exists) {
        Write-Host "   ✅ $file" -ForegroundColor Green
    } else {
        Write-Host "   ❌ $file missing" -ForegroundColor Red
        $allGood = $false
    }
}

# Check dependencies
Write-Host ""
Write-Host "📚 Checking node_modules..." -NoNewline
if (Test-Path "node_modules") {
    Write-Host " ✅ Installed" -ForegroundColor Green
} else {
    Write-Host " ❌ Not found" -ForegroundColor Red
    Write-Host "   Run: npm install" -ForegroundColor Yellow
    $allGood = $false
}

# Check Capacitor Android platform
Write-Host "📚 Checking Capacitor Android..." -NoNewline
if (Test-Path "android") {
    Write-Host " ✅ Installed" -ForegroundColor Green
} else {
    Write-Host " ❌ Not found" -ForegroundColor Red
    Write-Host "   Run: npx cap add android" -ForegroundColor Yellow
    $allGood = $false
}

# Summary
Write-Host ""
Write-Host "=============================================" -ForegroundColor Cyan
if ($allGood) {
    Write-Host "✅ All checks passed! Ready to deploy." -ForegroundColor Green
    Write-Host ""
    Write-Host "Quick Commands:" -ForegroundColor Cyan
    Write-Host "  npm run dev                 → Test in browser" -ForegroundColor Gray
    Write-Host "  .\deploy-android.ps1 -Action run → Deploy to device" -ForegroundColor Gray
} else {
    Write-Host "⚠️  Some checks failed. Fix issues above." -ForegroundColor Yellow
}
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host ""
