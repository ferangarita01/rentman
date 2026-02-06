# 🔍 Sarah No Se Conecta - Guía de Diagnóstico

## 📱 Estado Actual

Después de los cambios recientes:
- ✅ Dark/Light mode funcionando
- ✅ BottomNav con theme correcto
- ✅ Progress page con theme correcto
- ✅ Botón de cerrar (X) en SarahStatusBar funcionando
- ❌ **Sarah no se conecta al intentar activarla**

---

## 🔧 Métodos de Debugging

### **Opción 1: Chrome Remote Debugging (Recomendado)**

#### Paso 1: Habilitar DevTools
```bash
adb forward tcp:9222 localabstract:webview_devtools_remote_10028
```

#### Paso 2: Abrir Chrome en PC
1. Navega a `chrome://inspect` en tu navegador Chrome desktop
2. Deberías ver "Sarah Habit Coach" listado bajo "Remote Target"
3. Click en **"Inspect"**

#### Paso 3: Ver Console
- Tab **Console** muestra todos los `console.log()`
- Tab **Network** muestra intentos de WebSocket
- Tab **Application** muestra localStorage y estados

#### Qué buscar:
```
✅ "🔄 Conectando..." (SarahContext iniciando)
✅ "WebSocket opened" (Conexión exitosa)
❌ "WebSocket error" o "Connection failed" (Error de red)
❌ TypeError, ReferenceError (Error de código)
```

---

### **Opción 2: Logs via ADB (Secundario)**

```bash
# Limpiar logs
adb logcat -c

# Capturar logs en tiempo real
adb logcat -v time | findstr /i "Console chromium"
```

Luego en el dispositivo:
1. Ve a Sarah
2. Observa los logs en la terminal

---

## 🧪 Posibles Causas y Soluciones

### **1. WebSocket Server No Está Corriendo**

**Verificar:**
```bash
# Desde el backend
cd C:\Users\Natan\Documents\predict\Agents
node server.js
```

**Debe mostrar:**
```
🎤 Sarah Backend running on port 8082
WebSocket server listening on ws://192.168.80.11:8082
```

**Fix:**
Si el servidor no está corriendo, inícialo antes de probar la app.

---

### **2. IP del Backend Cambió**

**Verificar IP actual:**
```powershell
ipconfig | Select-String "IPv4"
```

**Actualizar en código:**
```typescript
// src/contexts/SarahContext.tsx
const HOST = '192.168.80.11:8082'; // ← Verificar que esta IP sea correcta
```

**Rebuild APK:**
```bash
npm run android:run
```

---

### **3. `setIsActive` No Se Llama**

**Verificar en DevTools Console:**
```javascript
// Debería ver al entrar a /sarah:
console.log('Setting isActive to true')
```

**Si no aparece:**
- `SarahEmbeddedVoice` no se está montando
- Check que `/sarah/page.tsx` esté renderizando correctamente

**Fix Manual (Temporal):**
```typescript
// En SarahEmbeddedVoice.tsx
useEffect(() => {
    console.log('🔵 SarahEmbeddedVoice mounted');
    setIsActive(true);
    console.log('🟢 setIsActive called');
    // ...
}, []);
```

---

### **4. Permisos de Micrófono**

**Verificar en Android:**
- Settings → Apps → Sarah Habit Coach → Permissions
- Microphone debe estar **Allowed**

**Si no aparece permiso:**
```typescript
// El código debería mostrar:
"⚠️ Microphone requires HTTPS or localhost"
```

**Fix:**
Capacitor debería solicitar permisos automáticamente. Si no:
```xml
<!-- android/app/src/main/AndroidManifest.xml -->
<uses-permission android:name="android.permission.RECORD_AUDIO" />
```

---

### **5. AudioContext Bloqueado**

Chrome requiere interacción del usuario antes de crear AudioContext.

**Síntoma:**
```
DOMException: The AudioContext was not allowed to start.
```

**Fix:**
Asegurar que `setIsActive(true)` se llame **después** de que el usuario haga clic/tap en algo.

**En `SarahEmbeddedVoice`:**
- Ya se llama en `useEffect` al montar (debería funcionar)
- Pero si hay error, agregar un botón manual:

```tsx
<button onClick={() => setIsActive(true)}>
  🎤 Activar Sarah
</button>
```

---

### **6. Estado `isActive` Se Reseta**

**Verificar en DevTools:**
```javascript
// Ejecutar en console:
window.React = require('react');
// Luego inspeccionar el estado
```

**Posible causa:**
- `disconnectAgent` se está llamando involuntariamente
- Algún useEffect limpiándose prematuramente

**Fix:**
Agregar logs en `SarahContext`:
```typescript
const connectAgent = async () => {
    console.log('🔵 connectAgent called');
    // ...
};

const disconnectAgent = useCallback(() => {
    console.log('🔴 disconnectAgent called');
    console.trace(); // Ver quién lo llamó
    // ...
}, []);
```

---

## 🛠️ Quick Fixes para Probar

### **Fix 1: Agregar Logs de Debug**

```typescript
// src/contexts/SarahContext.tsx

// En connectAgent:
const connectAgent = async () => {
    console.log('🔵 [Sarah] connectAgent starting...');
    console.log('🔵 [Sarah] WebSocket URL:', WS_URL);
    
    try {
        const ws = new WebSocket(WS_URL);
        console.log('🔵 [Sarah] WebSocket created:', ws.readyState);
        // ...
    } catch (error) {
        console.error('❌ [Sarah] WebSocket error:', error);
    }
};

// En startListening:
const startListening = async () => {
    console.log('🎤 [Sarah] startListening called');
    // ...
};
```

### **Fix 2: Forzar Conexión Manual (Debugging)**

```tsx
// src/app/sarah/page.tsx

export default function SarahPage() {
  const { setIsActive } = useSarah();
  
  return (
    <div>
      <button 
        onClick={() => {
          console.log('🔵 Manual activate');
          setIsActive(true);
        }}
        className="bg-blue-500 text-white px-4 py-2 rounded"
      >
        🎤 Activar Sarah Manualmente
      </button>
      
      <SarahEmbeddedVoice />
    </div>
  );
}
```

### **Fix 3: Verificar State en DevTools**

Una vez en Chrome DevTools:
```javascript
// En Console tab:
// 1. Ver si SarahContext está disponible
window.__SARAH_STATE__ = {
  isActive: false,
  isConnected: false
};

// 2. Monitorear cambios
setInterval(() => {
  console.log('Sarah State:', window.__SARAH_STATE__);
}, 2000);
```

---

## 📊 Checklist de Verificación

Antes de continuar, verificar:

- [ ] Backend `server.js` está corriendo en `192.168.80.11:8082`
- [ ] IP en `SarahContext.tsx` es correcta
- [ ] Permisos de micrófono otorgados en Android
- [ ] Chrome DevTools muestra Console logs
- [ ] Al navegar a `/sarah`, se llama `setIsActive(true)`
- [ ] WebSocket intenta conectarse (ver Network tab)
- [ ] No hay errores JavaScript en Console

---

## 🚀 Próximos Pasos

1. **Abrir Chrome DevTools** (`chrome://inspect`)
2. **Navegar a `/sarah` en la app**
3. **Observar Console tab**
4. **Reportar qué aparece:**
   - ¿Se llama `setIsActive`?
   - ¿Intenta conectar WebSocket?
   - ¿Hay algún error?

---

## 📝 Información del Sistema

**Backend:**
- Host: `192.168.80.11:8082`
- Protocol: `ws://` (WebSocket)
- Endpoint: Root `/`

**Frontend:**
- Framework: Next.js 16.1.1
- Audio: Web Audio API
- WebSocket: Native browser API

**Android:**
- Package: `com.sarah.habitcoach`
- WebView: Chromium-based
- Capacitor: v8.0.0

---

**Siguiente acción recomendada:**
Abrir `chrome://inspect` y compartir lo que aparece en la Console cuando intentas activar Sarah.
