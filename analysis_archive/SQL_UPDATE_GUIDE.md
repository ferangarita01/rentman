# SQL Update Guide - Assign agent_id to Tasks

## 🎯 Objetivo
Asignar tu `user_id` como `agent_id` en las tareas que creaste para que aparezcan en Inbox > Managing

---

## 📋 Paso 1: Obtener tu User ID

### Opción A: Desde la App
1. Abre la app
2. Ve a Chrome DevTools (`chrome://inspect`)
3. En Console, ejecuta:
```javascript
supabase.auth.getUser().then(({data}) => console.log('User ID:', data.user.id))
```

### Opción B: Desde Supabase Dashboard
1. Ve a: https://supabase.com/dashboard
2. Tu proyecto → Authentication → Users
3. Copia tu User ID (formato: `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`)

---

## 📝 Paso 2: Ejecutar SQL en Supabase

1. **Abre Supabase Dashboard**
2. **SQL Editor** (menú izquierdo)
3. **New Query**
4. **Pega este SQL:**

```sql
-- PASO 1: Ver qué tareas se van a actualizar
SELECT 
  id, 
  title, 
  status, 
  agent_id,
  created_at
FROM tasks
WHERE agent_id IS NULL 
  AND status = 'open'
ORDER BY created_at DESC;

-- Si ves tus tareas en el resultado, continúa con PASO 2
```

5. **Ejecuta** (Run o F5)

---

## 🔄 Paso 3: Actualizar las Tareas

**IMPORTANTE:** Reemplaza `TU-USER-ID-AQUI` con tu User ID real

```sql
-- PASO 2: Actualizar tareas con tu agent_id
UPDATE tasks 
SET agent_id = 'TU-USER-ID-AQUI'
WHERE agent_id IS NULL 
  AND status = 'open'
RETURNING id, title, status;

-- Este query devolverá las tareas actualizadas
```

---

## ✅ Paso 4: Verificar

```sql
-- PASO 3: Verificar que funcionó
SELECT 
  COUNT(*) as total_tasks,
  COUNT(CASE WHEN agent_id = 'TU-USER-ID-AQUI' THEN 1 END) as tasks_as_agent,
  COUNT(CASE WHEN assigned_human_id = 'TU-USER-ID-AQUI' THEN 1 END) as tasks_as_worker
FROM tasks;
```

**Resultado esperado:**
```
total_tasks | tasks_as_agent | tasks_as_worker
------------|----------------|----------------
     10     |       7        |       3
```

- `tasks_as_agent` = Tareas en "Managing"
- `tasks_as_worker` = Tareas en "Doing"

---

## 📱 Paso 5: Probar en la App

1. **Abre la app**
2. **Ve a Inbox**
3. **Tab "Managing"** → Deberías ver las tareas que creaste
4. **Tab "Doing"** → Deberías ver las tareas asignadas a ti
5. **Tab "All"** → Distinción visual:
   - 🔵 Borde azul = Managing
   - 🟢 Borde verde = Doing

---

## 🐛 Si algo sale mal

### Problema: No veo mis tareas en "Managing"

**Verificar:**
```sql
-- Ver todas tus tareas
SELECT id, title, status, agent_id, assigned_human_id
FROM tasks
WHERE agent_id = 'TU-USER-ID-AQUI' 
   OR assigned_human_id = 'TU-USER-ID-AQUI';
```

Si no hay resultados → El problema es que no tienes tareas con tu user_id

### Problema: "Permission denied" al ejecutar UPDATE

**Solución:** Usa el Service Role Key en lugar de Anon Key

1. Settings → API
2. Copia `service_role` key (⚠️ NUNCA la compartas)
3. Usa SQL Editor en Supabase Dashboard (ya tiene permisos)

---

## 📊 Queries Útiles

### Ver todas mis tareas agrupadas por rol:
```sql
SELECT 
  CASE 
    WHEN agent_id = 'TU-USER-ID' THEN 'Managing'
    WHEN assigned_human_id = 'TU-USER-ID' THEN 'Doing'
    ELSE 'Other'
  END as role,
  status,
  COUNT(*) as count
FROM tasks
WHERE agent_id = 'TU-USER-ID' 
   OR assigned_human_id = 'TU-USER-ID'
GROUP BY role, status
ORDER BY role, status;
```

### Ver tareas sin agent_id asignado:
```sql
SELECT COUNT(*) 
FROM tasks 
WHERE agent_id IS NULL;
```

---

## ✅ Checklist

- [ ] Obtenido mi User ID
- [ ] Ejecutado PASO 1 (SELECT para ver tareas)
- [ ] Ejecutado PASO 2 (UPDATE con mi user_id)
- [ ] Ejecutado PASO 3 (Verificación)
- [ ] Probado en la app
- [ ] Veo distinción visual en Inbox > All
- [ ] Tab "Managing" muestra mis tareas creadas
- [ ] Tab "Doing" muestra tareas asignadas a mí

---

**Nota:** Este update solo afecta tareas existentes. Las nuevas tareas deben crearse con `agent_id` desde el inicio.
