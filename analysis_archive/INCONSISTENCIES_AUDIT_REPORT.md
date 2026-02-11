# 🔍 AUDITORÍA COMPLETA DE INCONSISTENCIAS DEL SISTEMA

**Fecha:** 2026-02-09  
**Sistema:** Rentman Escrow & Payments  
**Auditor:** GitHub Copilot CLI  

---

## 📊 RESUMEN EJECUTIVO

**Total de inconsistencias detectadas: 7**

| Severidad | Cantidad | Impacto |
|-----------|----------|---------|
| 🔴 **CRÍTICO/BLOQUEANTE** | 4 | Rompen funcionalidad core |
| 🟡 **ALTO** | 2 | Impactan negativamente |
| 🟢 **MEDIO** | 1 | Solo genera confusión |

**Veredicto:** El sistema tiene bugs críticos que **IMPIDEN su funcionamiento** en producción.

---

## 🚨 INCONSISTENCIAS CRÍTICAS (BLOQUEANTES)

### **#1: Trigger SQL sobrescribe valores del backend** 🔴

**Ubicación:**
- `apps/dashboard/supabase/migrations/004_escrow_system.sql` (líneas 132-153)
- `apps/backend/server.js` (línea 875)

**Problema:**
El trigger `calculate_escrow_fees()` ejecuta **BEFORE INSERT** y recalcula los valores que el backend inserta explícitamente:

```sql
-- El trigger hace:
NEW.platform_fee_amount := ROUND(NEW.gross_amount * 10 / 100);
NEW.net_amount := NEW.gross_amount - NEW.platform_fee_amount;
```

**Flujo real con tarea de $100:**

| Campo | Backend inserta | Trigger recalcula | **Final en DB** |
|-------|----------------|-------------------|-----------------|
| gross_amount | 11,000¢ ($110) | - | 11,000¢ ✓ |
| platform_fee_amount | 1,000¢ ($10) | 1,100¢ | **1,100¢** ❌ |
| net_amount | 10,000¢ ($100) | 9,900¢ | **9,900¢** ❌ |

**Impacto:**
- ❌ **Worker espera $100, recibe $99** (pérdida de $1 por tarea)
- ❌ Plataforma cobra $11 en vez de $10 (ganancia injusta)
- ❌ Discrepancia entre código y datos reales

**Causa raíz:**
- Backend usa modelo: `net_amount = task budget`, `gross = net + fees`
- Trigger usa modelo: `gross = total pagado`, `net = gross - fees`
- **SON INCOMPATIBLES**

---

### **#2: agent_id vs requester_id - Campo no seteado** 🔴

**Ubicación:**
- `apps/mobile/src/lib/supabase-client.ts` (línea 826)
- `apps/backend/server.js` (línea 863, 875)
- `apps/dashboard/supabase/migrations/004_escrow_system.sql` (línea 114)

**Problema:**
La migration 004 agregó `requester_id` a la tabla `tasks`, pero:

```javascript
// createTask() solo setea agent_id:
.insert({
  agent_id: params.agent_id,  // ✓ Se setea
  // requester_id: ???         // ❌ NUNCA se setea
})

// Pero escrow/lock intenta usarlo:
requester_id: task.requester_id,  // ❌ Siempre NULL
```

**Resultado:**
- `task.requester_id` = **NULL** en todas las tareas nuevas
- `escrow.requester_id` = **NULL** (viola constraint NOT NULL en escrow_transactions)
- **Escrow creation FALLA** ❌

**Impacto:**
- Sistema de escrow completamente roto
- No se pueden bloquear fondos
- Violation de foreign key constraint

---

### **#3: Case sensitivity - 'open' vs 'OPEN' en status** 🔴

**Ubicación:**
- `apps/dashboard/supabase/migrations/001_initial_schema.sql`
- `apps/mobile/src/lib/supabase-client.ts` (línea 827)
- `apps/backend/server.js` (línea 844)

**Problema:**

```sql
-- Schema define:
status TEXT CHECK (status IN ('OPEN', 'ASSIGNED', 'COMPLETED'))
-- Usa MAYÚSCULAS ✓
```

```javascript
// Frontend inserta:
status: 'open'  // ❌ MINÚSCULA
```

```javascript
// Backend verifica:
if (task.status !== 'OPEN')  // ✓ MAYÚSCULA
```

**Resultado:**
- Frontend intenta insertar `status='open'`
- **CHECK constraint lo rechaza** ❌
- Error: `new row violates check constraint "tasks_status_check"`
- **Creación de tareas FALLA** 🚫

**Impacto:**
- No se pueden crear nuevas tareas
- Sistema completamente bloqueado en el paso 1

---

### **#5: stripe_account_id vs stripe_connect_account_id** 🔴

**Ubicación:**
- `apps/backend/server.js` (líneas 204, 208 vs 989)
- `apps/dashboard/supabase/migrations/004_escrow_system.sql` (línea 111)

**Problema:**

```sql
-- Migration define:
ALTER TABLE profiles ADD COLUMN stripe_connect_account_id
```

```javascript
// Onboarding usa nombre INCORRECTO:
.select('stripe_account_id')  // ❌ Esta columna NO EXISTE
accountId = existingProfile?.stripe_account_id  // ❌ Siempre NULL
```

```javascript
// Release usa nombre CORRECTO:
.select('stripe_connect_account_id')  // ✓ Correcto
```

**Resultado:**
- `/api/stripe/onboard` **SIEMPRE** retorna `accountId = null`
- Crea cuentas Stripe duplicadas en cada intento
- Workers no pueden reconectar cuentas existentes
- **Stripe Connect onboarding roto** ❌

**Impacto:**
- Cuentas Stripe duplicadas
- Confusion para workers
- Potential Stripe violations

---

## 🟡 INCONSISTENCIAS ALTAS

### **#6: Tabla messages en directorio incorrecto** 🟡

**Ubicación:**
- `apps/mobile/migrations/001_add_messages_table.sql`
- `apps/backend/server.js` (líneas 323, 1066)

**Problema:**
- Migraciones de Supabase están en: `apps/dashboard/supabase/migrations/`
- Pero `messages` está definida en: `apps/mobile/migrations/` ❌

**Resultado:**
- Si la migración de mobile no se ejecutó manualmente en Supabase:
  - Tabla `messages` **NO EXISTE** en DB
  - Inserts en líneas 323, 1066 **FALLAN**
  - Chat system no funciona
  - Transparency messages no se envían

**Impacto:**
- Sistema de chat roto
- No hay mensajes de transparencia en pagos
- Violation de integridad referencial

---

### **#7: RLS Policy usa requester_id que es NULL** 🟡

**Ubicación:**
- `apps/mobile/migrations/001_add_messages_table.sql` (líneas 34, 45)

**Problema:**

```sql
-- RLS Policy:
WHERE agent_id = auth.uid() OR requester_id = auth.uid()
```

Como vimos en #2, `requester_id` **siempre es NULL** ❌

**Resultado:**
- La condición `OR requester_id = auth.uid()` **NUNCA se cumple**
- Mensajes solo visibles si `agent_id = auth.uid()`
- Si el requester no es el agent, **NO VE los mensajes** ❌

**Impacto:**
- Permisos de mensajes rotos
- Security issue: wrong user permissions
- Chat no funciona para requesters

---

## 🟢 INCONSISTENCIAS MEDIAS

### **#4: Inconsistencia status vs payment_status** 🟢

**Ubicación:**
- `apps/dashboard/supabase/migrations/001_initial_schema.sql`
- `apps/dashboard/supabase/migrations/004_escrow_system.sql` (línea 117)

**Problema:**
- `task.status` usa **MAYÚSCULAS**: `'OPEN'`, `'ASSIGNED'`, `'COMPLETED'`
- `task.payment_status` usa **minúsculas**: `'pending'`, `'escrowed'`, `'released'`

**Resultado:**
- Inconsistencia en estilo de código
- Confusión para developers
- **No rompe funcionalidad** ✓

**Impacto:**
- Solo afecta legibilidad
- No causa errores

---

## 📋 TABLA COMPARATIVA: DOCUMENTACIÓN vs CÓDIGO vs REALIDAD

| Concepto | Documentación | Código Backend | Realidad en DB |
|----------|--------------|----------------|----------------|
| Worker recibe (tarea $100) | $90 | $100 | **$99** ❌ |
| Plataforma recibe | $10 | $10 | **$11** ❌ |
| Cliente paga | $100 | $110 | $110 ✓ |
| requester_id seteado | ✓ | ✗ | **NULL** ❌ |
| status values | N/A | MAYÚSCULAS | minúsculas ❌ |
| Stripe field name | N/A | Inconsistente | stripe_connect_account_id ✓ |

---

## 🎯 IMPACTO EN PRODUCCIÓN

### **Funcionalidades COMPLETAMENTE ROTAS:**
1. ❌ Creación de tareas (case sensitivity)
2. ❌ Escrow lock (requester_id NULL)
3. ❌ Stripe Connect onboarding (field name)
4. ❌ Pagos a workers (trigger sobrescribe montos)
5. ❌ Sistema de chat (tabla no existe / RLS roto)

### **Funcionalidades que PARECEN funcionar pero dan resultados INCORRECTOS:**
1. ⚠️ Cálculo de fees (workers pierden dinero)
2. ⚠️ Permisos de mensajes (security issue)

---

## ✅ RECOMENDACIONES PRIORITARIAS

### **URGENTE - Debe arreglarse AHORA:**

1. **Arreglar trigger SQL** (Inconsistencia #1)
   - Modificar para que NO sobrescriba valores explícitos
   - Opción: Solo calcular si los campos son NULL

2. **Arreglar agent_id vs requester_id** (Inconsistencia #2)
   - Opción A: Usar `agent_id` en lugar de `requester_id` (más simple)
   - Opción B: Setear `requester_id = agent_id` al crear tarea

3. **Arreglar case sensitivity** (Inconsistencia #3)
   - Cambiar frontend: `status: 'OPEN'` (mayúscula)

4. **Arreglar Stripe field name** (Inconsistencia #5)
   - Cambiar líneas 204, 208: `stripe_connect_account_id`

### **IMPORTANTE - Arreglar pronto:**

5. **Mover migración de messages** (Inconsistencia #6)
   - Copiar a `apps/dashboard/supabase/migrations/`
   - O ejecutar manualmente en Supabase

6. **Arreglar RLS policy** (Inconsistencia #7)
   - Usar `agent_id` en lugar de `requester_id`

### **OPCIONAL - Mejora de código:**

7. **Estandarizar case de enums** (Inconsistencia #4)
   - Todo MAYÚSCULAS o todo minúsculas

---

## 📈 PRIORIZACIÓN

```
CRÍTICO (fix AHORA):
├─ #3: Case sensitivity (BLOQUEANTE total)
├─ #2: requester_id NULL (BLOQUEANTE escrow)
├─ #1: Trigger sobrescribe (workers pierden dinero)
└─ #5: Stripe field name (onboarding roto)

ALTO (fix esta semana):
├─ #6: Tabla messages (chat no funciona)
└─ #7: RLS policy (security issue)

MEDIO (fix cuando se pueda):
└─ #4: Case inconsistency (solo confusión)
```

---

## 🔧 ARCHIVOS QUE NECESITAN CORRECCIÓN

1. `apps/dashboard/supabase/migrations/004_escrow_system.sql` - Trigger
2. `apps/mobile/src/lib/supabase-client.ts` - status case, requester_id
3. `apps/backend/server.js` - stripe field name
4. `apps/mobile/migrations/001_add_messages_table.sql` - Mover + RLS policy
5. `ESCROW_SUMMARY.md` - Actualizar documentación

---

**Conclusión:** El sistema tiene bugs críticos que **IMPIDEN deployment a producción**. Se requieren correcciones urgentes antes de cualquier launch.

---

**Generado:** 2026-02-09 19:25 UTC  
**Tool:** GitHub Copilot CLI - Deep Code Analysis
