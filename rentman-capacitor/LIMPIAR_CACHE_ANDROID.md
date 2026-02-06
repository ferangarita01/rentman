## 🔥 INSTRUCCIONES CRÍTICAS - Limpiar Caché Android

### ⚠️ **SI LOS CAMBIOS NO APARECEN EN EL DISPOSITIVO:**

El problema es que **Capacitor usa WebView** que cachea agresivamente el CSS/JS. Necesitas:

### **OPCIÓN 1: Limpiar desde Android (RECOMENDADO)**
```
1. Ir a: Ajustes → Aplicaciones
2. Buscar: "Sarah Habit Coach"
3. Tap: "Almacenamiento"
4. Presionar: "Borrar caché"
5. Presionar: "Borrar datos" (⚠️ Esto borra sesión)
6. Volver a abrir la app
```

### **OPCIÓN 2: Desinstalar y Reinstalar**
```bash
# En Windows PowerShell:
cd C:\Users\Natan\Documents\predict\Agents\niches\coach-habitos\pwa\android
adb uninstall com.sarah.habitcoach
./gradlew installDebug
```

### **OPCIÓN 3: Force Clean Build (si nada funciona)**
```bash
cd C:\Users\Natan\Documents\predict\Agents\niches\coach-habitos\pwa

# 1. Borrar TODO
Remove-Item -Recurse -Force out
Remove-Item -Recurse -Force .next
Remove-Item -Recurse -Force android\app\build
Remove-Item -Recurse -Force android\build

# 2. Build limpio
npm run build

# 3. Sync forzado
npx cap sync android --force

# 4. Clean + install
cd android
./gradlew clean
./gradlew installDebug
```

---

## ✅ **Cambios Aplicados (Build FINAL - 10 Enero 2026 21:45 UTC)**

### **1. SarahVoiceAgent.tsx - Botón 🎤**
```tsx
// Protección de usuario (no renderiza sin login)
if (!user) {
  return null;
}

// Estilos inline (evita caché CSS)
style={{
  position: 'fixed',
  bottom: '80px',     // 80px desde abajo
  right: '24px',      // 24px desde derecha
  zIndex: 100
}}
```

### **2. page.tsx - Botón [+]**
```tsx
// Estilos inline
style={{
  position: 'fixed',
  bottom: '80px',
  left: '24px',
  zIndex: 40
}}
```

### **3. BottomNav.tsx - Barra de Navegación** ⭐ NUEVO
```tsx
import { useAuth } from '@/contexts/AuthContext';

export default function BottomNav() {
  const pathname = usePathname();
  const { user } = useAuth();

  // Ocultar en auth O si no hay usuario
  if (pathname === '/auth' || pathname === '/landing.html' || !user) {
    return null;
  }
  // ...
}
```

---

## 🎯 **Elementos Ocultos en /auth (Login)**

| Componente | Condición | Estado |
|------------|-----------|--------|
| SarahVoiceAgent (🎤) | `!user` | ✅ Oculto |
| BottomNav (Barra) | `!user` o `/auth` | ✅ Oculto |
| Botón [+] | Solo en page.tsx | ✅ No existe en /auth |

**Resultado:** Pantalla de login **100% limpia** sin botones ni barra.

---

## 🎯 **Posiciones Finales (80px desde abajo)**

```
┌──────────────────────────┐
│                          │
│       Contenido          │
│                          │
│  [+]              🎤     │ ← 80px abajo, 24px lados
│                          │
├──────────────────────────┤
│ Today | Progress | ...  │ ← BottomNav 64px
└──────────────────────────┘
    ↑                   ↑
  left:24px         right:24px
```

**Separación del Nav:** 80px - 64px = **16px**

---

## 📱 **Verificación Visual**

Después de limpiar caché:

- [ ] Botón 🎤 en **esquina inferior derecha**
- [ ] Botón [+] en **esquina inferior izquierda**
- [ ] **NO aparecen** en pantalla de login (/auth)
- [ ] Ambos a **80px desde abajo** (simétricos)
- [ ] Separados **16px del BottomNav**

Si **AÚN** no cambian:
1. El dispositivo tiene WebView muy cacheado
2. Desinstala completamente la app
3. Reinstala desde cero

**Build Número:** 76 tareas ejecutadas  
**Timestamp:** 2026-01-10 21:43 UTC
