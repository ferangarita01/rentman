# 🔧 CONTRACT CREATION BUG - ROOT CAUSE & FIX

## 📊 PROBLEMA IDENTIFICADO

### Error Actual
```
Error: insert or update on table "tasks"
violates foreign key constraint "tasks_agent_id_fkey"
```

### Root Cause Analysis

**Datos existentes en DB:**
```json
{
  "agent_id": "0b7151ee-a0f6-4f5d-89d7-6627bb86f5de",
  "requester_id": null,
  "assigned_human_id": "5b3b3f7e-5529-4f6f-b132-2a34dc935160"
}
```

**Código actual (supabase-client.ts:829):**
```typescript
agent_id: params.agent_id || null,  // ❌ Envía NULL cuando humano crea
requester_id: user.id,               // ✅ ID del humano
```

**El constraint FK rechaza NULL** cuando:
- La columna `agent_id` tiene FK a `profiles(id)` 
- Pero el constraint NO permite NULL (NOT NULL constraint activo)

---

## 🎯 SOLUCIÓN CORRECTA

### Opción A: Modificar Schema DB (RECOMENDADO)

**Permitir `agent_id = NULL` para contratos abiertos:**

```sql
-- Hacer agent_id nullable
ALTER TABLE tasks 
ALTER COLUMN agent_id DROP NOT NULL;

-- El FK sigue validando cuando hay valor, pero permite NULL
-- Esto es correcto para:
-- - Contratos creados por humanos (agent_id = NULL hasta que alguien acepte)
-- - Contratos creados por agentes (agent_id = agent_creator_id)
```

### Opción B: Modificar Código (TEMPORAL)

**Si no podemos cambiar schema ahora:**

```typescript
// apps/mobile/src/lib/supabase-client.ts
export async function createTask(params: CreateTaskParams) {
  const user = await getCurrentUser();
  if (!user) throw new Error('User not authenticated');

  // Si NO se especifica agent_id, omitir la columna completamente
  const taskData: any = {
    title: params.title,
    description: params.description,
    budget_amount: params.budget_amount,
    task_type: params.task_type,
    location_address: params.location_address,
    required_skills: params.required_skills || [],
    requester_id: user.id,
    status: 'open',
    priority: 5,
    budget_currency: 'USD',
    payment_type: 'fixed',
    payment_status: 'pending',
    created_at: new Date().toISOString()
  };

  // Solo agregar agent_id si existe y es válido
  if (params.agent_id) {
    taskData.agent_id = params.agent_id;
  }

  const { data, error } = await supabase
    .from('tasks')
    .insert(taskData)
    .select()
    .single();

  if (error) {
    console.error('Error creating task:', error);
    return { data: null, error };
  }

  return { data: data as Task, error: null };
}
```

---

## 🔍 VERIFICACIÓN NECESARIA

### 1. Check Constraint Actual
```sql
-- Ver definición exacta del constraint
SELECT 
  pg_get_constraintdef(oid) AS constraint_def
FROM pg_constraint
WHERE conname = 'tasks_agent_id_fkey';

-- Ver si agent_id es NOT NULL
SELECT 
  column_name,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'tasks' 
  AND column_name = 'agent_id';
```

### 2. Lógica de Negocio

**APK (Humanos):**
- Crean contrato → `requester_id = human_user_id`, `agent_id = NULL`
- Contrato va al Market global
- Cuando alguien acepta → `agent_id = acceptor_id` ó `assigned_human_id = acceptor_id`

**CLI (Agentes):**
- Crean contrato → `agent_id = agent_creator_id`, `requester_id = human_sponsor_id`
- Visible en Market bajo perfil del sponsor

---

## ✅ ACCIÓN RECOMENDADA

**1. Ejecutar en Supabase SQL Editor:**
```sql
ALTER TABLE tasks 
ALTER COLUMN agent_id DROP NOT NULL;
```

**2. NO cambiar código** (el código actual está correcto conceptualmente)

**3. Verificar después de fix:**
```sql
-- Test insert sin agent_id
INSERT INTO tasks (
  requester_id, 
  title, 
  description, 
  budget_amount, 
  task_type, 
  status
) VALUES (
  '5b3b3f7e-5529-4f6f-b132-2a34dc935160',
  'TEST_CONTRACT',
  'Testing NULL agent_id',
  100,
  'delivery',
  'open'
);
```

---

## 🚨 RIESGO SI NO CORREGIMOS

- ❌ Humanos NO pueden crear contratos desde APK
- ❌ Market no funciona (todos los contratos deben venir pre-asignados)
- ❌ Lógica de negocio rota

## ✅ BENEFICIO AL CORREGIR

- ✅ Humanos crean contratos abiertos
- ✅ Market muestra ofertas disponibles
- ✅ Agent/Humans pueden aceptar/aplicar
- ✅ Sistema funciona como diseñado
