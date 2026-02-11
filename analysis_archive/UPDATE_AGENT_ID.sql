-- ============================================
-- RENTMAN: Update agent_id for Open Tasks
-- ============================================
-- Este SQL asigna agent_id a todas las tareas 'open' que no lo tienen
-- Usa el ID del primer usuario en la base de datos
-- ============================================

-- PASO 1: Ver cuál es tu User ID
-- Copia este ID para usarlo en el PASO 2
SELECT 
  id as user_id,
  email,
  created_at
FROM auth.users
ORDER BY created_at ASC
LIMIT 1;

-- ============================================
-- PASO 2: Ver qué tareas se van a actualizar
-- ============================================
SELECT 
  id, 
  title, 
  status, 
  agent_id,
  assigned_human_id,
  created_at
FROM tasks
WHERE agent_id IS NULL 
  AND status = 'open'
ORDER BY created_at DESC;

-- ============================================
-- PASO 3: Actualizar tareas
-- ============================================
-- IMPORTANTE: Reemplaza 'PEGAR-TU-USER-ID-AQUI' con el ID del PASO 1
--
-- Ejemplo de User ID: 12345678-1234-1234-1234-123456789abc
-- ============================================

-- OPCIÓN A: Actualizar con un User ID específico
UPDATE tasks 
SET agent_id = 'PEGAR-TU-USER-ID-AQUI'
WHERE agent_id IS NULL 
  AND status = 'open'
RETURNING id, title, status, agent_id;

-- ============================================
-- OPCIÓN B: Actualizar automáticamente (más fácil)
-- Usa el ID del primer usuario creado
-- ============================================
WITH first_user AS (
  SELECT id FROM auth.users ORDER BY created_at ASC LIMIT 1
)
UPDATE tasks 
SET agent_id = (SELECT id FROM first_user)
WHERE agent_id IS NULL 
  AND status = 'open'
RETURNING id, title, status, agent_id;

-- ============================================
-- PASO 4: Verificar resultados
-- ============================================
-- Reemplaza 'TU-USER-ID' con tu ID real
SELECT 
  COUNT(*) as total_tasks,
  COUNT(CASE WHEN agent_id = 'TU-USER-ID' THEN 1 END) as managing_tasks,
  COUNT(CASE WHEN assigned_human_id = 'TU-USER-ID' THEN 1 END) as doing_tasks
FROM tasks;

-- O usa esta versión automática:
WITH my_user AS (
  SELECT id FROM auth.users ORDER BY created_at ASC LIMIT 1
)
SELECT 
  COUNT(*) as total_tasks,
  COUNT(CASE WHEN agent_id = (SELECT id FROM my_user) THEN 1 END) as managing_tasks,
  COUNT(CASE WHEN assigned_human_id = (SELECT id FROM my_user) THEN 1 END) as doing_tasks
FROM tasks;

-- ============================================
-- PASO 5: Ver detalle de tus tareas
-- ============================================
WITH my_user AS (
  SELECT id, email FROM auth.users ORDER BY created_at ASC LIMIT 1
)
SELECT 
  t.id,
  t.title,
  t.status,
  CASE 
    WHEN t.agent_id = (SELECT id FROM my_user) THEN '📝 Managing'
    WHEN t.assigned_human_id = (SELECT id FROM my_user) THEN '🔨 Doing'
    ELSE '❓ Other'
  END as role,
  t.created_at
FROM tasks t
WHERE t.agent_id = (SELECT id FROM my_user) 
   OR t.assigned_human_id = (SELECT id FROM my_user)
ORDER BY t.created_at DESC;

-- ============================================
-- RESUMEN RÁPIDO
-- ============================================
-- 1. Ejecuta PASO 1 para ver tu User ID
-- 2. Ejecuta PASO 2 para ver qué tareas se actualizarán
-- 3. Ejecuta OPCIÓN B del PASO 3 (es automática, no requiere copiar ID)
-- 4. Ejecuta PASO 4 o PASO 5 para verificar
-- 5. Abre la app y ve a Inbox > Managing
-- ============================================
