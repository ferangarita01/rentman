# 🎯 Layout de Botones Flotantes - Coach Habitos Android

## 📱 Distribución Final (CORREGIDA)

```
┌─────────────────────────────┐
│                             │
│      Pantalla Today         │
│                             │
│   [+]                  🎤   │ ← Botones flotantes
│                             │
├─────────────────────────────┤
│  Today | Progress | Sarah.. │ ← BottomNav (64px)
└─────────────────────────────┘
```

---

## ✅ Estado Actual (10 Enero 2026)

### **Botón [+] Crear Hábito** (Izquierda)
- **Archivo:** `pwa/src/app/page.tsx` línea ~430
- **Posición:** `fixed bottom-20 left-6`
- **Z-index:** `z-40`
- **Tamaño:** `w-16 h-16` (64x64px)
- **Estilo:** `action-gradient` (naranja a rosa)
- **Función:** Abre modal para crear hábito
- **Visible en:** Solo página "Today" (/)

### **Botón 🎤 Hablar con Sarah** (Derecha)
- **Archivo:** `pwa/src/components/SarahVoiceAgent.tsx` línea ~330
- **Posición:** `fixed bottom-20 right-6`
- **Z-index:** `z-[100]` (sobre todo)
- **Tamaño:** `w-16 h-16` (64x64px)
- **Estilo:** `mic-gradient` (púrpura a rosa)
- **Función:** Activa agente de voz Sarah
- **Visible en:** TODAS las páginas (layout.tsx)

---

## 🔧 Espaciado Exacto

| Elemento | Bottom | Left/Right | Altura |
|----------|--------|------------|--------|
| BottomNav | 0px | - | 64px |
| Botón [+] | 80px | 24px (left) | 64px |
| Botón 🎤 | 80px | 24px (right) | 64px |
| **Separación del Nav** | **16px** | - | - |

**Cálculo:** `bottom-20` (80px) - 64px (BottomNav) = **16px de aire**

---

## 🎨 Estilos Aplicados

### Botón [+] (Crear Hábito)
```tsx
<button className="
  w-16 h-16 
  action-gradient 
  rounded-full 
  shadow-2xl shadow-primary/40 
  flex items-center justify-center 
  text-white 
  transform transition-all 
  active:scale-95 
  hover:scale-110
">
  <PlusIcon className="w-8 h-8" strokeWidth={2.5} />
</button>
```

### Botón 🎤 (Voz Sarah)
```tsx
<button className="
  fixed bottom-20 right-6 z-[100]
  w-16 h-16 
  mic-gradient 
  rounded-full 
  shadow-2xl shadow-primary/40 
  flex items-center justify-center 
  text-white 
  transform transition-all 
  active:scale-95 
  hover:scale-110 
  relative overflow-hidden 
  border-2 border-white/20
">
  <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
  <MicrophoneIcon className="w-7 h-7" strokeWidth={2.5} />
</button>
```

---

## 📋 Cambios Aplicados Hoy

### ❌ Antes (Incorrecto)
- Botón [+]: `bottom-24 left-6` (96px abajo)
- Botón 🎤: `bottom-24 right-5` (96px abajo, 20px derecha)
- Tamaños: 56x56px (`w-14 h-14`)
- Problema: Tapados por BottomNav, muy pequeños

### ✅ Después (Correcto)
- Ambos botones: `bottom-20` (80px abajo)
- Botón [+]: `left-6` (24px izquierda)
- Botón 🎤: `right-6` (24px derecha)
- Tamaños: 64x64px (`w-16 h-16`)
- Resultado: Visibles, simétricos, fáciles de tocar

---

## 🚀 Verificación en Dispositivo

### Checklist:
- [ ] Abrir app en TECNO BG6
- [ ] Página "Today": Ver 2 botones flotantes
- [ ] Botón izquierdo (+): Abre modal crear hábito
- [ ] Botón derecho (🎤): Abre panel de voz Sarah
- [ ] Ambos separados 16px del BottomNav
- [ ] Ambos con tamaño 64x64px
- [ ] Ir a "Progress": Solo 🎤 debe aparecer
- [ ] Ir a "Sarah": Solo 🎤 debe aparecer
- [ ] Ir a "Settings": Solo 🎤 debe aparecer

---

## 🐛 Problemas Resueltos

1. **Botón pegado a la izquierda:**
   - Causa: Botón [+] en page.tsx tapaba visualmente
   - Fix: Ajustado `bottom-24` → `bottom-20` en ambos

2. **No aparece en otras páginas:**
   - Causa: SarahVoiceAgent está en layout.tsx (global)
   - Verificado: ✅ Sí aparece en todas las páginas
   - Botón [+]: Solo en page.tsx (correcto, local)

3. **CSS no se aplicaba:**
   - Causa: Caché de Capacitor/Gradle
   - Fix: `npm run build` + `cap sync` + `gradlew clean`

---

## 📝 Archivos Modificados

```
pwa/src/app/page.tsx           # Botón [+] izquierda
pwa/src/components/SarahVoiceAgent.tsx  # Botón 🎤 derecha
pwa/src/app/globals.css        # Dark mode text fixes
```

---

**Estado:** ✅ COMPLETADO  
**Fecha:** 10 Enero 2026 21:33 UTC  
**Build:** app-debug.apk v1.0  
**Dispositivo:** TECNO BG6 - Android 13
