# 🏗️ Rentman Android Build Guide

Complete guide for building production-ready Android APK/AAB without EAS dependencies.

## 📋 Prerequisites

### Required Software

1. **Node.js 18+**
   - Download: https://nodejs.org
   - Verify: `node --version`

2. **Java Development Kit (JDK 17+)**
   - Download: https://adoptium.net/
   - Verify: `java -version`
   - Set JAVA_HOME environment variable

3. **Android SDK** (Optional - for manual signing)
   - Download: https://developer.android.com/studio
   - Or install via Android Studio
   - Set ANDROID_HOME environment variable

### Project Dependencies

```powershell
cd rentman-app
npm install
```

---

## 🚀 Build Methods

### Method 1: Full Automated Build (Recommended)

**Script:** `build_manual_offline.ps1`

**What it does:**
- ✅ Validates environment (Node, Java, Gradle)
- ✅ Cleans previous builds
- ✅ Generates native Android code via Expo Prebuild
- ✅ Creates/uses production keystore
- ✅ Configures Gradle signing automatically
- ✅ Builds both APK and AAB
- ✅ Packages artifacts with timestamp
- ✅ Generates build report

**Usage:**
```powershell
cd rentman-app
.\build_manual_offline.ps1
```

**Output:**
```
build-output/
  ├── rentman-v1.0.0-2026-02-06_123456.apk  (Install-ready)
  ├── rentman-v1.0.0-2026-02-06_123456.aab  (Play Store)
  ├── mapping-2026-02-06_123456.txt         (ProGuard mapping)
  └── BUILD_REPORT_2026-02-06_123456.txt    (Build info)
```

**Time:** 5-15 minutes (depending on machine)

---

### Method 2: Manual Step-by-Step Build

For advanced users who want full control:

#### Step 1: Generate Native Code
```powershell
npx expo prebuild --platform android --clean --no-install
```

#### Step 2: Create Keystore (First time only)
```powershell
keytool -genkeypair `
  -v `
  -keystore rentman.keystore `
  -alias rentman_release_key `
  -keyalg RSA `
  -keysize 2048 `
  -validity 10000 `
  -storepass YOUR_PASSWORD `
  -keypass YOUR_PASSWORD `
  -dname "CN=Your Name, OU=Rentman, O=Rentman Inc, L=City, S=State, C=US"
```

**⚠️ CRITICAL:** Backup this keystore file! Without it, you cannot update your app on Play Store.

#### Step 3: Configure Signing

Edit `android/gradle.properties`:
```properties
RENTMAN_KEYSTORE_FILE=rentman.keystore
RENTMAN_KEYSTORE_PASSWORD=YOUR_PASSWORD
RENTMAN_KEY_ALIAS=rentman_release_key
RENTMAN_KEY_PASSWORD=YOUR_PASSWORD
```

Copy keystore:
```powershell
Copy-Item rentman.keystore android/app/rentman.keystore
```

Edit `android/app/build.gradle` - add inside `android {}` block:
```gradle
signingConfigs {
    release {
        if (project.hasProperty('RENTMAN_KEYSTORE_FILE')) {
            storeFile file(RENTMAN_KEYSTORE_FILE)
            storePassword RENTMAN_KEYSTORE_PASSWORD
            keyAlias RENTMAN_KEY_ALIAS
            keyPassword RENTMAN_KEY_PASSWORD
        }
    }
}

buildTypes {
    release {
        signingConfig signingConfigs.release
        minifyEnabled true
        proguardFiles getDefaultProguardFile('proguard-android.txt'), 'proguard-rules.pro'
    }
}
```

#### Step 4: Build
```powershell
cd android

# Clean
.\gradlew clean

# Build APK
.\gradlew assembleRelease

# Build AAB (for Play Store)
.\gradlew bundleRelease
```

#### Step 5: Locate Artifacts
```
android/app/build/outputs/
  ├── apk/release/app-release.apk
  └── bundle/release/app-release.aab
```

---

### Method 3: Sign Existing APK

If you already have an unsigned/debug APK:

**Script:** `sign-apk.ps1`

**Usage:**
```powershell
# Auto-detect APK
.\sign-apk.ps1

# Specify APK
.\sign-apk.ps1 -InputAPK "path/to/app.apk" -OutputAPK "rentman-signed.apk"

# Custom keystore
.\sign-apk.ps1 `
  -InputAPK "app.apk" `
  -KeystorePath "my.keystore" `
  -KeystorePassword "mypass" `
  -KeyAlias "myalias"
```

**Requirements:**
- ANDROID_HOME environment variable set
- Android SDK build-tools installed

---

## 📦 Build Artifacts

### APK vs AAB

| Format | Use Case | Install Method |
|--------|----------|----------------|
| **APK** | Direct installation, testing | `adb install app.apk` |
| **AAB** | Google Play Store upload | Upload via Play Console |

### APK Installation

**Via ADB:**
```powershell
# Install
adb install -r rentman-v1.0.0.apk

# Install on specific device
adb -s DEVICE_ID install -r rentman.apk
```

**Via File Transfer:**
1. Copy APK to Android device
2. Enable "Install from Unknown Sources"
3. Tap APK to install

---

## 🔐 Keystore Management

### Security Best Practices

1. **Never commit keystore to Git**
   - Already in `.gitignore`

2. **Backup keystore securely**
   - Cloud storage (encrypted)
   - Password manager
   - Hardware USB drive

3. **Document keystore details**
   ```
   Keystore: rentman.keystore
   Alias: rentman_release_key
   Password: [STORE SECURELY]
   Created: 2026-02-06
   Valid until: 2053-06-01
   ```

4. **If keystore is lost:**
   - ❌ Cannot update app on Play Store
   - ⚠️ Must publish as NEW app (lose users)
   - 💡 Keep multiple backups!

### Keystore Info

View keystore details:
```powershell
keytool -list -v -keystore rentman.keystore
```

---

## 🧪 Testing Builds

### Automated Installation via ADB

**Script:** `install-apk.ps1`

**Features:**
- ✅ Auto-detects connected devices
- ✅ Auto-finds latest APK
- ✅ Uninstalls old version automatically
- ✅ Installs and optionally launches app
- ✅ Real-time log viewing

**Basic Usage:**
```powershell
# Auto-detect APK and install
.\install-apk.ps1

# Install and launch immediately
.\install-apk.ps1 -Launch

# Install and show logs
.\install-apk.ps1 -Launch -ShowLogs

# Specify APK path
.\install-apk.ps1 -ApkPath "build-output\rentman-v1.0.0-*.apk" -Launch

# Install on specific device (if multiple connected)
.\install-apk.ps1 -DeviceId "ABC123456" -Launch
```

### Pre-Release Checklist

- [ ] Test on physical device (not just emulator)
- [ ] Test all critical features:
  - [ ] Google Auth login
  - [ ] Location permissions & tracking
  - [ ] Push notifications
  - [ ] Camera/photo upload
  - [ ] Realtime updates
- [ ] Test offline functionality
- [ ] Verify app icons & splash screen
- [ ] Check app version in Settings

### Install on Test Device

**Automated (Recommended):**
```powershell
# Quick install
.\install-apk.ps1 -Launch

# Install with live logs
.\install-apk.ps1 -Launch -ShowLogs
```

**Manual via ADB:**
```powershell
# List connected devices
adb devices

# Install APK
adb install -r build-output/rentman-v1.0.0-*.apk

# Launch app
adb shell am start -n com.rentman.app/.MainActivity

# View logs while testing
adb logcat | Select-String "Rentman"
adb logcat -s ReactNativeJS:V

# Clear app data (for testing fresh install)
adb shell pm clear com.rentman.app
```

**Manual via File Transfer:**

---

## 🚀 Play Store Deployment

### 1. Prepare Play Console

1. Go to https://play.google.com/console
2. Create app (if first time)
3. Complete Store Listing (screenshots, description)
4. Set Content Rating
5. Set Pricing & Distribution

### 2. Upload AAB

1. Production → Create new release
2. Upload: `rentman-v1.0.0-*.aab`
3. Add release notes
4. Review and rollout

### 3. Upload Mapping File (ProGuard)

Required for crash reports:
- Upload: `build-output/mapping-*.txt`
- In Play Console → App Bundle Explorer

---

## 🐛 Troubleshooting

### Build Fails: "JAVA_HOME not set"
```powershell
# Windows
$env:JAVA_HOME = "C:\Program Files\Java\jdk-17"
setx JAVA_HOME "C:\Program Files\Java\jdk-17"
```

### Build Fails: "SDK location not found"
```powershell
# Create android/local.properties
sdk.dir=C:\\Users\\YourName\\AppData\\Local\\Android\\Sdk
```

### Build Fails: "Execution failed for task ':app:lintVitalRelease'"
```gradle
// In android/app/build.gradle, add:
android {
    lintOptions {
        checkReleaseBuilds false
        abortOnError false
    }
}
```

### APK Install Fails: "INSTALL_FAILED_UPDATE_INCOMPATIBLE"
```powershell
# Uninstall existing app first
adb uninstall com.rentman.app

# Then reinstall
adb install -r rentman.apk
```

### Signature Verification Fails
- Ensure using correct keystore
- Verify passwords are correct
- Check keystore hasn't expired

---

## 📊 Build Performance

### Optimization Tips

1. **Use Gradle Daemon**
   - Already enabled by default
   - Speeds up subsequent builds

2. **Increase Gradle Memory**
   - Edit `android/gradle.properties`:
     ```properties
     org.gradle.jvmargs=-Xmx4096m -XX:MaxMetaspaceSize=512m
     ```

3. **Enable Parallel Builds**
   - Add to `gradle.properties`:
     ```properties
     org.gradle.parallel=true
     org.gradle.configureondemand=true
     ```

4. **Use Build Cache**
   - Add to `gradle.properties`:
     ```properties
     android.enableBuildCache=true
     ```

### Typical Build Times

| Task | Time (Slow PC) | Time (Fast PC) |
|------|---------------|----------------|
| Clean | 30s | 10s |
| Prebuild | 2-3 min | 1 min |
| Gradle Build | 8-12 min | 3-5 min |
| **Total** | **10-15 min** | **4-6 min** |

---

## 🔄 Version Management

### Updating App Version

Edit `app.json`:
```json
{
  "expo": {
    "version": "1.0.1",
    "android": {
      "versionCode": 2
    }
  }
}
```

**Rules:**
- `version`: User-facing (1.0.0 → 1.0.1)
- `versionCode`: Must increment for each release (1 → 2 → 3)

---

## 📝 Build Scripts Summary

| Script | Purpose | When to Use |
|--------|---------|-------------|
| `build_manual_offline.ps1` | Full automated build + optional ADB install | **Production releases** |
| `install-apk.ps1` | Install APK via ADB with auto-detection | **Testing on devices** |
| `sign-apk.ps1` | Sign existing APK | Post-build signing |
| `verify.ps1` | Pre-build validation | Before building |

---

## 🎯 Quick Reference

**Build & Deploy:**
```powershell
# Full production build with ADB install
.\build_manual_offline.ps1
# (Will prompt for ADB install at the end)

# Or build + install separately
.\build_manual_offline.ps1
.\install-apk.ps1 -Launch -ShowLogs
```

**ADB Commands:**
```powershell
# Install
.\install-apk.ps1 -Launch

# Install on specific device
adb devices
.\install-apk.ps1 -DeviceId "DEVICE_ID" -Launch

# Manual install
adb install -r build-output/rentman-*.apk

# Launch app
adb shell am start -n com.rentman.app/.MainActivity

# View logs (filtered)
adb logcat | Select-String "Rentman"

# View React Native logs
adb logcat -s ReactNativeJS:V

# View all errors
adb logcat *:E

# Clear app data
adb shell pm clear com.rentman.app

# Uninstall app
adb uninstall com.rentman.app

# Screenshot (for app store)
adb shell screencap -p /sdcard/screenshot.png
adb pull /sdcard/screenshot.png

# Record screen (for demo video)
adb shell screenrecord /sdcard/demo.mp4
# Press Ctrl+C to stop
adb pull /sdcard/demo.mp4
```

---

## 📞 Support

**Build Issues?**
1. Check logs in `android/app/build/` 
2. Search error on Stack Overflow
3. Check Expo forums: https://forums.expo.dev

**Keystore Lost?**
- Cannot be recovered
- Must create new app listing
- Always keep backups!

---

*Last updated: 2026-02-06*
*Build system: Expo Prebuild + Gradle (No EAS)*
