# 🔧 FIXES CRÍTICOS - Sistema Escrow Rentman

**Fecha:** 2026-02-09  
**Autor:** GitHub Copilot CLI  
**Prioridad:** URGENTE - Bloqueantes de producción

---

## 📋 RESUMEN DE FIXES

Se generaron correcciones para las **4 inconsistencias críticas** que bloquean el funcionamiento del sistema:

| Fix # | Inconsistencia | Archivos | Prioridad |
|-------|----------------|----------|-----------|
| 1 | Trigger SQL sobrescribe valores | `005_fix_escrow_trigger.sql` | 🔴 CRÍTICO |
| 2 | requester_id NULL | `supabase-client.ts`, `server.js` | 🔴 CRÍTICO |
| 3 | Case sensitivity status | `supabase-client.ts` | 🔴 BLOQUEANTE |
| 4 | Stripe field name | `server.js` | 🔴 CRÍTICO |

---

## 🚀 APLICACIÓN DE FIXES

### **Orden de aplicación:**

```
PASO 1: Fix #3 (Case sensitivity) - BLOQUEANTE TOTAL
  └─ Archivo: apps/mobile/src/lib/supabase-client.ts
  
PASO 2: Fix #1 (Trigger SQL)
  └─ Archivo: apps/dashboard/supabase/migrations/005_fix_escrow_trigger.sql
  └─ Ejecutar en Supabase Dashboard
  
PASO 3: Fix #2 (requester_id)
  └─ Archivos: apps/mobile/src/lib/supabase-client.ts
               apps/backend/server.js (opcional)
  
PASO 4: Fix #4 (Stripe field)
  └─ Archivo: apps/backend/server.js
```

---

## ✅ VALIDACIÓN POST-APLICACIÓN

Después de aplicar todos los fixes, ejecutar:

```bash
# 1. Verificar creación de tareas
cd apps/mobile
# Intentar crear una tarea desde la app

# 2. Verificar escrow
# En Supabase Dashboard:
SELECT * FROM escrow_transactions ORDER BY created_at DESC LIMIT 5;
# Verificar que net_amount y platform_fee_amount sean correctos

# 3. Verificar Stripe onboarding
# Intentar conectar cuenta Stripe desde la app
```

---

## 📊 IMPACTO ESPERADO

**Antes de los fixes:**
- ❌ No se pueden crear tareas (CHECK constraint error)
- ❌ No se puede crear escrow (requester_id NULL)
- ❌ Workers pierden $1 por cada $100 (trigger incorrecto)
- ❌ Stripe onboarding siempre falla (campo incorrecto)

**Después de los fixes:**
- ✅ Tareas se crean correctamente
- ✅ Escrow funciona con requester_id correcto
- ✅ Workers reciben el monto exacto prometido
- ✅ Stripe onboarding funciona (resume cuentas existentes)

---

## ⚠️ NOTAS IMPORTANTES

1. **Fix #1 (Trigger)**: La migración SQL es segura, solo modifica la lógica del trigger sin tocar datos existentes.

2. **Fix #2 (requester_id)**: Ofrece 2 opciones:
   - **Opción A (RECOMENDADA)**: Usar `agent_id` como requester (más simple)
   - **Opción B**: Setear `requester_id = agent_id` al crear

3. **Fix #3 (Case)**: Cambio simple pero CRÍTICO para que funcione el sistema.

4. **Fix #4 (Stripe)**: Solo cambia nombre de campo en 2 líneas.

---

## 🔄 ROLLBACK (Si algo falla)

### Fix #1 (Trigger):
```sql
-- Restaurar trigger original (sobrescribe valores)
-- Ver: apps/dashboard/supabase/migrations/004_escrow_system.sql líneas 132-153
```

### Fix #2, #3, #4:
```bash
# Restaurar desde git
git checkout HEAD -- apps/mobile/src/lib/supabase-client.ts
git checkout HEAD -- apps/backend/server.js
```

---

## 📞 SOPORTE

Si encuentras problemas al aplicar los fixes:
1. Verificar logs de Supabase Dashboard
2. Revisar logs del backend en Cloud Run
3. Verificar errores en consola de mobile app

---

**Generado:** 2026-02-09 19:38 UTC  
**Tool:** GitHub Copilot CLI - Critical Fixes Generator
