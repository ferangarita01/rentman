# ============================================
# RENTMAN E2E TESTING SUITE
# ============================================
# Tests complete flow: CLI → Supabase → Backend → AI → Mobile/Dashboard

param(
    [switch]$Quick,      # Skip AI tests
    [switch]$Verbose,    # Show detailed logs
    [switch]$CleanDB     # Clear test data after run
)

$ErrorActionPreference = "Stop"
Write-Host "`n🧪 RENTMAN END-TO-END TEST SUITE" -ForegroundColor Cyan
Write-Host "=" * 60

# ============================================
# CONFIGURATION
# ============================================
$SUPABASE_URL = "https://uoekolfgbbmvhzsfkjef.supabase.co"
$SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVvZWtvbGZnYmJtdmh6c2ZramVmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAzMjQzNzUsImV4cCI6MjA4NTkwMDM3NX0.DYxAxi4TTBLgdVruu8uGM3Jog7JZaplWqikAvI0EXvk"
$BACKEND_URL = "https://rentman-backend-346436028870.us-east1.run.app"
$TEST_AGENT_ID = "test-agent-$(Get-Random -Maximum 9999)"
$TEST_TASK_TITLE = "E2E Test Task $(Get-Date -Format 'HH:mm:ss')"

# ============================================
# TEST RESULTS TRACKER
# ============================================
$script:TestResults = @{
    Passed = @()
    Failed = @()
    Skipped = @()
}

function Test-Step {
    param(
        [string]$Name,
        [scriptblock]$Action,
        [switch]$Optional
    )
    
    Write-Host "`n[$($script:TestResults.Passed.Count + $script:TestResults.Failed.Count + 1)] Testing: $Name" -ForegroundColor Yellow
    try {
        & $Action
        Write-Host "   ✅ PASSED" -ForegroundColor Green
        $script:TestResults.Passed += $Name
        return $true
    } catch {
        if ($Optional) {
            Write-Host "   ⚠️  SKIPPED: $($_.Exception.Message)" -ForegroundColor DarkYellow
            $script:TestResults.Skipped += $Name
            return $false
        } else {
            Write-Host "   ❌ FAILED: $($_.Exception.Message)" -ForegroundColor Red
            $script:TestResults.Failed += $Name
            if ($Verbose) {
                Write-Host $_.ScriptStackTrace -ForegroundColor DarkRed
            }
            return $false
        }
    }
}

# ============================================
# PHASE 1: INFRASTRUCTURE TESTS
# ============================================
Write-Host "`n📡 PHASE 1: Infrastructure Checks" -ForegroundColor Magenta
Write-Host "-" * 60

Test-Step "Supabase is reachable" {
    $response = Invoke-WebRequest -Uri "$SUPABASE_URL/rest/v1/" -Method GET -Headers @{
        "apikey" = $SUPABASE_ANON_KEY
    }
    if ($response.StatusCode -ne 200) { throw "Supabase not responding" }
}

Test-Step "Backend is running" {
    $response = Invoke-WebRequest -Uri "$BACKEND_URL/" -Method GET
    if ($response.Content -notmatch "Rentman Backend is Active") {
        throw "Backend health check failed"
    }
}

Test-Step "CLI is installed" {
    $cliPath = Get-Command rentman -ErrorAction SilentlyContinue
    if (-not $cliPath) { throw "CLI not found. Run 'npm link' in apps/cli" }
}

Test-Step "Node.js dependencies (CLI)" {
    Push-Location "$PSScriptRoot\apps\cli"
    if (-not (Test-Path "node_modules")) {
        throw "CLI dependencies not installed. Run 'npm install'"
    }
    Pop-Location
}

Test-Step "Node.js dependencies (Backend)" -Optional {
    Push-Location "$PSScriptRoot\apps\backend"
    if (-not (Test-Path "node_modules")) {
        throw "Backend dependencies not installed"
    }
    Pop-Location
}

# ============================================
# PHASE 2: DATABASE SCHEMA TESTS
# ============================================
Write-Host "`n🗄️  PHASE 2: Database Schema Validation" -ForegroundColor Magenta
Write-Host "-" * 60

Test-Step "Table 'tasks' exists" {
    $headers = @{
        "apikey" = $SUPABASE_ANON_KEY
        "Content-Type" = "application/json"
    }
    $response = Invoke-RestMethod -Uri "$SUPABASE_URL/rest/v1/tasks?limit=1" -Headers $headers
    if ($null -eq $response) { throw "Tasks table not accessible" }
}

Test-Step "Table 'agents' exists" {
    $headers = @{
        "apikey" = $SUPABASE_ANON_KEY
        "Content-Type" = "application/json"
    }
    $response = Invoke-RestMethod -Uri "$SUPABASE_URL/rest/v1/agents?limit=1" -Headers $headers
    if ($null -eq $response) { throw "Agents table not accessible" }
}

Test-Step "Table 'profiles' exists" {
    $headers = @{
        "apikey" = $SUPABASE_ANON_KEY
        "Content-Type" = "application/json"
    }
    $response = Invoke-RestMethod -Uri "$SUPABASE_URL/rest/v1/profiles?limit=1" -Headers $headers
    if ($null -eq $response) { throw "Profiles table not accessible" }
}

# ============================================
# PHASE 3: CLI FUNCTIONALITY TESTS
# ============================================
Write-Host "`n🖥️  PHASE 3: CLI Functionality" -ForegroundColor Magenta
Write-Host "-" * 60

$global:GeneratedIdentityFile = $null

Test-Step "Generate test agent identity" {
    Push-Location "$PSScriptRoot\apps\cli"
    node gen_identity.js | Out-Null
    if (-not (Test-Path "rentman_identity.json")) {
        throw "Identity generation failed"
    }
    $global:GeneratedIdentityFile = Get-Content "rentman_identity.json" -Raw | ConvertFrom-Json
    if (-not $global:GeneratedIdentityFile.public_key) {
        throw "Invalid identity file format"
    }
    Pop-Location
}

Test-Step "Register test agent in database" {
    $headers = @{
        "apikey" = $SUPABASE_ANON_KEY
        "Content-Type" = "application/json"
        "Prefer" = "return=representation"
    }
    $body = @{
        id = $global:GeneratedIdentityFile.agent_id
        public_key = $global:GeneratedIdentityFile.public_key
        email = "test-$(Get-Random)@rentman.test"
    } | ConvertTo-Json
    
    $response = Invoke-RestMethod -Uri "$SUPABASE_URL/rest/v1/agents" `
        -Method POST -Headers $headers -Body $body
    
    if (-not $response.id) { throw "Agent registration failed" }
}

Test-Step "CLI can create signed task" {
    Push-Location "$PSScriptRoot\apps\cli"
    
    # Create test mission file
    @{
        title = $TEST_TASK_TITLE
        description = "Automated E2E test task"
        task_type = "verification"
        budget_amount = 10
        location = @{
            address = "Test Location"
            lat = 40.7128
            lng = -74.0060
        }
    } | ConvertTo-Json | Set-Content "test_e2e.json"
    
    # Post mission
    $output = node bin/rentman.js task create test_e2e.json 2>&1
    if ($LASTEXITCODE -ne 0) {
        throw "Task creation failed: $output"
    }
    
    Remove-Item "test_e2e.json" -ErrorAction SilentlyContinue
    Pop-Location
}

# ============================================
# PHASE 4: WEBHOOK & BACKEND VALIDATION
# ============================================
Write-Host "`n🔗 PHASE 4: Webhook & Backend Processing" -ForegroundColor Magenta
Write-Host "-" * 60

$global:CreatedTask = $null

Test-Step "Task appears in database" {
    Start-Sleep -Seconds 2  # Wait for DB sync
    
    $headers = @{
        "apikey" = $SUPABASE_ANON_KEY
        "Content-Type" = "application/json"
    }
    $response = Invoke-RestMethod -Uri "$SUPABASE_URL/rest/v1/tasks?title=eq.$TEST_TASK_TITLE&order=created_at.desc&limit=1" `
        -Headers $headers
    
    if ($response.Count -eq 0) { throw "Task not found in database" }
    $global:CreatedTask = $response[0]
    
    if (-not $global:CreatedTask.signature) {
        throw "Task missing cryptographic signature"
    }
}

Test-Step "Backend processed task (status changed)" {
    # Wait for webhook trigger + backend processing
    Start-Sleep -Seconds 5
    
    $headers = @{
        "apikey" = $SUPABASE_ANON_KEY
    }
    $response = Invoke-RestMethod -Uri "$SUPABASE_URL/rest/v1/tasks?id=eq.$($global:CreatedTask.id)" `
        -Headers $headers
    
    $task = $response[0]
    if ($task.status -eq "open") {
        Write-Host "   ⚠️  Warning: Task still in 'open' status - webhook may not have fired" -ForegroundColor Yellow
        Write-Host "   Check: Backend logs, webhook configuration, pg_net extension" -ForegroundColor DarkYellow
        throw "Webhook/Backend did not process task"
    }
    
    Write-Host "   Current status: $($task.status)" -ForegroundColor Cyan
}

if (-not $Quick) {
    Test-Step "AI analysis completed" {
        Start-Sleep -Seconds 10  # AI processing can take longer
        
        $headers = @{
            "apikey" = $SUPABASE_ANON_KEY
        }
        $response = Invoke-RestMethod -Uri "$SUPABASE_URL/rest/v1/tasks?id=eq.$($global:CreatedTask.id)" `
            -Headers $headers
        
        $task = $response[0]
        $metadata = $task.metadata | ConvertFrom-Json -ErrorAction SilentlyContinue
        
        if (-not $metadata.ai_analysis) {
            throw "AI analysis not found in metadata"
        }
        
        Write-Host "   AI Result: viable=$($metadata.ai_analysis.viable), safety=$($metadata.ai_analysis.safety_score)" -ForegroundColor Cyan
    }
}

# ============================================
# PHASE 5: MOBILE/DASHBOARD READ TEST
# ============================================
Write-Host "`n📱 PHASE 5: Mobile/Dashboard Data Access" -ForegroundColor Magenta
Write-Host "-" * 60

Test-Step "Task visible to mobile/dashboard clients" {
    $headers = @{
        "apikey" = $SUPABASE_ANON_KEY
        "Content-Type" = "application/json"
    }
    
    # Simulate mobile app query (matching status)
    $response = Invoke-RestMethod -Uri "$SUPABASE_URL/rest/v1/tasks?status=in.(matching,open)&order=created_at.desc&limit=10" `
        -Headers $headers
    
    $found = $response | Where-Object { $_.id -eq $global:CreatedTask.id }
    if (-not $found) {
        throw "Task not visible in matching/open feed"
    }
}

Test-Step "Check database with Node.js script" -Optional {
    Push-Location "$PSScriptRoot\apps\mobile"
    $output = node check-db.mjs 2>&1
    if ($output -match "Error") {
        throw "Database check script failed"
    }
    Pop-Location
}

# ============================================
# PHASE 6: CLEANUP
# ============================================
if ($CleanDB -and $global:CreatedTask) {
    Write-Host "`n🧹 Cleaning up test data..." -ForegroundColor Magenta
    
    Test-Step "Delete test task" -Optional {
        $headers = @{
            "apikey" = $SUPABASE_ANON_KEY
        }
        Invoke-RestMethod -Uri "$SUPABASE_URL/rest/v1/tasks?id=eq.$($global:CreatedTask.id)" `
            -Method DELETE -Headers $headers | Out-Null
    }
    
    Test-Step "Delete test agent" -Optional {
        $headers = @{
            "apikey" = $SUPABASE_ANON_KEY
        }
        Invoke-RestMethod -Uri "$SUPABASE_URL/rest/v1/agents?id=eq.$($global:GeneratedIdentityFile.agent_id)" `
            -Method DELETE -Headers $headers | Out-Null
    }
}

# ============================================
# FINAL REPORT
# ============================================
Write-Host "`n" + ("=" * 60) -ForegroundColor Cyan
Write-Host "📊 TEST SUMMARY" -ForegroundColor Cyan
Write-Host ("=" * 60) -ForegroundColor Cyan

$totalTests = $script:TestResults.Passed.Count + $script:TestResults.Failed.Count + $script:TestResults.Skipped.Count
$passRate = if ($totalTests -gt 0) { [math]::Round(($script:TestResults.Passed.Count / $totalTests) * 100, 1) } else { 0 }

Write-Host "`nTotal Tests: $totalTests"
Write-Host "✅ Passed:  $($script:TestResults.Passed.Count)" -ForegroundColor Green
Write-Host "❌ Failed:  $($script:TestResults.Failed.Count)" -ForegroundColor Red
Write-Host "⚠️  Skipped: $($script:TestResults.Skipped.Count)" -ForegroundColor Yellow
Write-Host "Pass Rate: $passRate%" -ForegroundColor $(if ($passRate -ge 80) { "Green" } else { "Yellow" })

if ($script:TestResults.Failed.Count -gt 0) {
    Write-Host "`n❌ FAILED TESTS:" -ForegroundColor Red
    $script:TestResults.Failed | ForEach-Object { Write-Host "   - $_" -ForegroundColor Red }
}

if ($script:TestResults.Skipped.Count -gt 0) {
    Write-Host "`n⚠️  SKIPPED TESTS:" -ForegroundColor Yellow
    $script:TestResults.Skipped | ForEach-Object { Write-Host "   - $_" -ForegroundColor Yellow }
}

Write-Host "`n" + ("=" * 60)

# Exit with appropriate code
if ($script:TestResults.Failed.Count -gt 0) {
    exit 1
} else {
    exit 0
}
