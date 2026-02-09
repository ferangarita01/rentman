# ========================================
# Stripe Connect Implementation Validator
# ========================================

Write-Host "`n🔍 Validating Stripe Connect Implementation...`n" -ForegroundColor Cyan

$errors = 0
$warnings = 0

# 1. Check Android Manifest
Write-Host "1️⃣  Checking AndroidManifest.xml..." -NoNewline
$manifestPath = "apps/mobile/android/app/src/main/AndroidManifest.xml"
if (Test-Path $manifestPath) {
    $manifestContent = Get-Content $manifestPath -Raw
    
    if ($manifestContent -match 'android:scheme="https"' -and $manifestContent -match 'android:host="rentman.space"') {
        Write-Host " ✅" -ForegroundColor Green
        Write-Host "   → HTTPS App Links configured" -ForegroundColor Gray
    } else {
        Write-Host " ❌" -ForegroundColor Red
        Write-Host "   → Missing HTTPS intent filter" -ForegroundColor Red
        $errors++
    }
    
    if ($manifestContent -match 'android:autoVerify="true"') {
        Write-Host "   → autoVerify enabled ✅" -ForegroundColor Gray
    } else {
        Write-Host "   → autoVerify missing ⚠️" -ForegroundColor Yellow
        $warnings++
    }
} else {
    Write-Host " ❌ File not found" -ForegroundColor Red
    $errors++
}

# 2. Check progress/page.tsx for deep link listener
Write-Host "`n2️⃣  Checking progress/page.tsx..." -NoNewline
$progressPath = "apps/mobile/src/app/progress/page.tsx"
if (Test-Path $progressPath) {
    $progressContent = Get-Content $progressPath -Raw
    
    if ($progressContent -match 'App, URLOpenListenerEvent') {
        Write-Host " ✅" -ForegroundColor Green
        Write-Host "   → App import added" -ForegroundColor Gray
    } else {
        Write-Host " ❌" -ForegroundColor Red
        Write-Host "   → Missing App import from @capacitor/app" -ForegroundColor Red
        $errors++
    }
    
    if ($progressContent -match 'appUrlOpen') {
        Write-Host "   → Deep link listener implemented ✅" -ForegroundColor Gray
    } else {
        Write-Host "   → Deep link listener missing ❌" -ForegroundColor Red
        $errors++
    }
    
    if ($progressContent -match 'success.*=.*true') {
        Write-Host "   → Success handler present ✅" -ForegroundColor Gray
    } else {
        Write-Host "   → Success handler missing ⚠️" -ForegroundColor Yellow
        $warnings++
    }
    
    if ($progressContent -match 'listener\.remove\(\)') {
        Write-Host "   → Cleanup on unmount ✅" -ForegroundColor Gray
    } else {
        Write-Host "   → Missing cleanup ⚠️ (memory leak risk)" -ForegroundColor Yellow
        $warnings++
    }
} else {
    Write-Host " ❌ File not found" -ForegroundColor Red
    $errors++
}

# 3. Check Capacitor config
Write-Host "`n3️⃣  Checking capacitor.config.ts..." -NoNewline
$capacitorPath = "apps/mobile/capacitor.config.ts"
if (Test-Path $capacitorPath) {
    $capacitorContent = Get-Content $capacitorPath -Raw
    
    if ($capacitorContent -match 'rentman\.space') {
        Write-Host " ✅" -ForegroundColor Green
        Write-Host "   → rentman.space in allowNavigation" -ForegroundColor Gray
    } else {
        Write-Host " ⚠️" -ForegroundColor Yellow
        Write-Host "   → rentman.space not in allowlist (may cause issues)" -ForegroundColor Yellow
        $warnings++
    }
    
    if ($capacitorContent -match 'connect\.stripe\.com') {
        Write-Host "   → connect.stripe.com allowed ✅" -ForegroundColor Gray
    } else {
        Write-Host "   → Stripe domain not allowed ⚠️" -ForegroundColor Yellow
        $warnings++
    }
} else {
    Write-Host " ❌ File not found" -ForegroundColor Red
    $errors++
}

# 4. Check backend server.js
Write-Host "`n4️⃣  Checking backend/server.js..." -NoNewline
$serverPath = "apps/backend/server.js"
if (Test-Path $serverPath) {
    $serverContent = Get-Content $serverPath -Raw
    
    if ($serverContent -match '/api/stripe/onboard') {
        Write-Host " ✅" -ForegroundColor Green
        Write-Host "   → Onboard endpoint exists" -ForegroundColor Gray
    } else {
        Write-Host " ❌" -ForegroundColor Red
        Write-Host "   → Missing /api/stripe/onboard endpoint" -ForegroundColor Red
        $errors++
    }
    
    if ($serverContent -match 'return_url.*rentman\.space/progress') {
        Write-Host "   → Return URL configured ✅" -ForegroundColor Gray
    } else {
        Write-Host "   → Return URL mismatch ❌" -ForegroundColor Red
        $errors++
    }
    
    if ($serverContent -match 'existingProfile.*stripe_account_id') {
        Write-Host "   → Duplicate account check ✅" -ForegroundColor Gray
    } else {
        Write-Host "   → No duplicate check ⚠️ (will create multiple accounts)" -ForegroundColor Yellow
        $warnings++
    }
    
    if ($serverContent -match '/api/stripe/transfer') {
        Write-Host "   → Transfer endpoint exists ✅" -ForegroundColor Gray
    } else {
        Write-Host "   → Missing transfer endpoint ❌" -ForegroundColor Red
        $errors++
    }
} else {
    Write-Host " ❌ File not found" -ForegroundColor Red
    $errors++
}

# 5. Check Capacitor sync status
Write-Host "`n5️⃣  Checking Capacitor sync..." -NoNewline
$androidAssetsPath = "apps/mobile/android/app/src/main/assets/capacitor.config.json"
if (Test-Path $androidAssetsPath) {
    Write-Host " ✅" -ForegroundColor Green
    Write-Host "   → Android assets synced" -ForegroundColor Gray
    
    $assetsContent = Get-Content $androidAssetsPath -Raw | ConvertFrom-Json
    if ($assetsContent.server.allowNavigation -contains 'rentman.space') {
        Write-Host "   → Config propagated to Android ✅" -ForegroundColor Gray
    } else {
        Write-Host "   → Config NOT synced ⚠️ (run: npx cap sync android)" -ForegroundColor Yellow
        $warnings++
    }
} else {
    Write-Host " ⚠️" -ForegroundColor Yellow
    Write-Host "   → Assets not synced (run: npx cap sync android)" -ForegroundColor Yellow
    $warnings++
}

# 6. Check for common issues
Write-Host "`n6️⃣  Checking for common issues..." -NoNewline
$issues = @()

# Check if Browser.close() is called
if ($progressContent -notmatch 'Browser\.close\(\)') {
    $issues += "Browser not closed after redirect (minor UX issue)"
}

# Check if fetchData() is called after success
if ($progressContent -notmatch 'fetchData\(\)' -and $progressContent -match 'success.*true') {
    $issues += "Profile not refreshed after linking (UI won't update)"
}

if ($issues.Count -eq 0) {
    Write-Host " ✅" -ForegroundColor Green
    Write-Host "   → No common issues detected" -ForegroundColor Gray
} else {
    Write-Host " ⚠️" -ForegroundColor Yellow
    foreach ($issue in $issues) {
        Write-Host "   → $issue" -ForegroundColor Yellow
        $warnings++
    }
}

# Summary
Write-Host "`n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "📊 Validation Summary" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan

if ($errors -eq 0 -and $warnings -eq 0) {
    Write-Host "`n✅ ALL CHECKS PASSED!" -ForegroundColor Green
    Write-Host "   Implementation is complete and ready for testing.`n" -ForegroundColor Gray
} elseif ($errors -eq 0) {
    Write-Host "`n⚠️  $warnings warning(s) detected" -ForegroundColor Yellow
    Write-Host "   Implementation should work but may have minor issues.`n" -ForegroundColor Gray
} else {
    Write-Host "`n❌ $errors error(s), $warnings warning(s)" -ForegroundColor Red
    Write-Host "   Fix errors before testing!`n" -ForegroundColor Gray
}

# Next steps
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "📋 Next Steps" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan

if ($errors -eq 0) {
    Write-Host "`n1. Build Android app:" -ForegroundColor White
    Write-Host "   cd apps/mobile" -ForegroundColor Gray
    Write-Host "   npx cap open android" -ForegroundColor Gray
    Write-Host "   # Build → Generate Signed Bundle/APK`n" -ForegroundColor Gray
    
    Write-Host "2. Test on device:" -ForegroundColor White
    Write-Host "   See: STRIPE_CONNECT_FIX_COMPLETE.md" -ForegroundColor Gray
    Write-Host "   Test Scenario 1: First-time bank linking`n" -ForegroundColor Gray
    
    Write-Host "3. Monitor logs:" -ForegroundColor White
    Write-Host "   adb logcat | findstr `"STRIPE_REDIRECT`"`n" -ForegroundColor Gray
} else {
    Write-Host "`n1. Fix errors listed above" -ForegroundColor White
    Write-Host "2. Re-run this script to validate" -ForegroundColor White
    Write-Host "3. Run: npx cap sync android`n" -ForegroundColor White
}

Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`n" -ForegroundColor Cyan

# Return exit code
if ($errors -gt 0) { exit 1 } else { exit 0 }
