# 🚀 Rentman Build Scripts - Quick Start

Production-ready build automation for Rentman Android app (No EAS required).

## 📁 Scripts Overview

| Script | Purpose | Time |
|--------|---------|------|
| `build_manual_offline.ps1` | Full production build (APK + AAB) | 5-15 min |
| `install-apk.ps1` | Install & launch via ADB | 30 sec |
| `sign-apk.ps1` | Sign existing APK | 1 min |
| `verify.ps1` | Pre-build validation | 10 sec |

---

## 🎯 Common Workflows

### 1️⃣ Build for Production
```powershell
.\build_manual_offline.ps1
```
**Output:** `build-output/rentman-v1.0.0-TIMESTAMP.apk` + `.aab`

**Auto-prompts for ADB installation at the end.**

---

### 2️⃣ Install on Test Device
```powershell
.\install-apk.ps1 -Launch
```
**Does:**
- ✅ Auto-detects connected device
- ✅ Finds latest APK
- ✅ Uninstalls old version
- ✅ Installs new APK
- ✅ Launches app

---

### 3️⃣ Build + Test + Logs (Full Cycle)
```powershell
# Terminal 1: Build
.\build_manual_offline.ps1

# Terminal 2: Install and monitor
.\install-apk.ps1 -Launch -ShowLogs
```

---

## 📋 Prerequisites

✅ **Node.js 18+** - `node --version`  
✅ **Java JDK 17+** - `java -version`  
✅ **Android Device** - USB Debugging enabled  
✅ **ADB** (optional) - For automated installation  

---

## 🔥 Quick Examples

### Build APK
```powershell
.\build_manual_offline.ps1
```

### Install Latest APK
```powershell
.\install-apk.ps1 -Launch
```

### Install Specific APK
```powershell
.\install-apk.ps1 -ApkPath "my-app.apk" -Launch
```

### Install on Specific Device (if multiple connected)
```powershell
adb devices
.\install-apk.ps1 -DeviceId "ABC123456" -Launch
```

### Sign Unsigned APK
```powershell
.\sign-apk.ps1 -InputAPK "app-unsigned.apk"
```

### Verify Environment Before Build
```powershell
.\verify.ps1
```

---

## 📱 ADB Commands Cheat Sheet

```powershell
# List devices
adb devices

# Install APK
adb install -r app.apk

# Launch app
adb shell am start -n com.rentman.app/.MainActivity

# Uninstall
adb uninstall com.rentman.app

# View logs (Rentman only)
adb logcat | Select-String "Rentman"

# View React Native logs
adb logcat -s ReactNativeJS:V

# Clear app data
adb shell pm clear com.rentman.app
```

---

## 🔐 Keystore Security

**CRITICAL:** The `rentman.keystore` file is auto-generated on first build.

⚠️ **BACKUP THIS FILE!** Without it, you cannot update the app on Play Store.

**Backup locations:**
- Cloud storage (encrypted)
- Password manager
- USB drive
- Multiple computers

**Never commit to Git** (already in `.gitignore`)

---

## 📦 Build Output

After successful build:

```
build-output/
├── rentman-v1.0.0-20260206_045600.apk    ← Install on devices
├── rentman-v1.0.0-20260206_045600.aab    ← Upload to Play Store
├── mapping-20260206_045600.txt           ← ProGuard mapping (for crashes)
└── BUILD_REPORT_20260206_045600.txt      ← Build details
```

---

## 🚀 Deploy to Play Store

1. Build AAB:
   ```powershell
   .\build_manual_offline.ps1
   ```

2. Go to: https://play.google.com/console

3. Upload: `build-output/rentman-v*.aab`

4. Upload mapping: `build-output/mapping-*.txt`

5. Submit for review

---

## 🐛 Troubleshooting

### "ADB not found"
```powershell
# Install via Chocolatey
choco install adb

# Or download: https://developer.android.com/studio/releases/platform-tools
```

### "No devices connected"
1. Connect device via USB
2. Enable USB Debugging (Settings → Developer Options)
3. Accept "Allow USB Debugging" prompt
4. Run: `adb devices`

### "JAVA_HOME not set"
```powershell
$env:JAVA_HOME = "C:\Program Files\Java\jdk-17"
setx JAVA_HOME "C:\Program Files\Java\jdk-17"
```

### Build fails with Gradle errors
```powershell
# Clean and retry
cd android
.\gradlew clean
cd ..
.\build_manual_offline.ps1
```

---

## 📚 Full Documentation

See [BUILD_GUIDE.md](BUILD_GUIDE.md) for comprehensive documentation.

---

## ⚡ One-Line Workflows

```powershell
# Build only
.\build_manual_offline.ps1

# Build + Install
.\build_manual_offline.ps1; .\install-apk.ps1 -Launch

# Build + Install + Logs
.\build_manual_offline.ps1; .\install-apk.ps1 -Launch -ShowLogs

# Just install latest
.\install-apk.ps1 -Launch

# Verify before build
.\verify.ps1; .\build_manual_offline.ps1
```

---

**Need help?** Check [BUILD_GUIDE.md](BUILD_GUIDE.md) for detailed instructions.

*Last updated: 2026-02-06*
