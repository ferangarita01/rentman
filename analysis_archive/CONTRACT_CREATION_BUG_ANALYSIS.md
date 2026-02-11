# 🔍 ANÁLISIS COMPLETO: Error en Creación de Contratos

**Fecha:** 2026-02-10  
**Error:** `insert or update on table "tasks" violates foreign key constraint "tasks_agent_id_fkey"`

---

## 📊 INVESTIGACIÓN DE BASE DE DATOS

### Agentes Existentes:
```
Total: 2 agentes
1. ID: 55ea7c98-132d-450b-8712-4f369d763261
   - Name: "Test Agent 01"
   - Type: "ai_agent"
   - Status: "ONLINE"

2. ID: 0b7151ee-a0f6-4f5d-89d7-6627bb86f5de  
   - Name: "ferangarita01@gmail.com"
   - Type: null
   - Status: "OFFLINE"
```

### Perfiles (Humanos):
```
Total: 1 perfil humano
ID: 5b3b3f7e-5529-4f6f-b132-2a34dc935160
Email: ferangarita01@gmail.com
is_agent: false
```

---

## 🐛 PROBLEMA IDENTIFICADO

### **Root Cause:**
El constraint `tasks_agent_id_fkey` **requiere** que `agent_id` sea una referencia válida a la tabla `agents`.

### **Código Actual (INCORRECTO):**
```typescript
// apps/mobile/src/lib/supabase-client.ts línea 829
agent_id: params.agent_id || null,  // ❌ INSERTA NULL
```

### **Resultado:**
Cuando APK crea un contrato (humano → humano/agente), está insertando:
```sql
INSERT INTO tasks (..., agent_id, ...) VALUES (..., NULL, ...);
```

### **¿Por qué falla?**
- **La FK constraint espera:** un UUID válido que exista en `agents.id`
- **El código envía:** `null`
- **La base rechaza:** porque `null` no es un agente válido

---

## 🎯 LÓGICA DE NEGOCIO (Según tu explicación)

### EN APK (Mobile):
- **Quién crea:** Humanos (usuarios autenticados)
- **Para quién:** Otros humanos, Agentes IA, o Robots
- **Flujo:**
  1. Humano recarga cuenta con Stripe
  2. Humano crea contrato en Market
  3. Contrato queda abierto (`status='open'`)
  4. **`agent_id` debe estar vacío/null** hasta que alguien lo acepte

### EN CLI (Command Line):
- **Quién crea:** Agentes IA (delegados por humanos)
- **Para quién:** Humanos, otros Agentes, Robots
- **Visible en:** APK Global Market bajo el perfil del humano que recargó

---

## ⚠️ INCONSISTENCIA DETECTADA

### **Constraint Definition:**
```sql
CONSTRAINT tasks_agent_id_fkey 
FOREIGN KEY (agent_id) REFERENCES agents(id)
```

### **El problema:**
- El constraint NO permite `NULL`
- Pero el flujo de negocio **requiere** que `agent_id` sea `NULL` hasta que un worker acepte

### **Tasks existentes tienen `agent_id` asignado:**
Todas las 5 últimas tasks tienen `agent_id` asignado desde el inicio:
```
2b5ef5ef → agent_id: 0b7151ee-a0f6-4f5d-89d7-6627bb86f5de
aa080eaa → agent_id: 55ea7c98-132d-450b-8712-4f369d763261
...
```

Esto indica que fueron creadas por CLI, no por APK.

---

## 🔧 SOLUCIONES PROPUESTAS

### **Opción A: Modificar Constraint (RECOMENDADO)**
Permitir `NULL` en `agent_id` para contratos no asignados:

```sql
ALTER TABLE tasks 
DROP CONSTRAINT tasks_agent_id_fkey;

ALTER TABLE tasks 
ADD CONSTRAINT tasks_agent_id_fkey 
FOREIGN KEY (agent_id) REFERENCES agents(id)
ON DELETE SET NULL;

-- Opcional: Añadir check para asegurar lógica
ALTER TABLE tasks 
ADD CONSTRAINT tasks_agent_assignment_check 
CHECK (
  (status = 'open' AND agent_id IS NULL) OR 
  (status != 'open' AND agent_id IS NOT NULL)
);
```

**Ventajas:**
- ✅ Permite contratos abiertos sin agente asignado
- ✅ Mantiene integridad referencial cuando hay asignación
- ✅ Permite `ON DELETE SET NULL` si un agente se borra

**Desventajas:**
- ⚠️ Requiere migración de base de datos

---

### **Opción B: Crear Agente "Sistema" Default**
Crear un agente especial para contratos no asignados:

```sql
-- Crear agente sistema
INSERT INTO agents (id, name, type, status, created_at)
VALUES (
  '00000000-0000-0000-0000-000000000000',
  'SYSTEM_UNASSIGNED',
  'system',
  'ACTIVE',
  NOW()
);

-- Usar como default
ALTER TABLE tasks 
ALTER COLUMN agent_id 
SET DEFAULT '00000000-0000-0000-0000-000000000000';
```

**Código actualizado:**
```typescript
agent_id: params.agent_id || '00000000-0000-0000-0000-000000000000',
```

**Ventajas:**
- ✅ No rompe constraint existente
- ✅ Fácil filtrar contratos no asignados

**Desventajas:**
- ❌ Hack conceptual (agente ficticio)
- ❌ Lógica de negocio menos clara

---

### **Opción C: Usar `requester_id` como Temporal `agent_id`**
Asignar el creador como agente temporal:

```typescript
agent_id: params.agent_id || user.id,  // Usar requester como temp agent
```

**Ventajas:**
- ✅ Cumple constraint
- ✅ No requiere migración

**Desventajas:**
- ❌ Confuso: el requester no es el agent
- ❌ Viola lógica de negocio
- ❌ `user.id` (profile) != `agent.id`

---

## ✅ RECOMENDACIÓN FINAL

### **Implementar Opción A:**
1. Modificar constraint para permitir `NULL`
2. Añadir check constraint para validar estados
3. Actualizar RLS policies si es necesario

### **Flujo Correcto:**
```
1. Humano crea contrato → agent_id = NULL, status = 'open'
2. Worker acepta → agent_id = worker_id, status = 'assigned'
3. Trabajo completo → status = 'completed'
```

---

## 📝 ARCHIVOS A MODIFICAR

1. **SQL Migration:**
   - Ejecutar alteración de constraint en Supabase

2. **Código (Ya está correcto):**
   - `apps/mobile/src/lib/supabase-client.ts` línea 829
   - Ya tiene: `agent_id: params.agent_id || null`

3. **RLS Policies:**
   - Verificar que permitan `agent_id IS NULL`

---

## 🚀 PRÓXIMOS PASOS

1. ✅ Ejecutar SQL migration (Opción A)
2. ✅ Verificar RLS policies
3. ✅ Test en APK: crear contrato
4. ✅ Verificar en DB: `agent_id` debe ser `NULL`
5. ✅ Test aceptación: asignar agente
6. ✅ Deploy a producción

---

**Fin del análisis.**
