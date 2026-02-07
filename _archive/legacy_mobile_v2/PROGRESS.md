# 🎯 Proyecto Rentman V2 - Inicio Limpio

## ✅ Completado Hasta Ahora

### 1. Proyecto Base Creado
- ✅ Expo proyecto limpio con TypeScript
- ✅ Template: blank-typescript
- ✅ Ubicación: `C:\Users\Natan\Documents\predict\Rentman\rentman-v2`

### 2. Dependencias Instaladas
```json
{
  "core": ["expo", "react", "react-native"],
  "routing": ["expo-router", "expo-linking"],
  "ui": ["react-native-safe-area-context", "react-native-screens"],
  "styling": ["nativewind@2.0.11", "tailwindcss@3.4.19"],
  "backend": ["@supabase/supabase-js"],
  "fonts": ["@expo-google-fonts/inter", "@expo-google-fonts/jetbrains-mono"],
  "auth": ["expo-auth-session", "expo-web-browser"],
  "animations": ["react-native-reanimated"],
  "graphics": ["react-native-svg"]
}
```

## 📋 Próximos Pasos

### Paso 3: Configuración de Archivos (15 min)
1. **tailwind.config.js** - Configurar Tailwind
2. **global.css** - Estilos base
3. **babel.config.js** - Agregar NativeWind plugin
4. **app.json** - Configurar Expo Router
5. **tsconfig.json** - Paths y aliases

### Paso 4: Estructura de Carpetas (10 min)
```
rentman-v2/
├── app/
│   ├── (tabs)/       # Tabs navegación
│   ├── auth/         # Pantallas de auth
│   ├── _layout.tsx   # Layout raíz
│   └── index.tsx     # Pantalla inicial
├── components/       # Componentes reutilizables
├── contexts/         # React contexts (Auth, etc)
├── services/         # Supabase services
├── types/            # TypeScript types
└── lib/              # Utilidades
```

### Paso 5: Copiar Código del Proyecto Original (1-2 horas)
1. Copiar `contexts/AuthContext.tsx`
2. Copiar `services/` (supabase config)
3. Copiar `components/` (uno por uno, testeando)
4. Copiar `app/` screens (adaptando a nueva estructura)
5. Copiar `types/`

### Paso 6: Testing Local (30 min)
```bash
cd rentman-v2
npm start
# Probar en Expo Go o simulador
```

### Paso 7: Build Android (15 min)
```bash
npx expo prebuild --platform android --clean
cd android
./gradlew assembleRelease
```

### Paso 8: Cloud Build (12 min)
- Crear `cloudbuild-android.yaml` optimizado
- Submit a Cloud Build
- Generar APK

## 🎯 Ventajas de Este Enfoque

### ✅ Configuración Limpia
- Sin configuraciones heredadas conflictivas
- Versiones compatibles desde el inicio
- NativeWind 2.x (estable) en vez de 4.x

### ✅ Migración Controlada
- Copiar código funcional poco a poco
- Testear cada componente
- Identificar problemas temprano

### ✅ Build Garantizado
- Template probado por Expo
- Sin errores de Babel
- NativeWind funcionando

## ⏱️ Tiempo Estimado

| Fase | Tiempo | Estado |
|------|--------|--------|
| 1. Proyecto base | 5 min | ✅ Completado |
| 2. Dependencias | 10 min | ✅ Completado |
| 3. Configuración | 15 min | ⏳ Siguiente |
| 4. Estructura | 10 min | ⏳ Pendiente |
| 5. Copiar código | 1-2 hrs | ⏳ Pendiente |
| 6. Testing local | 30 min | ⏳ Pendiente |
| 7. Build Android | 15 min | ⏳ Pendiente |
| 8. Cloud Build | 12 min | ⏳ Pendiente |
| **TOTAL** | **2-3 hrs** | **30% completado** |

## 📝 Comandos Útiles

```bash
# Desarrollo
cd rentman-v2
npm start

# Build local
npx expo prebuild --platform android
cd android && ./gradlew assembleRelease

# Cloud build (cuando esté listo)
gcloud builds submit --config=cloudbuild-android.yaml .
```

## 🔄 Siguiente Sesión

Cuando continúes, ejecuta:
```bash
cd C:\Users\Natan\Documents\predict\Rentman\rentman-v2
```

Y continuamos con el Paso 3 (Configuración de archivos).

---

**Fecha**: 2026-02-06  
**Progreso**: 30% completado  
**Siguiente**: Configurar tailwind.config.js, babel.config.js, app.json
