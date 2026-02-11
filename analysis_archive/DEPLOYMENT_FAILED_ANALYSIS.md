# 🔍 ANÁLISIS: DEPLOYMENT_FAILED Error

**Fecha:** 2026-02-09  
**Componente:** CreateContractModal.tsx  
**Error:** "DEPLOYMENT_FAILED" al hacer click en "DEPLOY_CONTRACT_v1.0"

---

## ✅ **VERIFICACIÓN INICIAL: FIXES YA APLICADOS**

Los fixes críticos #2 y #3 **YA ESTÁN APLICADOS** en `supabase-client.ts`:

```javascript
// Línea 827-828
requester_id: params.agent_id, // ✅ FIX #2
status: 'OPEN',                 // ✅ FIX #3
```

**Esto significa que el problema NO es de inconsistencias críticas.**

---

## 🔍 **ANÁLISIS DEL FLUJO ACTUAL**

### **CreateContractModal.tsx:**

```javascript
// Línea 106-114
const { data, error } = await createTask({
    title: form.title,
    description: finalDescription,
    budget_amount: budgetAmount,
    task_type: form.task_type,
    location_address: form.pickup_address || undefined,
    required_skills: finalSkills.length > 0 ? finalSkills : undefined,
    agent_id: user.id  // ✅ Pasa user.id
});
```

### **supabase-client.ts (createTask):**

```javascript
// Línea 819-833
.insert({
  title: params.title,
  description: params.description,
  budget_amount: params.budget_amount,
  task_type: params.task_type,
  location_address: params.location_address,
  required_skills: params.required_skills || [],
  agent_id: params.agent_id,        // ✅ user.id
  requester_id: params.agent_id,    // ✅ user.id (FIX #2)
  status: 'OPEN',                   // ✅ Mayúscula (FIX #3)
  priority: 5,
  budget_currency: 'USD',
  payment_type: 'fixed',
  payment_status: 'pending',
  created_at: new Date().toISOString()
})
```

**Código actual está CORRECTO.** ✅

---

## ❓ **POSIBLES CAUSAS DEL ERROR**

### **1. El código aún NO está deployed** ⚠️

Si los fixes se aplicaron en local pero NO se hizo deploy:
- Backend sigue con código antiguo
- Mobile app NO tiene los cambios
- DB sigue rechazando inserts con status='open'

**VERIFICAR:**
```bash
# ¿Se hizo rebuild de la app?
cd apps/mobile
npm run build
npx cap sync

# ¿La app en el dispositivo es la última versión?
```

---

### **2. Otro error NO relacionado con el schema** 🔍

El error `DEPLOYMENT_FAILED` (línea 122) captura **CUALQUIER** error de `createTask()`.

**Posibles causas:**
- ❌ RLS Policy bloqueando insert
- ❌ user.id es undefined/null
- ❌ Network error (Supabase no responde)
- ❌ Otro campo requerido faltante

**SOLUCIÓN:** Agregar logging detallado

```javascript
// Modificar línea 120-123
} catch (error) {
    console.error('DEPLOY_ERROR:', error);
    console.error('Error details:', JSON.stringify(error, null, 2)); // ← AGREGAR
    console.error('User ID:', user?.id); // ← AGREGAR
    console.error('Form data:', form); // ← AGREGAR
    toast.error('DEPLOYMENT_FAILED');
}
```

---

### **3. RLS Policy bloqueando el insert** 🔒

**Verificar en Supabase:**

```sql
-- Ver las policies de tasks
SELECT * FROM pg_policies WHERE tablename = 'tasks';

-- Verificar si hay una policy que permita INSERT
-- La policy actual probablemente es:
CREATE POLICY "allow_all_tasks" ON tasks FOR ALL USING (true);
```

Si la policy es `FOR ALL USING (true)`, **debería funcionar**.

Si la policy es más restrictiva, puede estar bloqueando.

---

### **4. user.id es undefined** 🧑

**En CreateContractModal línea 72-75:**

```javascript
if (!user) {
    toast.error('Session expired. Please log in.');
    return;
}
```

Esto verifica si `user` existe, pero **NO verifica si `user.id` existe**.

**SOLUCIÓN:**
```javascript
if (!user || !user.id) {
    toast.error('Session expired. Please log in.');
    return;
}
```

---

### **5. Error de conexión con Supabase** 🌐

Si Supabase está down o hay problemas de red, el insert falla.

**VERIFICAR:**
- ¿Supabase Dashboard funciona?
- ¿Otros endpoints funcionan?
- ¿Hay error de CORS?

---

## 🎯 **RECOMENDACIONES**

### **PASO 1: Agregar logging detallado** (URGENTE)

Modificar `CreateContractModal.tsx` línea 120-125:

```javascript
} catch (error: any) {
    console.error('════════ DEPLOYMENT ERROR ════════');
    console.error('Error object:', error);
    console.error('Error message:', error?.message);
    console.error('Error code:', error?.code);
    console.error('Error details:', error?.details);
    console.error('Error hint:', error?.hint);
    console.error('User ID:', user?.id);
    console.error('Form data:', {
        title: form.title,
        budget: form.budget_amount,
        task_type: form.task_type
    });
    console.error('════════════════════════════════════');
    
    // Mostrar error más descriptivo
    const errorMsg = error?.message || error?.hint || 'DEPLOYMENT_FAILED';
    toast.error(`Error: ${errorMsg}`);
}
```

### **PASO 2: Verificar en consola del navegador**

1. Abrir DevTools (F12)
2. Ir a Console tab
3. Intentar crear contrato
4. Ver el error completo que se imprime

### **PASO 3: Verificar RLS Policies en Supabase**

```sql
-- En Supabase Dashboard > SQL Editor
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'tasks';
```

### **PASO 4: Test manual de insert**

```sql
-- En Supabase Dashboard > SQL Editor
INSERT INTO tasks (
    title,
    description,
    budget_amount,
    task_type,
    agent_id,
    requester_id,
    status,
    priority,
    budget_currency,
    payment_type,
    payment_status,
    created_at
) VALUES (
    'TEST_TASK',
    'Testing manual insert',
    100.00,
    'general',
    'tu-user-id-aqui', -- ← Cambiar por tu user ID real
    'tu-user-id-aqui',
    'OPEN',
    5,
    'USD',
    'fixed',
    'pending',
    NOW()
);
```

Si esto funciona → El problema es en el código frontend.  
Si esto falla → El problema es en DB/RLS.

---

## 📊 **DIAGNÓSTICO RÁPIDO**

| Síntoma | Causa Probable | Solución |
|---------|----------------|----------|
| Error dice "check constraint" | status='open' minúscula | Rebuild app con Fix #3 |
| Error dice "null value in column requester_id" | requester_id no se setea | Rebuild app con Fix #2 |
| Error dice "permission denied" | RLS policy bloqueando | Verificar policies |
| Error dice "network error" | Supabase down / CORS | Verificar conexión |
| Console.log muestra "user.id: undefined" | Sesión expirada | Re-login |

---

## ✅ **NEXT STEPS**

1. **Aplicar logging mejorado** en CreateContractModal.tsx
2. **Intentar crear contrato** y ver logs en console
3. **Reportar** el error exacto que aparece
4. **Basado en el error**, aplicar la solución correspondiente

---

**El código actual parece correcto. Necesitamos ver el error específico para diagnosticar.**

