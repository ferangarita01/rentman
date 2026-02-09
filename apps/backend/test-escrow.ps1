# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# ESCROW SYSTEM - QUICK TEST SCRIPT
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Write-Host "🧪 Testing Escrow & Payments System..." -ForegroundColor Cyan
Write-Host ""

$BACKEND_URL = "http://localhost:8080"
# Para production: $BACKEND_URL = "https://rentman-backend-248563654890.us-central1.run.app"

# Test IDs (replace with real ones)
$TASK_ID = "123e4567-e89b-12d3-a456-426614174000"
$REQUESTER_ID = "223e4567-e89b-12d3-a456-426614174000"
$HUMAN_ID = "323e4567-e89b-12d3-a456-426614174000"

Write-Host "📋 Test Configuration:" -ForegroundColor Yellow
Write-Host "Backend URL: $BACKEND_URL"
Write-Host "Task ID: $TASK_ID"
Write-Host "Requester ID: $REQUESTER_ID"
Write-Host "Human ID: $HUMAN_ID"
Write-Host ""

# Test 1: Lock Escrow
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Blue
Write-Host "Test 1: Lock Funds (POST /api/escrow/lock)" -ForegroundColor Yellow
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Blue

$lockBody = @{
    taskId = $TASK_ID
    humanId = $HUMAN_ID
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "$BACKEND_URL/api/escrow/lock" `
        -Method POST `
        -Body $lockBody `
        -ContentType "application/json"
    
    Write-Host "✅ SUCCESS" -ForegroundColor Green
    Write-Host ($response | ConvertTo-Json -Depth 3)
} catch {
    Write-Host "❌ FAILED: $_" -ForegroundColor Red
}

Write-Host ""
Read-Host "Press Enter to continue to next test..."

# Test 2: Upload Proof
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Blue
Write-Host "Test 2: Upload Proof (POST /api/proofs/upload)" -ForegroundColor Yellow
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Blue

$proofBody = @{
    taskId = $TASK_ID
    humanId = $HUMAN_ID
    proofType = "photo"
    title = "Delivery Completed"
    description = "Package delivered to door"
    fileUrl = "https://via.placeholder.com/400x300.png"
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "$BACKEND_URL/api/proofs/upload" `
        -Method POST `
        -Body $proofBody `
        -ContentType "application/json"
    
    Write-Host "✅ SUCCESS" -ForegroundColor Green
    Write-Host ($response | ConvertTo-Json -Depth 3)
    $PROOF_ID = $response.proofId
} catch {
    Write-Host "❌ FAILED: $_" -ForegroundColor Red
}

Write-Host ""
Read-Host "Press Enter to continue to next test..."

# Test 3: Approve Proof
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Blue
Write-Host "Test 3: Approve Proof (POST /api/proofs/review)" -ForegroundColor Yellow
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Blue

$reviewBody = @{
    proofId = $PROOF_ID
    reviewerId = $REQUESTER_ID
    action = "approve"
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "$BACKEND_URL/api/proofs/review" `
        -Method POST `
        -Body $reviewBody `
        -ContentType "application/json"
    
    Write-Host "✅ SUCCESS" -ForegroundColor Green
    Write-Host ($response | ConvertTo-Json -Depth 3)
} catch {
    Write-Host "❌ FAILED: $_" -ForegroundColor Red
}

Write-Host ""
Read-Host "Press Enter to continue to next test..."

# Test 4: Get Escrow Status
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Blue
Write-Host "Test 4: Get Escrow Status (GET /api/escrow/status/:taskId)" -ForegroundColor Yellow
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Blue

try {
    $response = Invoke-RestMethod -Uri "$BACKEND_URL/api/escrow/status/$TASK_ID" `
        -Method GET
    
    Write-Host "✅ SUCCESS" -ForegroundColor Green
    Write-Host ($response | ConvertTo-Json -Depth 3)
} catch {
    Write-Host "❌ FAILED: $_" -ForegroundColor Red
}

Write-Host ""
Read-Host "Press Enter to continue to next test..."

# Test 5: Release Payment
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Blue
Write-Host "Test 5: Release Payment (POST /api/escrow/release)" -ForegroundColor Yellow
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Blue

$releaseBody = @{
    taskId = $TASK_ID
    approverId = $REQUESTER_ID
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "$BACKEND_URL/api/escrow/release" `
        -Method POST `
        -Body $releaseBody `
        -ContentType "application/json"
    
    Write-Host "✅ SUCCESS" -ForegroundColor Green
    Write-Host ($response | ConvertTo-Json -Depth 3)
} catch {
    Write-Host "❌ FAILED: $_" -ForegroundColor Red
}

Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Green
Write-Host "🎉 Testing Complete!" -ForegroundColor Green
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Green
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Cyan
Write-Host "1. Check Supabase tables for data" -ForegroundColor White
Write-Host "2. Verify Stripe dashboard for transactions" -ForegroundColor White
Write-Host "3. Test mobile UI workflow" -ForegroundColor White
Write-Host "4. Setup Cloud Scheduler for auto-approve" -ForegroundColor White
Write-Host ""
