#!/usr/bin/env pwsh
# SEO Validation Script for Rentman Dashboard
# Validates URLs, meta tags, and SEO configuration

param(
    [string]$Domain = "https://rentman.space",
    [switch]$Local,  # Test against localhost
    [switch]$Verbose
)

if ($Local) {
    $Domain = "http://localhost:3000"
}

Write-Host "`n🔍 RENTMAN SEO VALIDATION`n" -ForegroundColor Cyan
Write-Host "Target: $Domain" -ForegroundColor Gray
Write-Host "=" * 70

$script:Passed = 0
$script:Failed = 0

function Test-URL {
    param(
        [string]$Path,
        [string]$Description
    )
    
    $url = "$Domain$Path"
    Write-Host "`n[TEST] $Description" -ForegroundColor Yellow
    Write-Host "   URL: $url" -ForegroundColor Gray
    
    try {
        $response = Invoke-WebRequest -Uri $url -Method GET -UseBasicParsing -ErrorAction Stop
        
        if ($response.StatusCode -eq 200) {
            Write-Host "   ✅ Status: 200 OK" -ForegroundColor Green
            $script:Passed++
            return $response
        } else {
            Write-Host "   ❌ Status: $($response.StatusCode)" -ForegroundColor Red
            $script:Failed++
            return $null
        }
    } catch {
        Write-Host "   ❌ Failed: $($_.Exception.Message)" -ForegroundColor Red
        $script:Failed++
        return $null
    }
}

function Test-MetaTags {
    param(
        [string]$Path,
        [string[]]$RequiredTags
    )
    
    Write-Host "`n[TEST] Meta Tags for $Path" -ForegroundColor Yellow
    
    try {
        $response = Invoke-WebRequest -Uri "$Domain$Path" -Method GET
        $html = $response.Content
        
        $allFound = $true
        foreach ($tag in $RequiredTags) {
            if ($html -match [regex]::Escape($tag)) {
                Write-Host "   ✅ Found: $tag" -ForegroundColor Green
            } else {
                Write-Host "   ❌ Missing: $tag" -ForegroundColor Red
                $allFound = $false
            }
        }
        
        if ($allFound) {
            $script:Passed++
        } else {
            $script:Failed++
        }
        
        return $allFound
    } catch {
        Write-Host "   ❌ Error: $($_.Exception.Message)" -ForegroundColor Red
        $script:Failed++
        return $false
    }
}

function Test-Headers {
    param(
        [string]$Path,
        [hashtable]$ExpectedHeaders
    )
    
    Write-Host "`n[TEST] HTTP Headers for $Path" -ForegroundColor Yellow
    
    try {
        $response = Invoke-WebRequest -Uri "$Domain$Path" -Method GET -UseBasicParsing
        
        $allFound = $true
        foreach ($header in $ExpectedHeaders.GetEnumerator()) {
            $actualValue = $response.Headers[$header.Key]
            
            if ($actualValue -and $actualValue -match $header.Value) {
                Write-Host "   ✅ $($header.Key): $actualValue" -ForegroundColor Green
            } else {
                Write-Host "   ❌ $($header.Key): Expected '$($header.Value)', got '$actualValue'" -ForegroundColor Red
                $allFound = $false
            }
        }
        
        if ($allFound) {
            $script:Passed++
        } else {
            $script:Failed++
        }
        
        return $allFound
    } catch {
        Write-Host "   ❌ Error: $($_.Exception.Message)" -ForegroundColor Red
        $script:Failed++
        return $false
    }
}

# ============================================
# PHASE 1: URL Accessibility
# ============================================
Write-Host "`n📡 PHASE 1: URL Accessibility Tests" -ForegroundColor Magenta
Write-Host "-" * 70

Test-URL "/" "Homepage"
Test-URL "/rentman" "A/B Test Variant"
Test-URL "/delete-account" "Delete Account Page"
Test-URL "/privacy-policy" "Privacy Policy"
Test-URL "/terms-and-conditions" "Terms and Conditions"
Test-URL "/robots.txt" "Robots.txt"
Test-URL "/sitemap.xml" "Sitemap XML"

# ============================================
# PHASE 2: Meta Tags Validation
# ============================================
Write-Host "`n🏷️  PHASE 2: Meta Tags Validation" -ForegroundColor Magenta
Write-Host "-" * 70

# Test /rentman meta tags
Test-MetaTags "/rentman" @(
    'meta name="description"',
    'meta name="keywords"',
    'meta property="og:title"',
    'meta property="og:description"',
    'meta property="og:image"',
    'meta property="twitter:card"',
    'link rel="canonical"'
)

# Test /delete-account meta tags
Test-MetaTags "/delete-account" @(
    'meta name="robots" content="noindex',
    'meta name="description"',
    'link rel="canonical"'
)

# ============================================
# PHASE 3: HTTP Headers
# ============================================
Write-Host "`n🔒 PHASE 3: Security Headers" -ForegroundColor Magenta
Write-Host "-" * 70

Test-Headers "/" @{
    "X-Content-Type-Options" = "nosniff"
    "X-Frame-Options" = "DENY"
    "X-XSS-Protection" = "1"
}

# ============================================
# PHASE 4: Structured Data
# ============================================
Write-Host "`n📊 PHASE 4: Structured Data (Schema.org)" -ForegroundColor Magenta
Write-Host "-" * 70

Write-Host "`n[TEST] Schema.org JSON-LD on /rentman" -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "$Domain/rentman" -Method GET
    if ($response.Content -match 'application/ld\+json') {
        Write-Host "   ✅ Found Schema.org structured data" -ForegroundColor Green
        
        # Extract and validate JSON-LD
        if ($response.Content -match '<script type="application/ld\+json">(.*?)</script>') {
            $jsonLD = $Matches[1]
            try {
                $schema = $jsonLD | ConvertFrom-Json
                Write-Host "   ✅ Valid JSON-LD syntax" -ForegroundColor Green
                Write-Host "   Type: $($schema.'@type')" -ForegroundColor Gray
                $script:Passed++
            } catch {
                Write-Host "   ❌ Invalid JSON-LD syntax" -ForegroundColor Red
                $script:Failed++
            }
        }
    } else {
        Write-Host "   ❌ No structured data found" -ForegroundColor Red
        $script:Failed++
    }
} catch {
    Write-Host "   ❌ Error: $($_.Exception.Message)" -ForegroundColor Red
    $script:Failed++
}

# ============================================
# PHASE 5: Redirects
# ============================================
Write-Host "`n🔄 PHASE 5: URL Redirects" -ForegroundColor Magenta
Write-Host "-" * 70

Write-Host "`n[TEST] /delete-account.html → /delete-account" -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "$Domain/delete-account.html" -MaximumRedirection 0 -ErrorAction SilentlyContinue
    if ($response.StatusCode -eq 301 -or $response.StatusCode -eq 308) {
        Write-Host "   ✅ Permanent redirect configured" -ForegroundColor Green
        $script:Passed++
    } else {
        Write-Host "   ⚠️  Expected 301/308, got $($response.StatusCode)" -ForegroundColor Yellow
        $script:Failed++
    }
} catch {
    if ($_.Exception.Response.StatusCode -eq 301 -or $_.Exception.Response.StatusCode -eq 308) {
        Write-Host "   ✅ Permanent redirect configured" -ForegroundColor Green
        $script:Passed++
    } else {
        Write-Host "   ❌ No redirect found" -ForegroundColor Red
        $script:Failed++
    }
}

# ============================================
# PHASE 6: Performance Hints
# ============================================
Write-Host "`n⚡ PHASE 6: Performance Optimization" -ForegroundColor Magenta
Write-Host "-" * 70

Write-Host "`n[TEST] Preconnect tags on /rentman" -ForegroundColor Yellow
$response = Invoke-WebRequest -Uri "$Domain/rentman" -Method GET
if ($response.Content -match 'rel="preconnect"') {
    Write-Host "   ✅ Preconnect tags found" -ForegroundColor Green
    $script:Passed++
} else {
    Write-Host "   ⚠️  No preconnect tags (optional)" -ForegroundColor Yellow
}

# ============================================
# FINAL REPORT
# ============================================
Write-Host "`n" + ("=" * 70) -ForegroundColor Cyan
Write-Host "📊 SEO VALIDATION SUMMARY" -ForegroundColor Cyan
Write-Host ("=" * 70) -ForegroundColor Cyan

$total = $script:Passed + $script:Failed
$passRate = if ($total -gt 0) { [math]::Round(($script:Passed / $total) * 100, 1) } else { 0 }

Write-Host "`nTotal Tests: $total"
Write-Host "✅ Passed:   $($script:Passed)" -ForegroundColor Green
Write-Host "❌ Failed:   $($script:Failed)" -ForegroundColor Red
Write-Host "Pass Rate:   $passRate%" -ForegroundColor $(if ($passRate -ge 80) { "Green" } else { "Yellow" })

Write-Host "`n💡 RECOMMENDATIONS:" -ForegroundColor Yellow

if ($script:Failed -gt 0) {
    Write-Host "`n1. Fix failed tests before deploying to production" -ForegroundColor Gray
    Write-Host "2. Validate with external tools:" -ForegroundColor Gray
    Write-Host "   - https://metatags.io (Meta tags)" -ForegroundColor Gray
    Write-Host "   - https://validator.schema.org (Schema.org)" -ForegroundColor Gray
    Write-Host "   - https://search.google.com/test/rich-results (Google)" -ForegroundColor Gray
    Write-Host "3. Test social sharing:" -ForegroundColor Gray
    Write-Host "   - https://developers.facebook.com/tools/debug/" -ForegroundColor Gray
    Write-Host "   - https://cards-dev.twitter.com/validator" -ForegroundColor Gray
} else {
    Write-Host "`n✅ All SEO checks passed!" -ForegroundColor Green
    Write-Host "   Ready for production deployment" -ForegroundColor Gray
}

Write-Host "`n" + ("=" * 70)

exit $(if ($script:Failed -gt 0) { 1 } else { 0 })
