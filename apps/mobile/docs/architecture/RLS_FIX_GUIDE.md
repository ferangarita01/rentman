# 🔧 Solución: RLS Policies Failed

## ✅ Problema Identificado

El test **"User habit_logs"** falló con error de **RLS Policy violation**.

**Causa:** La tabla `habit_logs` tiene Row Level Security (RLS) habilitado, pero NO tiene política de `SELECT` que permita a los usuarios leer sus propios registros.

---

## 🚀 Solución Rápida (5 minutos)

### **Paso 1: Ir a Supabase SQL Editor**

1. Abre: https://app.supabase.com/project/vuqmwuwsugqcavipttgd/sql
2. Click en "New query"

---

### **Paso 2: Ejecutar Script de Reparación**

Copia y pega este SQL completo:

```sql
-- ELIMINAR POLÍTICAS ANTERIORES (si existen)
DROP POLICY IF EXISTS "Users can view own habit logs" ON habit_logs;
DROP POLICY IF EXISTS "Users can insert own habit logs" ON habit_logs;
DROP POLICY IF EXISTS "Users can update own habit logs" ON habit_logs;
DROP POLICY IF EXISTS "Users can delete own habit logs" ON habit_logs;

-- HABILITAR RLS
ALTER TABLE habit_logs ENABLE ROW LEVEL SECURITY;

-- CREAR POLÍTICA DE SELECT (LA MÁS IMPORTANTE)
CREATE POLICY "Users can view own habit logs"
ON habit_logs
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- CREAR POLÍTICA DE INSERT
CREATE POLICY "Users can insert own habit logs"
ON habit_logs
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- CREAR POLÍTICA DE UPDATE
CREATE POLICY "Users can update own habit logs"
ON habit_logs
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- CREAR POLÍTICA DE DELETE
CREATE POLICY "Users can delete own habit logs"
ON habit_logs
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);
```

---

### **Paso 3: Ejecutar (Click "Run")**

Deberías ver:
```
Success. No rows returned
```

---

### **Paso 4: Verificar Políticas Creadas**

Ejecuta este query:

```sql
SELECT policyname, cmd
FROM pg_policies
WHERE tablename = 'habit_logs';
```

**Resultado esperado:**
```
| policyname                        | cmd    |
|-----------------------------------|--------|
| Users can view own habit logs     | SELECT |
| Users can insert own habit logs   | INSERT |
| Users can update own habit logs   | UPDATE |
| Users can delete own habit logs   | DELETE |
```

---

### **Paso 5: Verificar Datos Accesibles**

Ejecuta:

```sql
SELECT COUNT(*) as my_logs
FROM habit_logs
WHERE user_id = auth.uid();
```

**Resultado esperado:**
- Si has completado hábitos: Número > 0
- Si no has completado: 0 (normal)

---

## 📱 Verificar en el APK

1. **Vuelve a la app**
2. **Ve a Settings → Database Diagnostics**
3. **Click "Run Tests"**

**Ahora debería mostrar:**
```
✅ User habit_logs: X
✅ Fetch user logs: 5
```

---

## 🔄 Aplicar a Todas las Tablas (Recomendado)

Si quieres evitar problemas futuros, ejecuta también `FIX_ALL_RLS_POLICIES.sql`:

```sql
-- Ver archivo: FIX_ALL_RLS_POLICIES.sql
-- Aplica políticas a: goals, objectives, habits, habit_logs
```

Esto asegura que TODAS las tablas tengan políticas correctas.

---

## 📊 Después de Aplicar el Fix

### **Weekly Overview debería funcionar:**

1. **Ve a Progress (Your Journey)**
2. **Deberías ver:**
   - ✅ Current Streak actualizado
   - ✅ Total Completed actualizado
   - ✅ Weekly Overview con barras de colores
   - ✅ Toast: "📊 Loaded: X habits, Y day streak!"

---

## 🐛 Si Aún No Funciona

### **Verifica estos puntos:**

1. **¿El usuario está autenticado?**
   ```sql
   SELECT auth.uid();
   -- Debe retornar un UUID, no NULL
   ```

2. **¿Hay datos en la tabla?**
   ```sql
   SELECT COUNT(*) FROM habit_logs;
   -- Debe ser > 0 si has completado hábitos
   ```

3. **¿El user_id coincide?**
   ```sql
   SELECT DISTINCT user_id FROM habit_logs;
   -- Debe incluir tu auth.uid()
   ```

4. **¿completed_at está lleno?**
   ```sql
   SELECT COUNT(*) FROM habit_logs WHERE completed_at IS NULL;
   -- Debe ser 0
   ```

---

## 💡 Alternativa: Datos de Prueba

Si quieres ver cómo DEBERÍA verse mientras arreglas RLS:

### En `useProgressStats.ts`, línea 54, agrega temporalmente:

```typescript
if (!allLogs || allLogs.length === 0) {
    console.log('⚠️ Using DUMMY data for testing');
    
    // TEMPORAL - QUITAR DESPUÉS
    setStats({
        currentStreak: 7,
        totalCompleted: 15,
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

Esto te mostrará cómo DEBERÍA verse el Weekly Overview.

---

## ✅ Checklist Final

- [ ] Ejecutar `FIX_RLS_POLICIES.sql` en Supabase
- [ ] Verificar 4 políticas creadas
- [ ] Ejecutar "Run Tests" en app
- [ ] Test "User habit_logs" pasa ✅
- [ ] Weekly Overview muestra datos reales
- [ ] (Opcional) Ejecutar `FIX_ALL_RLS_POLICIES.sql`

---

## 🎯 Próximo Paso

**Ejecuta el script SQL ahora y dime:**
1. ¿Se crearon las políticas? (4 políticas)
2. ¿Cuántos logs retorna el COUNT? (número)
3. ¿El test en la app ahora pasa? ✅

Con eso confirmo que el problema está resuelto. 🚀
