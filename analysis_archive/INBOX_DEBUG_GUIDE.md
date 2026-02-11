# Cómo ver los logs del Inbox

## Método 1: Chrome DevTools (Recomendado)

1. **Abre Chrome** en tu PC
2. **Ve a:** `chrome://inspect`
3. **Encuentra tu dispositivo** en la lista
4. **Click en "inspect"** bajo Rentman
5. **Ve a la pestaña Console**
6. **Abre el Inbox** en la app
7. **Cambia entre los tabs** (All/Doing/Managing)

### Logs que deberías ver:

```javascript
🔍 getThreads called for user: <tu-user-id>
📋 Found X tasks for user
   - As agent (created): X
   - As worker (assigned): X

📊 Inbox filter stats: {
  filterMode: "managing",
  totalThreads: X,
  displayedThreads: X,
  userId: "<tu-user-id>"
}
```

---

## Método 2: ADB Logcat

```powershell
# Ver todos los logs
adb logcat chromium:I *:S

# Filtrar por logs de consola
adb logcat | Select-String "Console"

# Solo logs del Inbox
adb logcat | Select-String "getThreads|Inbox filter|Managing task"
```

---

## Qué verificar:

### 1. En el tab "All"
✅ Deberías ver TODAS las tareas (asAgent + asWorker)

### 2. En el tab "Doing"  
✅ Solo tareas donde `assigned_human_id = tu user id`  
✅ Debe coincidir con Feed "Active"

### 3. En el tab "Managing"
✅ Solo tareas donde `agent_id = tu user id`  
❌ **Si sale vacío:** Tus tareas NO tienen `agent_id` asignado

---

## Si "Managing" está vacío:

Significa que las tareas en el Market **NO tienen tu `agent_id`**.

### Solución rápida (SQL):

```sql
-- Actualizar tareas existentes para asignar agent_id
UPDATE tasks 
SET agent_id = '<tu-user-id>'
WHERE agent_id IS NULL 
  AND status = 'open';
```

### Solución permanente:

Cuando crees nuevas tareas, asegúrate de incluir:
```typescript
{
  agent_id: user.id,  // ← Tu user ID
  status: 'open',
  // ... otros campos
}
```

---

## Debug Extra:

Si ves en los logs:
```
As agent (created): 0
As worker (assigned): 1
```

Significa que:
- ✅ Tienes 1 tarea asignada (aparecerá en "Doing")
- ❌ NO tienes tareas creadas (nada en "Managing")

El problema es que las tareas que creaste **no tienen `agent_id`** en la BD.
