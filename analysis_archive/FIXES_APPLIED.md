# ✅ APLICACIÓN DE FIXES - Guía Paso a Paso

**Fecha:** 2026-02-09  
**Fixes aplicados:** 4 críticos

---

## 📝 RESUMEN DE CAMBIOS APLICADOS

### ✅ **FIX #1: Trigger SQL corregido**
**Archivo:** `apps/dashboard/supabase/migrations/005_fix_escrow_trigger.sql`

**Cambio:**
- El trigger ahora solo calcula fees si los campos son NULL
- Permite que el backend tenga control total de los valores
- Workers recibirán el monto correcto ($100 en vez de $99)

**Aplicar:**
```sql
-- Ejecutar en Supabase Dashboard > SQL Editor
-- Copiar y pegar el contenido de:
-- apps/dashboard/supabase/migrations/005_fix_escrow_trigger.sql
```

---

### ✅ **FIX #2: requester_id ahora se setea correctamente**
**Archivo:** `apps/mobile/src/lib/supabase-client.ts` (línea 827)

**Cambio:**
```javascript
// ANTES:
agent_id: params.agent_id,
status: 'open',

// DESPUÉS:
agent_id: params.agent_id,
requester_id: params.agent_id, // FIX #2: Set requester_id
status: 'OPEN', // FIX #3: Uppercase
```

**Impacto:**
- Escrow ahora puede identificar al requester
- No más errores de constraint NOT NULL

---

### ✅ **FIX #3: Case sensitivity corregido**
**Archivo:** `apps/mobile/src/lib/supabase-client.ts` (línea 828)

**Cambio:**
```javascript
// ANTES: status: 'open' ❌
// DESPUÉS: status: 'OPEN' ✅
```

**Impacto:**
- Las tareas ahora se crean sin errores
- CHECK constraint satisfecho

---

### ✅ **FIX #4: Stripe field name corregido**
**Archivo:** `apps/backend/server.js` (líneas 204, 208)

**Cambio:**
```javascript
// ANTES:
.select('stripe_account_id') ❌
accountId = existingProfile?.stripe_account_id ❌

// DESPUÉS:
.select('stripe_connect_account_id') ✅
accountId = existingProfile?.stripe_connect_account_id ✅
```

**Impacto:**
- Stripe onboarding ahora puede reconectar cuentas existentes
- No más cuentas duplicadas

---

## 🚀 PASOS PARA APLICAR EN PRODUCCIÓN

### **PASO 1: Aplicar Fix SQL (Fix #1)**

```bash
# 1. Abrir Supabase Dashboard
# 2. Ir a SQL Editor
# 3. Copiar contenido de:
#    apps/dashboard/supabase/migrations/005_fix_escrow_trigger.sql
# 4. Ejecutar
# 5. Verificar mensaje: "Success. No rows returned"
```

### **PASO 2: Deploy Backend (Fix #4)**

```bash
cd apps/backend
gcloud run deploy rentman-backend --source .
# Esperar confirmación de deploy exitoso
```

### **PASO 3: Rebuild Mobile App (Fix #2 y #3)**

```bash
cd apps/mobile
npm run build
npx cap sync
# Deploy a store o testing
```

---

## ✅ VALIDACIÓN

### **Test 1: Crear una tarea**
```
1. Abrir mobile app
2. Crear nuevo contrato
3. ✅ Debería crearse sin errores
4. ✅ En DB verificar: status = 'OPEN', requester_id != NULL
```

### **Test 2: Escrow**
```sql
-- En Supabase Dashboard:
SELECT 
  id,
  gross_amount / 100.0 as client_pays,
  net_amount / 100.0 as worker_receives,
  platform_fee_amount / 100.0 as platform_fee
FROM escrow_transactions
ORDER BY created_at DESC
LIMIT 5;

-- Para tarea de $100 debería mostrar:
-- client_pays: 110.00
-- worker_receives: 100.00
-- platform_fee: 10.00
```

### **Test 3: Stripe Connect**
```
1. Abrir mobile app
2. Intentar conectar cuenta Stripe
3. Si ya existe cuenta, debería decir "Resuming onboarding"
4. ✅ No debería crear cuenta duplicada
```

---

## 📊 MÉTRICAS ESPERADAS

| Métrica | Antes | Después |
|---------|-------|---------|
| Creación de tareas | ❌ Falla | ✅ Funciona |
| Escrow creation | ❌ Falla | ✅ Funciona |
| Worker payout (tarea $100) | $99 ❌ | $100 ✅ |
| Stripe onboarding | Duplica ❌ | Resume ✅ |

---

## ⚠️ NOTAS IMPORTANTES

1. **Los fixes son SEGUROS**: No afectan datos existentes
2. **Aplicar en orden**: SQL primero, luego backend, luego mobile
3. **Testing recomendado**: Probar en ambiente de test antes de producción
4. **Rollback disponible**: Ver sección en CRITICAL_FIXES.md

---

## 🔄 PRÓXIMOS PASOS (OPCIONAL)

Después de validar estos 4 fixes críticos, considerar arreglar las 3 inconsistencias restantes:

- #5: Migrar tabla messages al directorio correcto
- #6: Actualizar RLS policy para usar agent_id
- #7: Estandarizar case de enums (mejora de código)

---

**Fecha de aplicación:** 2026-02-09  
**Status:** ✅ LISTO PARA APLICAR
