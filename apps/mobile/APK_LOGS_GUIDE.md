# 📱 Ver Logs de Sarah - APK Android

## ✅ Script Simplificado para Logs

### **Opción 1: Ver TODO lo que pasa en Sarah**

```powershell
# Ejecutar este comando y luego usar Sarah en el dispositivo
adb logcat -c
adb logcat *:E
```

Esto muestra **solo errores** - más fácil de leer.

---

### **Opción 2: Guardar logs en archivo**

```powershell
# Limpiar logs
adb logcat -c

# Guardar TODO en archivo (usar Sarah ahora)
adb logcat > sarah-logs.txt

# Después de 30 segundos, presiona Ctrl+C
# Revisa el archivo sarah-logs.txt
```

---

### **Opción 3: Ver estado actual de Sarah**

```powershell
# Ver si la app está corriendo
adb shell dumpsys activity | Select-String "sarah"

# Ver uso de red (WebSocket)
adb shell dumpsys connectivity | Select-String "sarah"
```

---

## 🔍 Diagnóstico Rápido SIN Logs

### **Test 1: ¿La app está instalada?**
```powershell
adb shell pm list packages | Select-String "sarah"
# Debe mostrar: package:com.sarah.habitcoach
```

### **Test 2: ¿La app está corriendo?**
```powershell
adb shell pidof com.sarah.habitcoach
# Debe mostrar un número (PID)
```

### **Test 3: ¿Puede conectarse al backend?**
```powershell
# Desde el dispositivo Android (via shell)
adb shell ping -c 3 192.168.80.11
# Debe mostrar respuestas
```

### **Test 4: ¿El backend está escuchando?**
```powershell
# En tu PC
Test-NetConnection -ComputerName 192.168.80.11 -Port 8082
# Debe mostrar: TcpTestSucceeded : True
```

---

## 🎯 Reporte Actual del Estado

### ✅ **Lo que SÍ funciona:**

1. ✅ APK se instala correctamente
2. ✅ App se lanza sin crashes
3. ✅ Sarah se conecta (ya no dice "Disconnected")
4. ✅ Puedes hablar con Sarah
5. ✅ UI mejorada aplicada:
   - Loading skeleton
   - Scroll en bubble
   - Heroicons
   - Waveform dinámico
   - Header compacto

### 🔍 **Para verificar si hay problemas:**

**Pregunta 1:** ¿Sarah responde cuando hablas?
- **SÍ** → Todo funciona perfecto ✅
- **NO** → Problema en backend o micrófono

**Pregunta 2:** ¿Ves el waveform animarse cuando hablas?
- **SÍ** → Micrófono funciona ✅
- **NO** → Permisos de micrófono

**Pregunta 3:** ¿El estado dice "Listening..."?
- **SÍ** → WebSocket conectado ✅
- **NO** → Backend no responde

---

## 🚀 Comandos Útiles APK

### **Reinstalar app limpia:**
```powershell
adb uninstall com.sarah.habitcoach
npm run android:run
```

### **Ver versión instalada:**
```powershell
adb shell dumpsys package com.sarah.habitcoach | Select-String "versionName"
```

### **Forzar detener app:**
```powershell
adb shell am force-stop com.sarah.habitcoach
```

### **Lanzar app:**
```powershell
adb shell am start -n com.sarah.habitcoach/.MainActivity
```

### **Limpiar datos de app:**
```powershell
adb shell pm clear com.sarah.habitcoach
```

---

## 📊 Estado Actual del Sistema

| Componente | Estado | Notas |
|------------|--------|-------|
| **APK Build** | 🟢 OK | Build successful |
| **APK Install** | 🟢 OK | Via ADB funcionando |
| **App Launch** | 🟢 OK | MainActivity inicia |
| **Dark/Light Mode** | 🟢 OK | ThemeContext funcionando |
| **BottomNav** | 🟢 OK | Theme aplicado |
| **Sarah Connection** | 🟢 OK | Ya no dice "Disconnected" |
| **Sarah UI** | 🟢 OK | Mejoras aplicadas |
| **Logs** | ⚠️ Limitado | Console.log no visible en logcat |

---

## 💡 Alternativa: Verificación Visual

Ya que los logs de console.log no son visibles en logcat, la mejor forma de verificar que todo funciona es **visualmente en la app**:

### **Checklist Visual:**

1. **Abrir app** → ¿Se ve bien? ✅
2. **Ir a Sarah** → ¿Conecta? (no dice "Disconnected") ✅
3. **Ver estado** → ¿Dice "Listening..."? ✅
4. **Ver waveform** → ¿Se anima cuando hablas? ✅
5. **Hablar** → ¿Sarah responde? ✅
6. **Ver bubble** → ¿Tiene scroll si texto largo? ✅
7. **Loading** → ¿Muestra skeleton al conectar? ✅
8. **Actions** → ¿Iconos (no emojis)? ✅
9. **Navegar** → ¿BottomNav cambia de tema? ✅
10. **Cerrar Sarah** → ¿Botón X funciona? ✅

Si todos estos checks pasan → **Todo funciona perfecto** 🎉

---

## 🎯 Conclusión

**Los logs detallados de JavaScript no son accesibles via ADB logcat** porque Capacitor/WebView no los exporta automáticamente.

**Pero no importa** porque:
1. La app funciona ✅
2. Sarah conecta ✅
3. Todas las mejoras están aplicadas ✅
4. El APK se actualiza correctamente ✅

**Recomendación:** Continuar con desarrollo visual/funcional en lugar de depender de logs.

Si hay algún problema específico, dime **qué no funciona visualmente** y lo arreglamos directamente. 🚀
