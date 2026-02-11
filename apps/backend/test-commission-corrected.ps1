# Test Commission System - CORRECTED LOGIC
# Client pays the commission, worker receives full task budget

Write-Host "=== COMMISSION SYSTEM - CORRECTED LOGIC ===" -ForegroundColor Cyan

# Test calculations
function Test-Commission-Correct {
    param($TaskBudget)
    
    $WorkerReceives = $TaskBudget
    $PlatformFee = [Math]::Round($TaskBudget * 0.10, 2)
    $ClientPays = $TaskBudget + $PlatformFee
    
    Write-Host "`n┌─────────────────────────────────────┐" -ForegroundColor White
    Write-Host "│ Presupuesto de Tarea: `$$TaskBudget" -ForegroundColor White
    Write-Host "├─────────────────────────────────────┤" -ForegroundColor White
    Write-Host "│ Worker recibe: `$$WorkerReceives" -ForegroundColor Green
    Write-Host "│ Comisión (10%): `$$PlatformFee" -ForegroundColor Yellow
    Write-Host "│ Cliente paga: `$$ClientPays" -ForegroundColor Cyan
    Write-Host "└─────────────────────────────────────┘" -ForegroundColor White
}

Write-Host "`n=== Casos de Prueba ===" -ForegroundColor Yellow
Test-Commission-Correct 100
Test-Commission-Correct 50
Test-Commission-Correct 75.50
Test-Commission-Correct 200

Write-Host "`n=== Flujo Completo Ejemplo ===" -ForegroundColor Cyan

Write-Host "`n📝 PASO 1: Cliente crea tarea" -ForegroundColor Yellow
Write-Host "   Task budget_amount = `$100" -ForegroundColor Gray

Write-Host "`n💳 PASO 2: Escrow Lock (Cliente paga)" -ForegroundColor Yellow
Write-Host "   Cliente es cobrado: `$110 (100 + 10%)" -ForegroundColor Cyan
Write-Host "   Stripe PaymentIntent amount: 11000 cents" -ForegroundColor Gray
Write-Host "   Escrow guardado:" -ForegroundColor Gray
Write-Host "     - gross_amount: 11000 cents (`$110)" -ForegroundColor Gray
Write-Host "     - platform_fee_amount: 1000 cents (`$10)" -ForegroundColor Gray
Write-Host "     - net_amount: 10000 cents (`$100)" -ForegroundColor Gray

Write-Host "`n✅ PASO 3: Tarea completada → Escrow Release" -ForegroundColor Yellow
Write-Host "   Stripe captura: `$110 del cliente" -ForegroundColor Cyan
Write-Host "   Stripe transfiere: `$100 al worker" -ForegroundColor Green
Write-Host "   Plataforma retiene: `$10" -ForegroundColor Yellow

Write-Host "`n💬 PASO 4: Mensaje de transparencia" -ForegroundColor Yellow
Write-Host @"
   
   ┌─────────────────────────────────────────┐
   │ 💰 PAGO COMPLETADO                      │
   ├─────────────────────────────────────────┤
   │ ✅ Worker recibe: `$100.00              │
   │ 📊 Desglose:                            │
   │    • Presupuesto de Tarea: `$100.00     │
   │    • Comisión Plataforma (10%): `$10.00 │
   │    • Total Pagado por Cliente: `$110.00 │
   │                                         │
   │ El worker recibe el monto completo.    │
   │ La plataforma cobra 10% al cliente.    │
   └─────────────────────────────────────────┘

"@ -ForegroundColor White

Write-Host "=== ✅ LÓGICA CORRECTA ===" -ForegroundColor Green
Write-Host "  ✅ Cliente paga: Presupuesto + 10%" -ForegroundColor Green
Write-Host "  ✅ Worker recibe: Presupuesto completo (100%)" -ForegroundColor Green
Write-Host "  ✅ Plataforma retiene: 10% del presupuesto" -ForegroundColor Green
Write-Host "  ✅ Transparencia total en el chat" -ForegroundColor Green
