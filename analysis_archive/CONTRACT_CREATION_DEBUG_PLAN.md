# 🔍 CONTRACT CREATION - DEBUG INVESTIGATION PLAN
**Fecha:** 2026-02-10  
**Error:** `violates foreign key constraint "tasks_agent_id_fkey"`

---

## 📋 RESUMEN DEL PROBLEMA

### Error Actual
```
Error: insert or update on table "tasks"
violates foreign key constraint "tasks_agent_id_fkey"
```

### Contexto del Negocio
- **APK (Mobile):** Solo HUMANOS pueden crear contratos
  - Humanos → Humanos
  - Humanos → Agentes IA
  - Humanos → Robots
  
- **CLI:** Agentes IA pueden crear contratos
  - Agentes → Humanos
  - Agentes → Agentes
  - Agentes → Robots
  - **Nota:** Estos contratos aparecen en el Global Market bajo el perfil del humano que recargó la cuenta con Stripe

### Flujo de Creación (APK)
1. Usuario ingresa a la app
2. Recarga cuenta (Stripe)
3. Abre Market
4. Crea contrato → **ERROR AQUÍ**

---

## 🔎 ANÁLISIS DEL CÓDIGO ACTUAL

### Archivo: `CreateContractModal.tsx`
```typescript
// Línea 29
const { user } = useAuth();

// Línea 361-367: Botón de Deploy
onClick={handleCreate}
```

**Problema identificado:** 
- No se ve la función `handleCreate` en el fragmento analizado
- Necesitamos ver la implementación completa

### Archivo: `supabase-client.ts`
```typescript
// Líneas 816-846: Función createTask
export async function createTask(params: CreateTaskParams) {
  const user = await getCurrentUser();
  if (!user) throw new Error('User not authenticated');

  const { data, error } = await supabase
    .from('tasks')
    .insert({
      title: params.title,
      description: params.description,
      budget_amount: params.budget_amount,
      task_type: params.task_type,
      location_address: params.location_address,
      required_skills: params.required_skills || [],
      agent_id: params.agent_id || null,  // ⚠️ PROBLEMA AQUÍ
      requester_id: user.id,
      status: 'open',
      priority: 5,
      budget_currency: 'USD',
      payment_type: 'fixed',
      payment_status: 'pending',
      created_at: new Date().toISOString()
    })
    .select()
    .single();
}
```

**Problema crítico:**
- `agent_id: params.agent_id || null` → Si `params.agent_id` existe pero NO está en la tabla `agents`, falla la FK
- Si el contrato es para un **humano**, `agent_id` debe ser `null`
- Si el contrato es para un **agente**, `agent_id` debe ser un ID válido de la tabla `agents`

---

## 🗄️ ESQUEMA DE BASE DE DATOS

### Tabla: `tasks`
```sql
CREATE TABLE tasks (
  id UUID PRIMARY KEY,
  requester_id UUID REFERENCES profiles(id),  -- Quien crea el contrato (HUMANO en APK)
  agent_id UUID REFERENCES agents(id),         -- Si es para un agente (NULLABLE)
  assigned_human_id UUID REFERENCES profiles(id), -- Si es para un humano (NULLABLE)
  status TEXT CHECK (status IN ('draft', 'open', 'assigned', ...)),
  ...
);
```

### Restricción FK
```sql
CONSTRAINT tasks_agent_id_fkey 
  FOREIGN KEY (agent_id) REFERENCES agents(id)
```

**Regla:** Si `agent_id` no es `NULL`, DEBE existir en `agents.id`

---

## 🔍 PASOS DE INVESTIGACIÓN

### ✅ PASO 1: Verificar datos en la DB
```sql
-- 1.1: Revisar tabla agents
SELECT id, name, type, status FROM agents;

-- 1.2: Revisar tabla profiles (humanos)
SELECT id, email, full_name, is_agent FROM profiles;

-- 1.3: Revisar tabla humans
SELECT id, verification_status FROM humans;

-- 1.4: Ver último intento de creación fallido
SELECT * FROM tasks 
ORDER BY created_at DESC 
LIMIT 5;
```

### ✅ PASO 2: Rastrear el flujo de datos
```typescript
// 2.1: Verificar qué se envía desde CreateContractModal
console.log('Form data:', form);
console.log('Agent ID being sent:', params.agent_id);

// 2.2: Verificar getCurrentUser()
const user = await getCurrentUser();
console.log('Current user:', user);
```

### ✅ PASO 3: Identificar el origen del agent_id
**Preguntas:**
1. ¿De dónde viene `params.agent_id`?
2. ¿Se está enviando desde el modal?
3. ¿Hay un campo en el formulario para seleccionar agente vs humano?

**Revisar archivos:**
- `CreateContractModal.tsx` (líneas faltantes)
- `CreateTaskParams` interface

### ✅ PASO 4: Verificar lógica de negocio
```typescript
// Lógica esperada:
if (contractType === 'for_human') {
  agent_id = null;
  assigned_human_id = selectedHumanId;
} else if (contractType === 'for_agent') {
  agent_id = selectedAgentId; // DEBE existir en agents.id
  assigned_human_id = null;
}
```

---

## 🐛 POSIBLES CAUSAS DEL ERROR

### 1. **agent_id inválido pasado desde el modal**
- El formulario envía un `agent_id` que no existe en la tabla `agents`
- Solución: Validar que el `agent_id` existe antes de insert

### 2. **Falta selección de destinatario**
- El usuario no selecciona si el contrato es para humano o agente
- Solución: Agregar selector en el modal

### 3. **agent_id = undefined → NULL pero hay un trigger**
- Puede haber un trigger que intenta asignar un `agent_id` automáticamente
- Solución: Revisar triggers en la tabla `tasks`

### 4. **Confusión entre requester_id y agent_id**
- `requester_id` es quien CREA (siempre humano en APK)
- `agent_id` es el agente DESTINATARIO (si aplica)
- Solución: Clarificar roles

---

## 🛠️ ACCIONES INMEDIATAS

### CRÍTICO - Ejecutar en Supabase SQL Editor
```sql
-- Ver estructura de agents
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'agents' AND table_schema = 'public';

-- Ver cuántos agentes hay
SELECT COUNT(*) as total_agents FROM agents;

-- Ver si hay triggers en tasks
SELECT trigger_name, event_manipulation, action_statement
FROM information_schema.triggers
WHERE event_object_table = 'tasks';

-- Ver últimos logs de errores (si existen)
SELECT * FROM pg_stat_activity 
WHERE state = 'idle in transaction failed';
```

### REVISAR CÓDIGO - Archivos faltantes
1. **CreateContractModal.tsx** → Función `handleCreate` completa
2. **CreateTaskParams** interface → ¿Qué campos requiere?
3. **getCurrentUser()** → ¿Devuelve `is_agent`?

---

## 📊 LOGS EN TIEMPO REAL

### Setup de Logging
```typescript
// En CreateContractModal.tsx
const handleCreate = async () => {
  console.log('🚀 [CONTRACT] Iniciando creación...');
  console.log('📝 [CONTRACT] User:', user);
  console.log('📋 [CONTRACT] Form data:', form);
  
  try {
    const params = {
      ...form,
      agent_id: /* ¿QUÉ VA AQUÍ? */
    };
    
    console.log('📤 [CONTRACT] Params enviados:', params);
    
    const result = await createTask(params);
    
    console.log('✅ [CONTRACT] Resultado:', result);
  } catch (error) {
    console.error('❌ [CONTRACT] Error:', error);
  }
};
```

---

## 🎯 SOLUCIÓN ESPERADA

### Opción A: Contrato para HUMANO
```typescript
{
  requester_id: currentUser.id,  // Humano que crea
  agent_id: null,                 // NO es para agente
  assigned_human_id: selectedHumanId, // Humano destinatario
  status: 'open'
}
```

### Opción B: Contrato para AGENTE
```typescript
{
  requester_id: currentUser.id,  // Humano que crea
  agent_id: validAgentId,        // ID válido de agents.id
  assigned_human_id: null,        // NO es para humano
  status: 'open'
}
```

---

## 📝 PRÓXIMOS PASOS

1. **[AHORA]** Ejecutar queries SQL de investigación
2. **[AHORA]** Ver código faltante de `CreateContractModal.tsx`
3. **[AHORA]** Verificar si existe selector de destinatario en el modal
4. **[DESPUÉS]** Implementar logging en tiempo real
5. **[DESPUÉS]** Probar creación con datos válidos

---

## 🚨 NOTAS IMPORTANTES

- **NO modificar código sin antes entender el flujo completo**
- **PRIMERO investigar, DESPUÉS arreglar**
- Los datos de Stripe Sync Engine son read-only, no afectan esta creación
- RLS puede estar bloqueando inserts → verificar policies en `tasks`

---

**Estado:** 🔴 EN INVESTIGACIÓN  
**Siguiente:** Ejecutar queries SQL + ver código faltante
