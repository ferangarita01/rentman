#!/usr/bin/env pwsh
# Contract Page Enhancement - Verification Script
# Verifies all 3 features are correctly implemented

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "CONTRACT PAGE - FEATURE VERIFICATION" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$checks = @()
$contractFile = Get-Content ".\src\app\contract\page.tsx" -Raw

# Feature A: Technical Specs
Write-Host "[1/10] Checking Technical Specs Section..." -ForegroundColor Yellow
if ($contractFile -match "required_skills" -and $contractFile -match "CONSTRAINT") {
    Write-Host "  ✓ Technical specs implemented" -ForegroundColor Green
    $checks += $true
} else {
    Write-Host "  ✗ Technical specs missing!" -ForegroundColor Red
    $checks += $false
}

# Feature B: Issuer Signature
Write-Host "[2/10] Checking Issuer Signature..." -ForegroundColor Yellow
if ($contractFile -match "IssuerData" -and $contractFile -match "trustScore") {
    Write-Host "  ✓ Issuer signature implemented" -ForegroundColor Green
    $checks += $true
} else {
    Write-Host "  ✗ Issuer signature missing!" -ForegroundColor Red
    $checks += $false
}

# Feature B: Trust Score Calculation
Write-Host "[3/10] Checking Trust Score..." -ForegroundColor Yellow
if ($contractFile -match "getAgentProfile" -and $contractFile -match "calculateTrustScore") {
    Write-Host "  ✓ Trust score calculation implemented" -ForegroundColor Green
    $checks += $true
} else {
    Write-Host "  ✗ Trust score missing!" -ForegroundColor Red
    $checks += $false
}

# Feature C: Geolocation
Write-Host "[4/10] Checking Geolocation..." -ForegroundColor Yellow
if ($contractFile -match "LocationData" -and $contractFile -match "geolocation") {
    Write-Host "  ✓ Geolocation implemented" -ForegroundColor Green
    $checks += $true
} else {
    Write-Host "  ✗ Geolocation missing!" -ForegroundColor Red
    $checks += $false
}

# Feature C: Haversine Formula
Write-Host "[5/10] Checking Distance Calculation..." -ForegroundColor Yellow
if ($contractFile -match "calculateHaversineDistance" -and $contractFile -match "Math.sin") {
    Write-Host "  ✓ Haversine distance formula implemented" -ForegroundColor Green
    $checks += $true
} else {
    Write-Host "  ✗ Distance calculation missing!" -ForegroundColor Red
    $checks += $false
}

# Feature C: Navigation
Write-Host "[6/10] Checking Navigation Buttons..." -ForegroundColor Yellow
if ($contractFile -match "openNavigation" -and $contractFile -match "google.*maps" -and $contractFile -match "waze") {
    Write-Host "  ✓ Navigation to Google Maps & Waze implemented" -ForegroundColor Green
    $checks += $true
} else {
    Write-Host "  ✗ Navigation missing!" -ForegroundColor Red
    $checks += $false
}

# Check Task interface updates
Write-Host "[7/10] Checking Task interface..." -ForegroundColor Yellow
$clientFile = Get-Content ".\src\lib\supabase-client.ts" -Raw
if ($clientFile -match "geo_location" -and $clientFile -match "requester_id") {
    Write-Host "  ✓ Task interface updated" -ForegroundColor Green
    $checks += $true
} else {
    Write-Host "  ✗ Task interface not updated!" -ForegroundColor Red
    $checks += $false
}

# Check migration file exists
Write-Host "[8/10] Checking migration file..." -ForegroundColor Yellow
if (Test-Path ".\migrations\003_add_geolocation_to_tasks.sql") {
    Write-Host "  ✓ Geolocation migration created" -ForegroundColor Green
    $checks += $true
} else {
    Write-Host "  ✗ Migration file missing!" -ForegroundColor Red
    $checks += $false
}

# Check imports
Write-Host "[9/10] Checking imports..." -ForegroundColor Yellow
if ($contractFile -match "Navigation.*ExternalLink" -and $contractFile -match "getAgentProfile.*calculateTrustScore") {
    Write-Host "  ✓ All required imports present" -ForegroundColor Green
    $checks += $true
} else {
    Write-Host "  ✗ Missing imports!" -ForegroundColor Red
    $checks += $false
}

# Check build
Write-Host "[10/10] Checking build status..." -ForegroundColor Yellow
if (Test-Path ".\.next") {
    Write-Host "  ✓ Build artifacts exist" -ForegroundColor Green
    $checks += $true
} else {
    Write-Host "  ⚠ No build artifacts (run 'npm run build')" -ForegroundColor Yellow
    $checks += $false
}

# Summary
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "SUMMARY" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

$passedChecks = ($checks | Where-Object { $_ -eq $true }).Count
$totalChecks = $checks.Count
$percentage = [math]::Round(($passedChecks / $totalChecks) * 100)

Write-Host "Passed: $passedChecks / $totalChecks ($percentage%)" -ForegroundColor $(if ($percentage -eq 100) { "Green" } elseif ($percentage -ge 80) { "Yellow" } else { "Red" })
Write-Host ""

if ($percentage -eq 100) {
    Write-Host "🎉 ALL FEATURES IMPLEMENTED!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Cyan
    Write-Host "  1. Apply migration: migrations/003_add_geolocation_to_tasks.sql" -ForegroundColor White
    Write-Host "  2. Test geolocation on device" -ForegroundColor White
    Write-Host "  3. Test navigation buttons" -ForegroundColor White
    Write-Host "  4. Verify trust score displays correctly" -ForegroundColor White
    Write-Host ""
} else {
    Write-Host "⚠️  Some features incomplete!" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Please review the failures above." -ForegroundColor White
    Write-Host ""
}

# Feature breakdown
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "FEATURE BREAKDOWN" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

Write-Host ""
Write-Host "Feature A: Technical Specs" -ForegroundColor Yellow
Write-Host "  - Display required_skills array" -ForegroundColor Gray
Write-Host "  - Numbered constraints (01, 02, ...)" -ForegroundColor Gray
Write-Host "  - Empty state handling" -ForegroundColor Gray

Write-Host ""
Write-Host "Feature B: Issuer Signature & Trust" -ForegroundColor Yellow
Write-Host "  - Fetch issuer profile" -ForegroundColor Gray
Write-Host "  - Calculate trust score (0-100)" -ForegroundColor Gray
Write-Host "  - Display name & verification" -ForegroundColor Gray
Write-Host "  - Progress bar visualization" -ForegroundColor Gray

Write-Host ""
Write-Host "Feature C: Geolocation & Navigation" -ForegroundColor Yellow
Write-Host "  - Request user GPS position" -ForegroundColor Gray
Write-Host "  - Calculate Haversine distance" -ForegroundColor Gray
Write-Host "  - Display distance in KM" -ForegroundColor Gray
Write-Host "  - Navigate to Google Maps" -ForegroundColor Gray
Write-Host "  - Navigate to Waze" -ForegroundColor Gray

Write-Host ""
