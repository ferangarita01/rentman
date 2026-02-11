#!/usr/bin/env pwsh
# ============================================
# QUICK TEST RUNNER
# One-command testing for common scenarios
# ============================================

param(
    [Parameter(Position=0)]
    [ValidateSet('all', 'unit', 'integration', 'e2e', 'quick', 'backend', 'cli', 'help')]
    [string]$Test = 'help'
)

$ErrorActionPreference = "Continue"

function Show-Help {
    Write-Host @"

🧪 RENTMAN QUICK TEST RUNNER

Usage: .\quick-test.ps1 [command]

Commands:
  all           Run all tests (unit + integration + e2e)
  unit          Run unit tests only (fastest)
  integration   Run integration tests (CLI → Supabase)
  e2e           Run full end-to-end test
  quick         Run quick validation (unit + integration)
  backend       Test backend signature verification
  cli           Test CLI integration with Supabase
  help          Show this help

Examples:
  .\quick-test.ps1 unit              # Fast unit tests
  .\quick-test.ps1 quick             # Quick validation
  .\quick-test.ps1 e2e               # Full system test

For detailed testing:
  - See TESTING_GUIDE.md for manual testing
  - See TESTING_STRATEGY.md for overall strategy
  - Run .\test-flow.ps1 for advanced E2E options

"@ -ForegroundColor Cyan
}

function Run-UnitTests {
    Write-Host "`n🔬 Running Unit Tests..." -ForegroundColor Yellow
    Write-Host "=" * 60
    
    Push-Location "$PSScriptRoot\apps\backend"
    node test-signature.js
    $exitCode = $LASTEXITCODE
    Pop-Location
    
    return $exitCode
}

function Run-IntegrationTests {
    Write-Host "`n🔗 Running Integration Tests..." -ForegroundColor Yellow
    Write-Host "=" * 60
    
    Push-Location "$PSScriptRoot\apps\cli"
    node test-integration.js
    $exitCode = $LASTEXITCODE
    Pop-Location
    
    return $exitCode
}

function Run-E2ETests {
    Write-Host "`n🌐 Running End-to-End Tests..." -ForegroundColor Yellow
    Write-Host "=" * 60
    
    & "$PSScriptRoot\test-flow.ps1" -Quick
    return $LASTEXITCODE
}

# Main execution
switch ($Test) {
    'help' {
        Show-Help
        exit 0
    }
    
    'unit' {
        $result = Run-UnitTests
        exit $result
    }
    
    'integration' {
        $result = Run-IntegrationTests
        exit $result
    }
    
    'e2e' {
        $result = Run-E2ETests
        exit $result
    }
    
    'quick' {
        Write-Host "`n⚡ QUICK VALIDATION" -ForegroundColor Magenta
        
        $unitResult = Run-UnitTests
        if ($unitResult -ne 0) {
            Write-Host "`n❌ Unit tests failed. Stopping." -ForegroundColor Red
            exit $unitResult
        }
        
        $integrationResult = Run-IntegrationTests
        if ($integrationResult -ne 0) {
            Write-Host "`n❌ Integration tests failed." -ForegroundColor Red
            exit $integrationResult
        }
        
        Write-Host "`n✅ QUICK VALIDATION PASSED" -ForegroundColor Green
        exit 0
    }
    
    'backend' {
        Run-UnitTests
        exit $LASTEXITCODE
    }
    
    'cli' {
        Run-IntegrationTests
        exit $LASTEXITCODE
    }
    
    'all' {
        Write-Host "`n🎯 FULL TEST SUITE" -ForegroundColor Magenta
        
        $results = @{
            Unit = Run-UnitTests
            Integration = Run-IntegrationTests
            E2E = Run-E2ETests
        }
        
        Write-Host "`n" + ("=" * 60) -ForegroundColor Cyan
        Write-Host "📊 SUMMARY" -ForegroundColor Cyan
        Write-Host ("=" * 60) -ForegroundColor Cyan
        
        $results.GetEnumerator() | ForEach-Object {
            $status = if ($_.Value -eq 0) { "✅ PASS" } else { "❌ FAIL" }
            $color = if ($_.Value -eq 0) { "Green" } else { "Red" }
            Write-Host "$($_.Key): $status" -ForegroundColor $color
        }
        
        $failCount = ($results.Values | Where-Object { $_ -ne 0 }).Count
        
        if ($failCount -eq 0) {
            Write-Host "`n✅ ALL TESTS PASSED" -ForegroundColor Green
            exit 0
        } else {
            Write-Host "`n❌ $failCount test suite(s) failed" -ForegroundColor Red
            exit 1
        }
    }
    
    default {
        Show-Help
        exit 1
    }
}
