# 🤖 Android Deployment Guide - Sarah Habit Coach

## 📋 Prerequisites

### Required Software
- ✅ **Node.js** (v18+)
- ✅ **Android Studio** (for SDK & Build Tools)
- ✅ **Java JDK** (v17 recommended)
- ✅ **ADB (Android Debug Bridge)** - Usually included with Android Studio

### Environment Setup
```bash
# Check installations
node --version
java --version
adb --version
```

---

## 🚀 Quick Start - Build & Install APK

### Option 1: One-Command Deploy (Recommended)
```bash
npm run android:run
```
This will:
1. Build the Next.js app
2. Export static files to `/out`
3. Sync with Capacitor
4. Build Android APK
5. Install APK on connected device via ADB
6. Launch the app

---

## 📱 Step-by-Step Deployment

### Step 1: Connect Your Android Device

#### Via USB Cable:
1. Enable **Developer Options** on your Android device:
   - Go to Settings → About Phone
   - Tap "Build Number" 7 times
   - Go back to Settings → Developer Options
   - Enable "USB Debugging"

2. Connect device via USB

3. Verify connection:
```bash
adb devices
```

You should see:
```
List of devices attached
XXXXXXXXXX    device
```

#### Via WiFi (Advanced):
```bash
# 1. Connect device via USB first
adb tcpip 5555

# 2. Find device IP (Settings → About Phone → Status → IP Address)
adb connect <DEVICE_IP>:5555

# 3. Disconnect USB cable

# 4. Verify wireless connection
adb devices
```

---

### Step 2: Build the App

#### Option A: Full Clean Build
```bash
# Clean previous builds
npm run android:clean

# Build fresh APK
npm run android:build
```

#### Option B: Quick Rebuild
```bash
npm run android:build
```

---

### Step 3: Install APK

#### Automatic Install:
```bash
npm run android:install
```

#### Manual Install:
```bash
# Find APK at:
# android/app/build/outputs/apk/debug/app-debug.apk

# Install manually:
adb install -r android/app/build/outputs/apk/debug/app-debug.apk
```

---

### Step 4: Launch App

#### Automatic Launch:
```bash
npm run android:run
```

#### Manual Launch:
Open the app from your device's app drawer: **"Sarah Habit Coach"**

Or via ADB:
```bash
adb shell am start -n com.sarah.habitcoach/.MainActivity
```

---

## 🔧 Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Run Next.js dev server (localhost:3000) |
| `npm run build` | Build Next.js production bundle |
| `npm run export` | Build + Export static files to `/out` |
| `npm run cap:sync` | Sync web assets with Capacitor |
| `npm run cap:open` | Open Android project in Android Studio |
| `npm run cap:build` | Build web + sync Capacitor |
| `npm run android:build` | Build Android APK |
| `npm run android:install` | Build + Install APK on device |
| `npm run android:run` | Build + Install + Launch app |
| `npm run android:clean` | Clean Android build cache |
| `npm run android:logcat` | View Android logs filtered for Capacitor |

---

## 🐛 Debugging

### View Real-Time Logs
```bash
npm run android:logcat
```

Or full logcat:
```bash
adb logcat
```

### Chrome DevTools Remote Debugging
1. Open Chrome on desktop
2. Navigate to `chrome://inspect`
3. Device should appear under "Remote Target"
4. Click "Inspect" to open DevTools

### Common Issues

#### ❌ "adb: device not found"
**Solution:** 
- Check USB cable connection
- Verify USB debugging is enabled
- Run `adb devices` to confirm

#### ❌ "INSTALL_FAILED_UPDATE_INCOMPATIBLE"
**Solution:**
```bash
# Uninstall old version first
adb uninstall com.sarah.habitcoach

# Then reinstall
npm run android:install
```

#### ❌ Gradle build fails
**Solution:**
```bash
# Clean build cache
npm run android:clean

# Try again
npm run android:build
```

#### ❌ "Permission denied" on gradlew
**Solution:**
```bash
cd android
chmod +x gradlew
cd ..
```

---

## 📦 Build Output Locations

| File Type | Location |
|-----------|----------|
| Next.js Build | `/out` |
| Debug APK | `/android/app/build/outputs/apk/debug/app-debug.apk` |
| Release APK | `/android/app/build/outputs/apk/release/app-release.apk` |
| AAB (Play Store) | `/android/app/build/outputs/bundle/release/app-release.aab` |

---

## 🎨 Dark Mode / Light Mode Fix

### Current Implementation
✅ **Already Fixed** - Theme is managed by `ThemeContext` with localStorage persistence.

### How It Works:
1. **ThemeProvider** (`src/contexts/ThemeContext.tsx`):
   - Detects system preference on first load
   - Saves preference to localStorage
   - Applies `.dark` class to `<html>`

2. **ThemeToggle** (`src/components/ThemeToggle.tsx`):
   - Smooth animated switch
   - Sun icon (light) / Moon icon (dark)

3. **CSS Variables** (`src/app/globals.css`):
   - Light mode colors in `:root`
   - Dark mode colors in `.dark`

### Testing Theme:
1. Go to Settings page
2. Toggle the theme switch
3. Verify colors change instantly
4. Close and reopen app - preference should persist

### Verify in Android App:
```bash
# Build and install
npm run android:run

# Navigate to Settings
# Toggle Dark Mode switch
# App should instantly update colors
```

---

## 🚀 Production Release Build

### Step 1: Generate Keystore (First Time Only)
```bash
cd android/app
keytool -genkeypair -v -keystore sarah-release.keystore -alias sarah -keyalg RSA -keysize 2048 -validity 10000

# Save the password securely!
```

### Step 2: Configure Signing
Create `android/gradle.properties`:
```properties
SARAH_RELEASE_STORE_FILE=sarah-release.keystore
SARAH_RELEASE_KEY_ALIAS=sarah
SARAH_RELEASE_STORE_PASSWORD=YOUR_PASSWORD_HERE
SARAH_RELEASE_KEY_PASSWORD=YOUR_PASSWORD_HERE
```

### Step 3: Build Release APK
```bash
cd android
./gradlew assembleRelease
```

Output: `android/app/build/outputs/apk/release/app-release.apk`

### Step 4: Build AAB for Google Play
```bash
cd android
./gradlew bundleRelease
```

Output: `android/app/build/outputs/bundle/release/app-release.aab`

---

## 📊 Performance Tips

### Optimize Build Size
```bash
# Remove unused dependencies
npm prune

# Analyze bundle
npm run build
```

### Test on Multiple Devices
```bash
# List all connected devices
adb devices

# Install on specific device
adb -s <DEVICE_ID> install -r app-debug.apk
```

---

## ✅ Deployment Checklist

Before releasing to users:

- [ ] Theme toggle works in both modes
- [ ] All pages load correctly
- [ ] Navigation bottom bar is functional
- [ ] Forms submit data correctly
- [ ] Images load properly
- [ ] No console errors in Chrome DevTools
- [ ] App icon and splash screen display correctly
- [ ] Permissions (if any) are requested properly
- [ ] Back button behavior is correct
- [ ] App doesn't crash on orientation change

---

## 🎯 Quick Reference

### Daily Development Workflow
```bash
# 1. Make code changes in /src

# 2. Test in browser
npm run dev

# 3. Test on Android device
npm run android:run

# 4. View logs
npm run android:logcat
```

### Sharing APK with Testers
```bash
# Build APK
npm run android:build

# Share file:
# android/app/build/outputs/apk/debug/app-debug.apk

# Users install via:
# Settings → Security → Allow Unknown Sources
# Then open APK file
```

---

## 📱 What's Included

✅ **PWA to Native Android** via Capacitor
✅ **Dark/Light Mode** with persistence
✅ **Offline Support** (Service Worker ready)
✅ **Native Look & Feel** (Status bar, navigation)
✅ **Fast Build Times** (Static export)

---

**Status:** 🟢 **Ready for Development & Testing**

For production deployment to Google Play Store, follow the "Production Release Build" section.
