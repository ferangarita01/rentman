# 🔍 Guía Rápida - Ver Logs de Sarah en Chrome DevTools

## ✅ APK Actualizado con Logs Completos

La app ahora tiene logs detallados en cada paso del proceso de conexión de Sarah.

---

## 📱 Paso 1: Preparar Chrome DevTools

### En tu PC:
1. Abre **Google Chrome**
2. Navega a: `chrome://inspect`
3. Deberías ver **"Sarah Habit Coach"** listado bajo "Remote Target"
4. Haz clic en **"Inspect"**

Se abrirá una ventana de Chrome DevTools conectada a tu app Android.

---

## 🎯 Paso 2: Activar Sarah y Ver Logs

### En tu dispositivo Android:
1. Abre la app **Sarah Habit Coach**
2. Ve a la pestaña **Sarah** (ícono de chat 💬)
3. La app intentará conectarse automáticamente

### En Chrome DevTools (en tu PC):
1. Ve a la pestaña **Console**
2. Deberías ver mensajes como:

```javascript
🟢 [SarahEmbedded] Component mounted
🟢 [SarahEmbedded] Calling setIsActive(true)
🟢 [SarahEmbedded] Calling setIsFullPageMode(true)
🔵 [Sarah] connectAgent called
🔵 [Sarah] isActive: true
🔵 [Sarah] user: <user_id>
🔵 [Sarah] wsRef.current: null
🔵 [Sarah] Setting response: Conectando...
🔵 [Sarah] Creating WebSocket: ws://192.168.80.11:8082
```

---

## 🔍 Qué Buscar en los Logs

### ✅ **Flujo Exitoso:**
```
🟢 [SarahEmbedded] Component mounted
🔵 [Sarah] connectAgent called
🔵 [Sarah] Creating WebSocket: ws://192.168.80.11:8082
✅ [Sarah] WebSocket opened!
🔵 [Sarah] Init message sent, calling startListening...
🎤 [Sarah] startListening called
🎤 Requesting NATIVE echo-cancelled microphone access...
```

### ❌ **Error de Red (Backend no está corriendo):**
```
🔵 [Sarah] Creating WebSocket: ws://192.168.80.11:8082
❌ [Sarah] WebSocket error: Event {type: 'error', ...}
🔴 [Sarah] WebSocket closed
```

**Solución:** Verificar que el backend esté corriendo:
```bash
cd C:\Users\Natan\Documents\predict\Agents
node server.js
```

### ❌ **IP Incorrecta:**
```
🔵 [Sarah] Creating WebSocket: ws://192.168.80.11:8082
❌ [Sarah] WebSocket error: ...
# El WebSocket nunca se conecta
```

**Solución:** Verificar IP actual:
```powershell
ipconfig | Select-String "IPv4"
```
Actualizar `src/contexts/SarahContext.tsx` línea 8.

### ❌ **setIsActive no se llama:**
```
# NO aparece: 🟢 [SarahEmbedded] Component mounted
```

**Solución:** SarahEmbeddedVoice no se está montando. Verificar `/sarah/page.tsx`.

### ❌ **Permisos de Micrófono:**
```
🎤 [Sarah] startListening called
⚠️ Microphone requires HTTPS or localhost
```

**Solución:** Otorgar permisos de micrófono en Android Settings.

---

## 📊 Todos los Logs Disponibles

### **SarahEmbeddedVoice (Montaje del Componente):**
- `🟢 [SarahEmbedded] Component mounted`
- `🟢 [SarahEmbedded] Calling setIsActive(true)`
- `🟢 [SarahEmbedded] Calling setIsFullPageMode(true)`
- `🔴 [SarahEmbedded] Component unmounting`

### **SarahContext (Conexión):**
- `🔵 [Sarah] connectAgent called`
- `🔵 [Sarah] isActive: <bool>`
- `🔵 [Sarah] user: <id>`
- `🔵 [Sarah] wsRef.current: <obj>`
- `🔵 [Sarah] Creating WebSocket: <url>`
- `✅ [Sarah] WebSocket opened!`
- `🔵 [Sarah] Init message sent, calling startListening...`

### **SarahContext (Desconexión):**
- `🔴 [Sarah] disconnectAgent called`
- `🔴 [Sarah] WebSocket closed`

### **SarahContext (Micrófono):**
- `🎤 [Sarah] startListening called`
- `🎤 Requesting NATIVE echo-cancelled microphone access...`

### **SarahContext (Errores):**
- `❌ [Sarah] WebSocket error: <error>`
- `❌ [Sarah] Connection error: <error>`
- `⚠️ [Sarah] Skipping connect - window undefined or ws exists`
- `⚠️ Microphone requires HTTPS or localhost`

---

## 🛠️ Comandos Útiles en DevTools Console

### Ver Estado Actual de Sarah:
```javascript
// Ejecutar en Console:
console.log('isActive:', window.__SARAH_DEBUG__?.isActive);
```

### Forzar Reconexión:
```javascript
// Si Sarah no conecta, forzar:
window.location.reload();
```

### Ver Intentos de WebSocket:
1. Ve a la pestaña **Network** en DevTools
2. Filtra por **WS** (WebSocket)
3. Deberías ver `ws://192.168.80.11:8082`
4. Click para ver detalles (Headers, Messages, etc.)

---

## 📝 Checklist de Verificación

Cuando veas los logs en Chrome DevTools, verifica:

- [ ] `🟢 [SarahEmbedded] Component mounted` aparece
- [ ] `🔵 [Sarah] connectAgent called` aparece
- [ ] `🔵 [Sarah] Creating WebSocket: ws://...` muestra la IP correcta
- [ ] `✅ [Sarah] WebSocket opened!` aparece (si no, backend no está corriendo)
- [ ] `🎤 [Sarah] startListening called` aparece
- [ ] No hay mensajes de error `❌` en rojo

---

## 🚀 Siguiente Paso

**Ahora por favor:**

1. Abre `chrome://inspect` en tu PC
2. Click en **"Inspect"** en "Sarah Habit Coach"
3. Ve a la app en tu dispositivo
4. Presiona el ícono de **Sarah** (chat)
5. **Copia y pega todos los logs** que aparezcan en la Console

Con esos logs podré identificar exactamente dónde está el problema. 🔧

---

## 💡 Tip: Filtrar Logs

En Chrome DevTools Console, puedes filtrar logs escribiendo en el campo de búsqueda:

- `[Sarah]` - Ver solo logs de Sarah
- `[SarahEmbedded]` - Ver solo logs del componente
- `❌` - Ver solo errores
- `WebSocket` - Ver solo logs de conexión

---

**Estado:** 🟢 APK con logs completos instalado y corriendo en tu dispositivo.
