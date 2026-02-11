# 🔧 FIX: RLS INSERT Policy Missing for Tasks Table

## 🔴 **PROBLEMA IDENTIFICADO**

**Error:** `new row violates row-level security policy for table "tasks"`

**Causa raíz:** NO existe una política RLS de INSERT en la tabla `tasks`.

Los usuarios autenticados **NO pueden crear tareas** porque:
- ✅ Existen políticas SELECT (lectura)
- ✅ Existen políticas UPDATE (actualización)  
- ❌ **NO existe política INSERT** (creación)

---

## ✅ **SOLUCIÓN**

### **Paso 1: Ir a Supabase Dashboard**
1. Abre https://uoekolfgbbmvhzsfkjef.supabase.co
2. Ve a **SQL Editor**
3. Crea una nueva query

### **Paso 2: Ejecutar este SQL**

```sql
-- Add INSERT policy for tasks table
CREATE POLICY "authenticated_users_can_create_tasks"
ON tasks FOR INSERT
WITH CHECK (
  auth.uid() = requester_id
);
```

### **Paso 3: Verificar**

Ejecuta esta query para confirmar:

```sql
-- Verify the policy was created
SELECT 
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'tasks' 
AND policyname = 'authenticated_users_can_create_tasks';
```

Deberías ver:
```
policyname: authenticated_users_can_create_tasks
cmd: INSERT
qual: NULL
with_check: (auth.uid() = requester_id)
```

---

## 🎯 **QUÉ HACE ESTA POLÍTICA**

✅ **Permite:** Usuarios autenticados pueden crear tareas  
✅ **Restringe:** Solo pueden crear tareas donde ELLOS son el requester  
✅ **Previene:** Usuarios creando tareas en nombre de otros  

**Ejemplo válido:**
```typescript
// Usuario autenticado: user.id = 'abc-123'
createTask({
  requester_id: 'abc-123', // ✅ Mismo que auth.uid()
  title: 'My Task',
  ...
})
```

**Ejemplo inválido:**
```typescript
// Usuario autenticado: user.id = 'abc-123'
createTask({
  requester_id: 'xyz-789', // ❌ Diferente a auth.uid()
  title: 'Fake Task',
  ...
})
// ERROR: new row violates row-level security policy
```

---

## 📋 **DESPUÉS DE APLICAR EL FIX**

1. **NO** necesitas reconstruir la app
2. **NO** necesitas reinstalar la APK
3. Solo refresca la app en el dispositivo
4. Intenta crear un contrato de nuevo

El error desaparecerá inmediatamente ✅

---

## 🔍 **POLÍTICAS COMPLETAS DE TASKS**

Después del fix, la tabla `tasks` tendrá:

```sql
-- 1. SELECT: Ver tareas abiertas (público)
CREATE POLICY "public_view_open_tasks"
ON tasks FOR SELECT
USING (status = 'OPEN');

-- 2. SELECT: Ver tus propias tareas
CREATE POLICY "users_view_own_tasks"
ON tasks FOR SELECT
USING (auth.uid() = assigned_human_id OR auth.uid() = requester_id);

-- 3. UPDATE: Actualizar tus tareas
CREATE POLICY "users_update_own_tasks"
ON tasks FOR UPDATE
USING (auth.uid() = assigned_human_id OR auth.uid() = requester_id);

-- 4. INSERT: Crear tareas (NUEVO ✨)
CREATE POLICY "authenticated_users_can_create_tasks"
ON tasks FOR INSERT
WITH CHECK (auth.uid() = requester_id);
```

---

## ⚠️ **IMPORTANTE**

Este fix es **crítico para producción**. Sin esta política:
- ❌ Usuarios NO pueden crear contratos
- ❌ El marketplace está "read-only"  
- ❌ La funcionalidad principal está rota

Con esta política:
- ✅ Usuarios pueden crear contratos
- ✅ El marketplace funciona completamente
- ✅ Seguridad mantenida (solo crean sus propias tareas)
