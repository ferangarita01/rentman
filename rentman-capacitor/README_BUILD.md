# 🚀 Rentman Capacitor - Build & Deployment Scripts

## 📋 Scripts Disponibles

### 1. `build-install-run.ps1` (Todo en Uno)
Compila, instala y ejecuta la app automáticamente.

```powershell
# Build debug, instalar y ejecutar
.\build-install-run.ps1

# Build release
.\build-install-run.ps1 -Release

# Desinstalar versión anterior primero
.\build-install-run.ps1 -UninstallFirst

# Usar APK existente (skip build)
.\build-install-run.ps1 -SkipBuild
```

**Pasos automáticos**:
1. ✅ Verifica dispositivo conectado
2. ✅ Compila APK (debug/release)
3. ✅ Instala en dispositivo
4. ✅ Inicia la app
5. ✅ Muestra logs en tiempo real

---

### 2. `build-only.ps1` (Solo Compilar)
Solo compila el APK sin instalar.

```powershell
# Build debug
.\build-only.ps1

# Build release
.\build-only.ps1 -Release

# Build con limpieza previa
.\build-only.ps1 -Clean
```

**Salida**:
- APK en: `rentman-debug.apk` o `rentman-release.apk`
- También en: `android/app/build/outputs/apk/`

---

### 3. `install-and-run.ps1` (Solo Instalar)
Instala APK existente y ejecuta la app.

```powershell
# Instalar debug
.\install-and-run.ps1

# Instalar release
.\install-and-run.ps1 -Release

# Desinstalar primero
.\install-and-run.ps1 -UninstallFirst

# Mostrar logs
.\install-and-run.ps1 -ShowLogs
```

---

## 🔧 Requisitos

### Windows
- PowerShell 5.1+
- Android SDK Platform Tools (ADB)
- Java JDK 17 o 21
- Gradle (incluido en proyecto)

### Verificar ADB
```powershell
adb devices
```

Si no está instalado:
1. Descargar: [Android SDK Platform Tools](https://developer.android.com/studio/releases/platform-tools)
2. Agregar al PATH

---

## 📱 Dispositivo Android

### Habilitar USB Debugging
1. **Settings** → **About Phone**
2. Tocar **Build Number** 7 veces
3. **Settings** → **Developer Options**
4. Habilitar **USB Debugging**

### Conectar y Verificar
```powershell
adb devices
# Output: 1163455475003653  device
```

---

## 🏗️  Flujo de Desarrollo Típico

### Primer Build
```powershell
# 1. Build completo
.\build-install-run.ps1

# 2. La app se instala y ejecuta automáticamente
# 3. Ver logs en consola
```

### Cambios Rápidos (HTML/CSS/JS)
```powershell
# 1. Hacer cambios en src/
# 2. Rebuild Next.js
npm run build

# 3. Sync con Capacitor
npx cap sync

# 4. Build e instalar
.\build-install-run.ps1
```

### Solo Reinstalar (sin rebuild)
```powershell
.\build-install-run.ps1 -SkipBuild
```

---

## 🔑 Release Build (Play Store)

### Generar Keystore (una vez)
```powershell
cd android
keytool -genkey -v -keystore rentman-release-key.jks -alias rentman -keyalg RSA -keysize 2048 -validity 10000

# Guardar:
# - Password: [tu-password-seguro]
# - Alias: rentman
```

### Configurar Signing en `android/app/build.gradle`
```gradle
android {
    signingConfigs {
        release {
            storeFile file('../rentman-release-key.jks')
            storePassword 'tu-password'
            keyAlias 'rentman'
            keyPassword 'tu-password'
        }
    }
    
    buildTypes {
        release {
            signingConfig signingConfigs.release
            minifyEnabled false
            proguardFiles getDefaultProguardFile('proguard-android.txt'), 'proguard-rules.pro'
        }
    }
}
```

### Build Release
```powershell
.\build-only.ps1 -Release
# Output: rentman-release.apk (firmado)
```

---

## 📊 Ver Logs

### Durante ejecución
```powershell
.\install-and-run.ps1 -ShowLogs
```

### Manualmente
```powershell
# Todos los logs
adb logcat

# Solo Capacitor
adb logcat -s Capacitor

# Filtrar por app
adb logcat | Select-String "Rentman"

# Limpiar logs
adb logcat -c
```

---

## 🐛 Troubleshooting

### "No devices connected"
```powershell
# Verificar conexión USB
adb devices

# Reiniciar ADB server
adb kill-server
adb start-server
```

### "Build failed"
```powershell
# Limpiar y rebuild
.\build-only.ps1 -Clean

# O manualmente
cd android
.\gradlew.bat clean assembleDebug
```

### "Installation failed"
```powershell
# Desinstalar primero
.\install-and-run.ps1 -UninstallFirst

# O manualmente
adb uninstall com.rentman.app
```

### "App no inicia"
```powershell
# Verificar logs
adb logcat -s Capacitor,chromium

# Launch manualmente
adb shell am start -n com.rentman.app/com.rentman.app.MainActivity
```

---

## 📦 Tamaños Típicos

- **Debug APK**: ~6 MB
- **Release APK**: ~4-5 MB (con minify)
- **AAB (Play Store)**: ~3-4 MB

---

## 🚀 Workflow Completo

```powershell
# 1. Desarrollo
code .
npm run dev

# 2. Build web
npm run build

# 3. Sync Capacitor
npx cap sync

# 4. Build, install & run
.\build-install-run.ps1

# 5. Ver logs
# (ya se muestran automáticamente)

# 6. Hacer cambios y repetir
# (Ctrl+C para salir de logs)
```

---

## 📝 Notas

- Los scripts usan **debug** por defecto (más rápido)
- **Release** builds requieren keystore configurado
- APKs se copian automáticamente a la raíz del proyecto
- Logs se filtran por Capacitor y chromium

---

**Última actualización**: 2026-02-06  
**Versión**: 1.0.0  
**App ID**: com.rentman.app
