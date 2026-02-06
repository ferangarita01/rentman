# 🔍 Weekly Overview - Diagnóstico de Datos Reales

## 📱 APK Actualizado con Debug Toasts

Ahora cuando entres a la pantalla **Progress** verás un toast que indica:

### ✅ **Si HAY datos:**
```
📊 Loaded: 5 habits, 3 day streak!
```
Esto significa que los datos existen pero algo más está fallando.

### ❌ **Si NO hay datos:**
```
⚠️ No habit logs found. Complete a habit!
```
Esto significa que la query NO encuentra registros en `habit_logs`.

---

## 🐛 Posibles Causas si NO Encuentra Datos

### **1. Row Level Security (RLS) Bloqueando Lectura**

**Síntoma:** Hábitos se completan en Home, pero Progress no los ve.

**Causa:** Política RLS en Supabase no permite `SELECT` en `habit_logs`.

**Verificación en Supabase:**
```sql
-- Ver políticas actuales
SELECT * FROM pg_policies WHERE tablename = 'habit_logs';

-- Debería tener algo como:
-- POLICY: "Users can view own habit logs"
-- USING: (auth.uid() = user_id)
```

**Fix (ejecutar en Supabase SQL Editor):**
```sql
-- Eliminar políticas anteriores si existen
DROP POLICY IF EXISTS "Users can view own habit logs" ON habit_logs;

-- Crear política correcta
CREATE POLICY "Users can view own habit logs"
ON habit_logs
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Verificar que RLS está habilitado
ALTER TABLE habit_logs ENABLE ROW LEVEL SECURITY;
```

---

### **2. Campo `completed_at` vs `created_at`**

**Síntoma:** Query busca `completed_at` pero hábitos antiguos solo tienen `created_at`.

**Causa:** Migración incompleta o campos inconsistentes.

**Fix (ejecutar en Supabase):**
```sql
-- Actualizar registros antiguos que no tienen completed_at
UPDATE habit_logs
SET completed_at = created_at
WHERE completed_at IS NULL;

-- Verificar que todos tienen completed_at
SELECT COUNT(*) as total,
       COUNT(completed_at) as with_completed_at
FROM habit_logs;
```

---

### **3. User ID No Coincide**

**Síntoma:** Los logs se crean con un `user_id`, pero la query busca con otro.

**Verificación:**
```sql
-- Ver user_id actual del usuario logueado
SELECT auth.uid();

-- Ver qué user_ids tienen registros en habit_logs
SELECT DISTINCT user_id, COUNT(*) as count
FROM habit_logs
GROUP BY user_id;

-- Si no coinciden, hay un problema de autenticación
```

---

### **4. Tabla Vacía (Edge Case)**

**Verificación:**
```sql
-- Ver TODOS los registros (sin filtro de user)
SELECT COUNT(*) FROM habit_logs;

-- Si es 0, los hábitos no se están guardando
-- Si es > 0, el problema es de filtrado/RLS
```

---

## 🛠️ Script de Diagnóstico Rápido

Ejecuta esto en **Supabase SQL Editor:**

```sql
-- === DIAGNÓSTICO COMPLETO ===

-- 1. Ver total de registros
SELECT 'Total habit_logs' as check, COUNT(*) as count FROM habit_logs
UNION ALL
-- 2. Ver registros del usuario actual
SELECT 'User habit_logs', COUNT(*) FROM habit_logs WHERE user_id = auth.uid()
UNION ALL
-- 3. Ver registros SIN user_id
SELECT 'Logs without user_id', COUNT(*) FROM habit_logs WHERE user_id IS NULL
UNION ALL
-- 4. Ver registros SIN completed_at
SELECT 'Logs without completed_at', COUNT(*) FROM habit_logs WHERE completed_at IS NULL;

-- 5. Ver últimos 10 registros del usuario
SELECT 
  id,
  habit_id,
  user_id,
  completed_at,
  created_at,
  (user_id = auth.uid()) as is_mine
FROM habit_logs
ORDER BY created_at DESC
LIMIT 10;

-- 6. Ver políticas RLS
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'habit_logs';
```

---

## 📊 Interpretación de Resultados

### **Escenario A: Query retorna 0 pero tabla tiene datos**
```
Total habit_logs: 15
User habit_logs: 0
```
**Problema:** RLS está bloqueando o user_id no coincide.

**Fix:** Aplicar política RLS correcta (ver arriba).

---

### **Escenario B: Tabla completamente vacía**
```
Total habit_logs: 0
```
**Problema:** `completeHabit()` no está insertando en la tabla.

**Fix:** Revisar función `completeHabit` en `page.tsx` línea 197.

---

### **Escenario C: `completed_at` es NULL**
```
Logs without completed_at: 15
```
**Problema:** Campo `completed_at` no se está llenando.

**Fix:** Ejecutar UPDATE para completar (ver arriba).

---

### **Escenario D: No hay políticas RLS**
```
(resultado vacío en pg_policies)
```
**Problema:** RLS no está configurado.

**Fix:** Crear política (ver arriba).

---

## 🎯 Acción Inmediata

1. **Ve a Progress en el APK** → ¿Qué toast aparece?
2. **Si dice "No logs found":**
   - Ir a Supabase SQL Editor
   - Ejecutar script de diagnóstico
   - Compartir resultados

3. **Si dice "Loaded: X habits":**
   - El problema es de renderizado, no de datos
   - Revisar `weeklyActivity` generación

---

## 💡 Quick Fix Temporal

Si quieres probar con datos dummy mientras arreglamos RLS:

```typescript
// En useProgressStats.ts, línea 54 (temporal)
if (!allLogs || allLogs.length === 0) {
    // TEMPORAL: Datos de prueba
    console.log('⚠️ Using DUMMY data for testing');
    setStats({
        currentStreak: 5,
        totalCompleted: 12,
        weeklyActivity: [
            { day: 'D', date: '2026-01-06', count: 2, isToday: false, intensity: 50 },
            { day: 'L', date: '2026-01-07', count: 3, isToday: false, intensity: 75 },
            { day: 'M', date: '2026-01-08', count: 1, isToday: false, intensity: 25 },
            { day: 'M', date: '2026-01-09', count: 2, isToday: false, intensity: 50 },
            { day: 'J', date: '2026-01-10', count: 4, isToday: false, intensity: 100 },
            { day: 'V', date: '2026-01-11', count: 0, isToday: false, intensity: 15 },
            { day: 'S', date: '2026-01-12', count: 3, isToday: true, intensity: 75 },
        ],
        loading: false
    });
    return;
}
```

Esto te permitirá ver cómo DEBERÍA verse con datos reales.

---

**Siguiente paso:** Dime qué toast aparece cuando vayas a Progress. 🎯
