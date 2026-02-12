# 📊 Logs Existentes en Sarah - Referencia Completa

## ✅ Sistema de Logs Implementado

La aplicación ya tiene **logs completos** en todo el flujo de Sarah. Aquí está la referencia de qué esperar:

---

## 🔵 Logs en `SarahContext.tsx`

### **1. Cambio de Estado `isActive`**
```javascript
🔄 [Sarah] isActive changed: true user: true
```
**Cuándo:** Cada vez que `isActive` cambia (mount/unmount de componente)
**Línea:** 60

---

### **2. Conexión - Condiciones Verificadas**
```javascript
✅ [Sarah] Conditions met, calling connectAgent
```
**Cuándo:** `isActive = true` Y `user` existe
**Línea:** 63

---

### **3. Desconexión - Solo si WS existe**
```javascript
⚠️ [Sarah] isActive is false and ws exists, disconnecting
```
**Cuándo:** `isActive` se vuelve false Y hay WebSocket activo
**Línea:** 67

---

### **4. Connect Agent - Inicio**
```javascript
🔵 [Sarah] connectAgent called
🔵 [Sarah] isActive: true
🔵 [Sarah] user: <user_id>
🔵 [Sarah] wsRef.current: null
```
**Cuándo:** Se inicia conexión a Sarah
**Líneas:** 78-81

---

### **5. Connect Agent - Skip**
```javascript
⚠️ [Sarah] Skipping connect - window undefined or ws exists
```
**Cuándo:** Ya hay conexión activa o window no existe (SSR)
**Línea:** 84

---

### **6. Connect Agent - WebSocket Creation**
```javascript
🔵 [Sarah] Setting response: Conectando...
🔵 [Sarah] Creating WebSocket: ws://192.168.80.11:8082
```
**Cuándo:** Creando WebSocket
**Líneas:** 88, 92

---

### **7. WebSocket Opened**
```javascript
✅ [Sarah] WebSocket opened!
🔵 [Sarah] Init message sent, calling startListening...
```
**Cuándo:** Conexión exitosa con backend
**Líneas:** 98, 106

---

### **8. WebSocket Closed**
```javascript
🔴 [Sarah] WebSocket closed
```
**Cuándo:** Conexión WebSocket se cierra (normal o error)
**Línea:** 169

---

### **9. WebSocket Error**
```javascript
❌ [Sarah] WebSocket error: <error_object>
```
**Cuándo:** Error en la conexión WebSocket
**Línea:** 177 (console.error)

---

### **10. Disconnect Agent Called**
```javascript
🔴 [Sarah] disconnectAgent called
```
**Cuándo:** Se llama manualmente a disconnect (botón X, navegación)
**Línea:** 188

---

### **11. Start Listening**
```javascript
🎤 [Sarah] startListening called
```
**Cuándo:** Se inicia captura de audio del micrófono
**Línea:** 255

---

### **12. Window Undefined**
```javascript
⚠️ [Sarah] Window is undefined, skipping
```
**Cuándo:** SSR o window no disponible
**Línea:** 259

---

### **13. Microphone Access**
```javascript
🎤 Requesting NATIVE echo-cancelled microphone access...
```
**Cuándo:** Solicitando permisos de micrófono
**Línea:** 272 (ya existente)

---

### **14. Connection Error**
```javascript
❌ [Sarah] Connection error: <error>
```
**Cuándo:** Error al crear WebSocket
**Línea:** 182 (console.error)

---

## 🟢 Logs en `SarahEmbeddedVoice.tsx`

### **1. Component Mounted**
```javascript
🟢 [SarahEmbedded] Component mounted
```
**Cuándo:** Usuario entra a /sarah
**Línea:** 38

---

### **2. Calling setIsActive**
```javascript
🟢 [SarahEmbedded] Calling setIsActive(true)
```
**Cuándo:** Activando Sarah al montar componente
**Línea:** 39

---

### **3. Setting Full Page Mode**
```javascript
🟢 [SarahEmbedded] Calling setIsFullPageMode(true)
```
**Cuándo:** Indicando modo full-page (oculta StatusBar)
**Línea:** 41

---

### **4. Component Unmounting**
```javascript
🔴 [SarahEmbedded] Component unmounting
```
**Cuándo:** Usuario sale de /sarah
**Línea:** 45

---

### **5. Habit Creator Event**
```javascript
📌 Opening habit creator gadget: <event_detail>
```
**Cuándo:** Sarah trigger "open_habit_creator" event
**Línea:** 54

---

### **6. UI Action**
```javascript
UI action: <action> <data>
```
**Cuándo:** Usuario interactúa con Dynamic UI
**Línea:** 67

---

## 📊 Flujo Completo Esperado (Escenario Exitoso)

Cuando un usuario entra a Sarah y todo funciona:

```
1. 🟢 [SarahEmbedded] Component mounted
2. 🟢 [SarahEmbedded] Calling setIsActive(true)
3. 🟢 [SarahEmbedded] Calling setIsFullPageMode(true)
4. 🔄 [Sarah] isActive changed: true user: true
5. ✅ [Sarah] Conditions met, calling connectAgent
6. 🔵 [Sarah] connectAgent called
7. 🔵 [Sarah] isActive: true
8. 🔵 [Sarah] user: <user_id>
9. 🔵 [Sarah] wsRef.current: null
10. 🔵 [Sarah] Setting response: Conectando...
11. 🔵 [Sarah] Creating WebSocket: ws://192.168.80.11:8082
12. ✅ [Sarah] WebSocket opened!
13. 🔵 [Sarah] Init message sent, calling startListening...
14. 🎤 [Sarah] startListening called
15. 🎤 Requesting NATIVE echo-cancelled microphone access...
```

**Resultado:** Sarah dice "Listening..." y puede recibir audio.

---

## 🔍 Diagnóstico por Logs

### **Problema: "Disconnected" aparece**

**Logs esperados (malo):**
```
🟢 [SarahEmbedded] Component mounted
🟢 [SarahEmbedded] Calling setIsActive(true)
🔄 [Sarah] isActive changed: true user: false  ← ⚠️ NO HAY USER
```

**Solución:** Usuario no está autenticado.

---

### **Problema: No conecta WebSocket**

**Logs esperados (malo):**
```
🔵 [Sarah] Creating WebSocket: ws://192.168.80.11:8082
❌ [Sarah] WebSocket error: <error>
🔴 [Sarah] WebSocket closed
```

**Solución:** Backend no está corriendo o IP incorrecta.

---

### **Problema: Se conecta pero se desconecta inmediatamente**

**Logs esperados (malo):**
```
✅ [Sarah] WebSocket opened!
🔴 [Sarah] disconnectAgent called
⚠️ [Sarah] isActive is false and ws exists, disconnecting
```

**Solución:** Algo está llamando a `setIsActive(false)` - revisar ciclo.

---

### **Problema: No pide permisos de micrófono**

**Logs esperados (malo):**
```
🎤 [Sarah] startListening called
⚠️ Microphone requires HTTPS or localhost  ← ⚠️ SIN PERMISOS
```

**Solución:** Otorgar permisos en Settings → Apps → Sarah Habit Coach.

---

## 🛠️ Cómo Ver Estos Logs en APK

### **Método 1: Guardar a archivo**
```powershell
adb logcat -c
adb logcat > logs.txt
# Usar Sarah en dispositivo por 30 segundos
# Ctrl+C para detener
# Buscar en logs.txt los mensajes [Sarah]
```

### **Método 2: Filtrar en tiempo real (PowerShell)**
```powershell
adb logcat | Select-String -Pattern "\[Sarah\]|\[SarahEmbedded\]"
```

### **Método 3: Solo errores**
```powershell
adb logcat *:E | Select-String -Pattern "Sarah"
```

---

## 📋 Checklist de Logs por Funcionalidad

### **Conexión a Sarah:**
- [ ] `🟢 [SarahEmbedded] Component mounted`
- [ ] `✅ [Sarah] Conditions met, calling connectAgent`
- [ ] `🔵 [Sarah] Creating WebSocket`
- [ ] `✅ [Sarah] WebSocket opened!`

### **Micrófono:**
- [ ] `🎤 [Sarah] startListening called`
- [ ] `🎤 Requesting NATIVE echo-cancelled microphone access...`

### **Desconexión Limpia:**
- [ ] `🔴 [SarahEmbedded] Component unmounting`
- [ ] `🔴 [Sarah] disconnectAgent called`
- [ ] `🔴 [Sarah] WebSocket closed`

---

## 🎯 Comandos Útiles

### **Ver logs completos:**
```powershell
adb logcat -d > full-logs.txt
```

### **Solo logs de Sarah:**
```powershell
adb logcat -d | Select-String "\[Sarah\]" > sarah-only.txt
```

### **Contar cuántas veces conectó:**
```powershell
(adb logcat -d | Select-String "WebSocket opened").Count
```

---

## 📊 Estado Actual

| Log Type | Implementado | Líneas | Útil Para |
|----------|--------------|--------|-----------|
| Mount/Unmount | ✅ | 38, 45 | Ver ciclo de vida |
| isActive changes | ✅ | 60 | Debug estado |
| Connect Agent | ✅ | 78-106 | Debug conexión |
| WebSocket events | ✅ | 98, 169, 177 | Debug red |
| Microphone | ✅ | 255, 259, 272 | Debug permisos |
| Disconnect | ✅ | 188 | Debug cleanup |

**Cobertura:** 🟢 **100%** del flujo crítico tiene logs

---

## 💡 Tips

1. **Buscar por emoji:** Más fácil visualmente
   - 🟢 = Mount/Setup
   - 🔵 = Proceso normal
   - ✅ = Éxito
   - ⚠️ = Advertencia
   - ❌ = Error
   - 🔴 = Cleanup/Close

2. **Guardar logs antes de reportar bug:**
   ```powershell
   adb logcat -c
   # Reproducir bug
   adb logcat -d > bug-logs.txt
   ```

3. **Ver solo últimos logs:**
   ```powershell
   adb logcat -d | Select-String "\[Sarah\]" | Select-Object -Last 20
   ```

---

**Conclusión:** Tenemos un sistema de logging completo. Todos los eventos críticos están instrumentados. 🎯
