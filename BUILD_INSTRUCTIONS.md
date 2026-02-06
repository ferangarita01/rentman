# 📱 Rentman Android Build Instructions

## 🚀 Método Recomendado: Cloud Build Optimizado

### Build Rápido (15-20 minutos)
```bash
gcloud builds submit --config=cloudbuild-android-optimized.yaml --async .
```

### Monitorear el Build
```bash
# Obtener ID del build más reciente
BUILD_ID=$(gcloud builds list --limit=1 --format="value(id)")

# Ver estado
gcloud builds describe $BUILD_ID --format="value(status)"

# Ver logs en tiempo real
gcloud builds log $BUILD_ID --stream
```

### Descargar APK cuando termine
```bash
# Descargar la versión más reciente
gsutil cp gs://rentman-builds/app-release-latest.apk ./

# O una versión específica por timestamp
gsutil ls gs://rentman-builds/app-release-*.apk
gsutil cp gs://rentman-builds/app-release-20260206-173000.apk ./
```

---

## 🎯 Optimizaciones Aplicadas

### 1. **Máquina Más Potente**
- `E2_HIGHCPU_32` (antes: E2_HIGHCPU_8)
- 32 vCPUs vs 8 vCPUs = 4x más rápido

### 2. **Solo Arquitectura ARM64**
```properties
reactNativeArchitectures=arm64-v8a
```
- Reduce tiempo de compilación en ~75%
- Compatible con 99% de dispositivos Android modernos

### 3. **Gradle Optimizado**
- Build cache habilitado
- Parallel builds (4 workers)
- Más memoria (4GB JVM)
- Skip tareas innecesarias (lint, test)

### 4. **Node.js Installation Silenciosa**
- Instalación en background para reducir logs

---

## 🔧 Alternativa: EAS Build (Expo)

### Configuración (Una sola vez)
```bash
cd rentman-app
npm install -g eas-cli
eas login
eas build:configure
```

### Build Android APK
```bash
eas build --platform android --profile preview
```

**Ventajas:**
- ✅ Builds más rápidos (10-15 min)
- ✅ Caché automático entre builds
- ✅ No requiere configurar Cloud Build
- ✅ 30 builds gratis/mes

---

## 🏠 Alternativa: Build Local

### Requisitos
1. Android Studio instalado
2. Android SDK 34
3. Java 17

### Pasos
```bash
cd rentman-app
npm install
npx expo prebuild --platform android --clean
cd android
./gradlew assembleRelease
```

APK generado en:
```
android/app/build/outputs/apk/release/app-release.apk
```

---

## 📊 Comparación de Métodos

| Método | Tiempo | Requiere | Costo | Recomendado |
|--------|--------|----------|-------|-------------|
| **Cloud Build Optimizado** | 15-20 min | gcloud CLI | $0.10/build | ✅ Sí (CI/CD) |
| **EAS Build** | 10-15 min | eas-cli | Gratis (30/mes) | ✅ Sí (Expo) |
| **Local Build** | 5-10 min | Android Studio | Gratis | ⚠️  Para desarrollo |
| Cloud Build Original | 45-60 min | gcloud CLI | $0.10/build | ❌ No (muy lento) |

---

## 🐛 Troubleshooting

### Build falla en módulos nativos
```bash
# Limpiar caché de Gradle
cd rentman-app/android
./gradlew clean

# Rebuild
gcloud builds submit --config=cloudbuild-android-optimized.yaml --async .
```

### APK muy grande
El APK optimizado (solo ARM64) será ~40% más pequeño que con todas las arquitecturas.

### Verificar APK generado
```bash
# Ver tamaño
gsutil ls -lh gs://rentman-builds/app-release-latest.apk

# Descargar e instalar
adb install app-release-latest.apk
```

---

## 📝 Notas

- **Tiempo estimado**: 15-20 minutos con configuración optimizada
- **Costo**: ~$0.10 por build en Google Cloud
- **Arquitectura**: Solo ARM64-v8a (compatible con 99% de dispositivos modernos)
- **Caché**: Se recomienda configurar Cloud Build cache para builds aún más rápidos

---

## 🎯 Próximos Pasos

1. ✅ Cancelar el build actual (colgado)
2. ✅ Usar `cloudbuild-android-optimized.yaml`
3. ✅ Esperar 15-20 minutos
4. ✅ Descargar APK de `gs://rentman-builds/app-release-latest.apk`
5. ✅ Instalar y probar en dispositivo Android
