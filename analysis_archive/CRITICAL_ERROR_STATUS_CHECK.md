# 🚨 ERROR IDENTIFICADO: tasks_status_check Constraint Violation

**Fecha:** 2026-02-09 22:48 UTC  
**Error:** `new row for relation "tasks" violates check constraint "tasks_status_check"`  
**Severidad:** 🔴 **BLOCKER** - Impide crear contratos

---

## 🔍 CAUSA RAÍZ

### **PROBLEMA:**

El código está insertando el status con **MAYÚSCULAS**:

```typescript
status: 'OPEN'  // ❌ INCORRECTO
```

Pero la base de datos espera **minúsculas**:

```sql
CHECK (status = ANY (ARRAY[
  'draft',
  'open',           -- ✅ minúsculas
  'assigned',
  'in_progress',
  'pending_verification',
  'completed',
  'cancelled',
  'disputed'
]))
```

---

## 📄 EVIDENCIA

### **1. CHECK CONSTRAINT en Base de Datos:**

```sql
-- Query ejecutada:
SELECT pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conname = 'tasks_status_check';

-- Resultado:
CHECK (status = ANY (ARRAY[
  'draft'::text,
  'open'::text,                      -- ✅ minúsculas
  'assigned'::text,
  'in_progress'::text,
  'pending_verification'::text,
  'completed'::text,
  'cancelled'::text,
  'disputed'::text
]))
```

**Todos los valores están en MINÚSCULAS** ✅

---

### **2. CÓDIGO ACTUAL (supabase-client.ts:828):**

```typescript
export async function createTask(params: CreateTaskParams) {
  const { data, error } = await supabase
    .from('tasks')
    .insert({
      title: params.title,
      description: params.description,
      budget_amount: params.budget_amount,
      task_type: params.task_type,
      location_address: params.location_address,
      required_skills: params.required_skills || [],
      agent_id: params.agent_id,
      requester_id: params.agent_id,
      status: 'OPEN',  // ❌ LÍNEA 828 - ERROR AQUÍ
      priority: 5,
      budget_currency: 'USD',
      payment_type: 'fixed',
      // ...
    });
}
```

**Comentario engañoso:**
```typescript
// FIX #3: Use UPPERCASE to match CHECK constraint (OPEN, ASSIGNED, COMPLETED, etc.)
```

Este comentario está **EQUIVOCADO** ❌

---

### **3. FLUJO DEL ERROR:**

```
Usuario crea contrato
    ↓
CreateContractModal.tsx llama createTask()
    ↓
supabase-client.ts:828 → status: 'OPEN'
    ↓
Supabase intenta INSERT
    ↓
PostgreSQL valida CHECK constraint
    ↓
'OPEN' NO está en ['draft', 'open', 'assigned', ...]
    ↓
❌ ERROR: tasks_status_check violation
```

---

## ✅ SOLUCIÓN

### **CAMBIO REQUERIDO:**

**Archivo:** `apps/mobile/src/lib/supabase-client.ts`  
**Línea:** 828

**Antes (INCORRECTO):**
```typescript
status: 'OPEN',  // ❌ MAYÚSCULAS
```

**Después (CORRECTO):**
```typescript
status: 'open',  // ✅ minúsculas
```

---

### **TAMBIÉN CORREGIR EL COMENTARIO:**

**Antes:**
```typescript
// FIX #3: Use UPPERCASE to match CHECK constraint (OPEN, ASSIGNED, COMPLETED, etc.)
```

**Después:**
```typescript
// FIX #3: Use lowercase to match CHECK constraint ('open', 'assigned', 'completed', etc.)
```

---

## 📊 VALORES VÁLIDOS DE STATUS

Todos deben estar en **minúsculas**:

| Status | Descripción | Uso |
|--------|-------------|-----|
| `draft` | Borrador | Tarea en creación |
| `open` | Abierto | ✅ Estado inicial al crear contrato |
| `assigned` | Asignado | Worker asignado |
| `in_progress` | En progreso | Worker trabajando |
| `pending_verification` | Verificación pendiente | Esperando pruebas |
| `completed` | Completado | Tarea finalizada |
| `cancelled` | Cancelado | Tarea cancelada |
| `disputed` | En disputa | Hay un conflicto |

**❌ Valores NO válidos:**
- `OPEN` (MAYÚSCULAS)
- `Open` (PascalCase)
- `OpEn` (MixedCase)
- Cualquier variación que no sea minúsculas

---

## 🎯 IMPACTO

### **ACTUAL:**

- 🔴 **Usuarios NO pueden crear contratos**
- 🔴 **Error crítico en producción**
- 🔴 **Funcionalidad principal bloqueada**

### **DESPUÉS DEL FIX:**

- ✅ Usuarios pueden crear contratos
- ✅ Status se inserta correctamente
- ✅ Sistema funcionando

---

## 🔧 PASOS PARA APLICAR EL FIX

### **1. Editar el archivo:**

```bash
# Abrir en editor
code apps/mobile/src/lib/supabase-client.ts
```

### **2. Ir a línea 828:**

```typescript
// Buscar:
status: 'OPEN',

// Cambiar a:
status: 'open',
```

### **3. Corregir comentario (línea 828):**

```typescript
// Buscar:
// FIX #3: Use UPPERCASE to match CHECK constraint

// Cambiar a:
// FIX #3: Use lowercase to match CHECK constraint
```

### **4. Guardar y rebuild:**

```bash
cd apps/mobile
npm run build
npx cap sync
```

### **5. Verificar:**

```bash
# Probar crear contrato en la app
# Debe funcionar sin errores
```

---

## 🧪 VERIFICACIÓN

### **Query de prueba:**

```sql
-- Verificar que 'open' funciona:
INSERT INTO tasks (
  title,
  status,
  requester_id,
  budget_amount,
  budget_currency,
  task_type
) VALUES (
  'Test Task',
  'open',  -- ✅ minúsculas
  'user-id-aqui',
  100,
  'USD',
  'general'
);

-- Debe funcionar ✅
```

```sql
-- Verificar que 'OPEN' falla:
INSERT INTO tasks (
  title,
  status,
  requester_id,
  budget_amount,
  budget_currency,
  task_type
) VALUES (
  'Test Task',
  'OPEN',  -- ❌ MAYÚSCULAS
  'user-id-aqui',
  100,
  'USD',
  'general'
);

-- Debe fallar con: tasks_status_check violation ❌
```

---

## 📝 NOTAS ADICIONALES

### **¿Por qué este error?**

Alguien agregó un "FIX #3" comentado como:
> "Use UPPERCASE to match CHECK constraint"

Pero **investigó mal** o asumió que el constraint usaba mayúsculas.

**Lección:** Siempre verificar la definición real del constraint antes de "arreglar".

---

### **¿Hay otros status en MAYÚSCULAS?**

Buscar en el código:

```bash
# Buscar otros posibles errores
grep -r "status: '[A-Z]" apps/mobile/src/
```

Si encuentra algo como:
- `status: 'ASSIGNED'`
- `status: 'COMPLETED'`
- `status: 'CANCELLED'`

También hay que corregirlos a minúsculas.

---

## ✅ CHECKLIST DE FIX

- [ ] Cambiar `'OPEN'` → `'open'` en línea 828
- [ ] Corregir comentario engañoso
- [ ] Buscar otros status en MAYÚSCULAS
- [ ] Rebuild y sync de la app
- [ ] Probar crear contrato
- [ ] Verificar que funciona

---

**Generado:** 2026-02-09 22:48 UTC  
**Por:** GitHub Copilot CLI - Error Analysis System  
**Status:** 🔴 **FIX REQUERIDO URGENTE**
