# Commission System Test
# Tests the 10% platform fee on escrow transactions

Write-Host "=== COMMISSION SYSTEM TEST ===" -ForegroundColor Cyan

# Test calculations
function Test-Commission {
    param($Amount)
    
    $Gross = $Amount
    $Fee = [Math]::Round($Gross * 0.10, 2)
    $Net = $Gross - $Fee
    
    Write-Host "`nAmount: `$$Amount" -ForegroundColor White
    Write-Host "  Gross (100%): `$$Gross" -ForegroundColor Yellow
    Write-Host "  Platform Fee (10%): `$$Fee" -ForegroundColor Red
    Write-Host "  Worker Payout (90%): `$$Net" -ForegroundColor Green
}

Write-Host "`n=== Test Cases ===" -ForegroundColor Yellow
Test-Commission 100
Test-Commission 50
Test-Commission 75.50
Test-Commission 200

Write-Host "`n=== Expected Backend Behavior ===" -ForegroundColor Cyan
Write-Host "1. /api/escrow/lock - Creates escrow with:" -ForegroundColor White
Write-Host "   - gross_amount (100%)" -ForegroundColor Gray
Write-Host "   - platform_fee_amount (10%)" -ForegroundColor Gray
Write-Host "   - net_amount (90%)" -ForegroundColor Gray

Write-Host "`n2. /api/escrow/release - Transfers to worker:" -ForegroundColor White
Write-Host "   - worker_payout = net_amount - platform_fee" -ForegroundColor Gray
Write-Host "   - Platform keeps the 10% automatically" -ForegroundColor Gray

Write-Host "`n3. /api/stripe/transfer - Direct transfer:" -ForegroundColor White
Write-Host "   - Deducts 10% if deductFee=true (default)" -ForegroundColor Gray
Write-Host "   - Transfers 90% to worker" -ForegroundColor Gray

Write-Host "`n✓ Ready for testing!" -ForegroundColor Green
