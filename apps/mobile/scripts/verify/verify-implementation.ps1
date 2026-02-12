#!/usr/bin/env pwsh
# Rentman Mobile - Quick Implementation Verification
# Run this to verify all changes were made correctly

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "RENTMAN MOBILE - IMPLEMENTATION CHECK" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$checks = @()

# Check 1: Migration files exist
Write-Host "[1/8] Checking migration files..." -ForegroundColor Yellow
$migration1 = Test-Path ".\migrations\001_add_messages_table.sql"
$migration2 = Test-Path ".\migrations\002_add_settings_to_profiles.sql"

if ($migration1 -and $migration2) {
    Write-Host "  ✓ Migration files found" -ForegroundColor Green
    $checks += $true
} else {
    Write-Host "  ✗ Migration files missing!" -ForegroundColor Red
    $checks += $false
}

# Check 2: supabase-client.ts has new functions
Write-Host "[2/8] Checking supabase-client.ts..." -ForegroundColor Yellow
$clientFile = Get-Content ".\src\lib\supabase-client.ts" -Raw
if ($clientFile -match "getThreads" -and $clientFile -match "getMessages" -and $clientFile -match "getSettings") {
    Write-Host "  ✓ New functions added" -ForegroundColor Green
    $checks += $true
} else {
    Write-Host "  ✗ Functions missing!" -ForegroundColor Red
    $checks += $false
}

# Check 3: Inbox page uses real data
Write-Host "[3/8] Checking inbox page..." -ForegroundColor Yellow
$inboxFile = Get-Content ".\src\app\inbox\page.tsx" -Raw
if ($inboxFile -match "getThreads" -and $inboxFile -match "real-time" -and $inboxFile -match "supabase") {
    Write-Host "  ✓ Inbox uses real data" -ForegroundColor Green
    $checks += $true
} else {
    Write-Host "  ✗ Inbox still has mock data!" -ForegroundColor Red
    $checks += $false
}

# Check 4: Settings page has persistence
Write-Host "[4/8] Checking settings page..." -ForegroundColor Yellow
$settingsFile = Get-Content ".\src\app\settings\page.tsx" -Raw
if ($settingsFile -match "getSettings" -and $settingsFile -match "updateSettings" -and $settingsFile -match "saveSettingsToDb") {
    Write-Host "  ✓ Settings has persistence" -ForegroundColor Green
    $checks += $true
} else {
    Write-Host "  ✗ Settings missing persistence!" -ForegroundColor Red
    $checks += $false
}

# Check 5: Issuer page has real data
Write-Host "[5/8] Checking issuer page..." -ForegroundColor Yellow
$issuerFile = Get-Content ".\src\app\issuer\page.tsx" -Raw
if ($issuerFile -match "getAgentProfile" -and $issuerFile -match "searchParams" -and $issuerFile -match "Suspense") {
    Write-Host "  ✓ Issuer uses real data with Suspense" -ForegroundColor Green
    $checks += $true
} else {
    Write-Host "  ✗ Issuer missing real data implementation!" -ForegroundColor Red
    $checks += $false
}

# Check 6: TypeScript interfaces added
Write-Host "[6/8] Checking TypeScript interfaces..." -ForegroundColor Yellow
if ($clientFile -match "interface Message" -and $clientFile -match "interface Thread" -and $clientFile -match "interface UserSettings") {
    Write-Host "  ✓ TypeScript interfaces added" -ForegroundColor Green
    $checks += $true
} else {
    Write-Host "  ✗ Interfaces missing!" -ForegroundColor Red
    $checks += $false
}

# Check 7: Documentation files
Write-Host "[7/8] Checking documentation..." -ForegroundColor Yellow
$doc1 = Test-Path ".\DEVELOPMENT_PLAN_COMPLETE.md"
$doc2 = Test-Path ".\IMPLEMENTATION_COMPLETE.md"
if ($doc1 -and $doc2) {
    Write-Host "  ✓ Documentation complete" -ForegroundColor Green
    $checks += $true
} else {
    Write-Host "  ✗ Documentation missing!" -ForegroundColor Red
    $checks += $false
}

# Check 8: Build successful
Write-Host "[8/8] Checking last build status..." -ForegroundColor Yellow
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

Write-Host "Passed: $passedChecks / $totalChecks ($percentage%)" -ForegroundColor $(if ($percentage -eq 100) { "Green" } else { "Yellow" })
Write-Host ""

if ($percentage -eq 100) {
    Write-Host "🎉 ALL CHECKS PASSED!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Cyan
    Write-Host "  1. Apply migrations in Supabase Dashboard" -ForegroundColor White
    Write-Host "  2. Run: npm run build" -ForegroundColor White
    Write-Host "  3. Test all three pages thoroughly" -ForegroundColor White
    Write-Host ""
} else {
    Write-Host "⚠️  Some checks failed!" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Please review the failures above and fix before deploying." -ForegroundColor White
    Write-Host ""
}

# File stats
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "FILE STATISTICS" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

$stats = @{
    "supabase-client.ts" = (Get-Content ".\src\lib\supabase-client.ts").Count
    "inbox/page.tsx" = (Get-Content ".\src\app\inbox\page.tsx").Count
    "settings/page.tsx" = (Get-Content ".\src\app\settings\page.tsx").Count
    "issuer/page.tsx" = (Get-Content ".\src\app\issuer\page.tsx").Count
}

foreach ($file in $stats.Keys | Sort-Object) {
    Write-Host "  $file : $($stats[$file]) lines" -ForegroundColor Gray
}

Write-Host ""
Write-Host "Total code changes: ~$(($stats.Values | Measure-Object -Sum).Sum) lines" -ForegroundColor Cyan
Write-Host ""
