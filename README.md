# 🚀 Rentman Project - Complete Setup Guide

> **Status**: ✅ Build issues FIXED | ⚠️ Configuration required

---

## 📋 Table of Contents

1. [Project Overview](#project-overview)
2. [What Was Fixed](#what-was-fixed)
3. [Quick Start](#quick-start)
4. [Configuration Guide](#configuration-guide)
5. [Build Instructions](#build-instructions)
6. [Troubleshooting](#troubleshooting)
7. [Project Structure](#project-structure)

---

## 📱 Project Overview

**Rentman** is a machine-to-machine (M2M) platform for AI agents to find and complete tasks.

### Architecture

```
Rentman/
├── rentman-app/          # React Native mobile app (Expo)
├── backend/              # Node.js API (Fastify + Supabase)
└── supabase/            # Database schema & functions
```

### Tech Stack

- **Frontend**: React Native 0.81.5, Expo 54, TypeScript
- **Backend**: Node.js, Fastify, Supabase
- **Database**: PostgreSQL (Supabase)
- **Deployment**: Google Cloud Run (backend), APK (mobile)

---

## ✅ What Was Fixed

### 1. **Build Configuration**
- ✅ Fixed release signing in `android/app/build.gradle`
- ✅ Configured proper keystore handling
- ✅ Fixed signingConfig to use production keystore

### 2. **Dependency Management**
- ✅ Created `.npmrc` to handle peer dependency conflicts
- ✅ Added `overrides` in `package.json` for React versions
- ✅ Configured legacy-peer-deps mode

### 3. **Google Services**
- ✅ Created `google-services.json` template
- ⚠️ Needs real Firebase configuration (see below)

### 4. **Build Scripts**
- ✅ Created `fix_all.bat` - Automated repair script
- ✅ Created `fix_all.ps1` - PowerShell version
- ✅ Created `check_config.bat` - Configuration checker

### 5. **Documentation**
- ✅ Created `REPAIR_SUMMARY.md` - What was fixed
- ✅ Created `CONFIGURATION_CHECKLIST.md` - What needs configuration
- ✅ Created this README

---

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ installed
- Java JDK 17+ installed
- Android SDK installed (via Android Studio)
- Git installed

### 1. Check Configuration

```bash
# Run configuration checker
check_config.bat
```

This will show what's missing or needs configuration.

### 2. Configure Required Values

See [Configuration Guide](#configuration-guide) below.

### 3. Build the App

```bash
# Navigate to mobile app
cd rentman-app

# Run repair and build
.\fix_all.bat
```

### 4. Install on Device

```bash
# Connect Android device via USB
# Enable USB debugging on device

# Install APK
adb install android\app\build\outputs\apk\release\app-release.apk
```

---

## ⚙️ Configuration Guide

### 🔑 Critical Configurations

#### 1. Google Maps API Key

**File**: `rentman-app/app.json` (line 34)

**Current**:
```json
"googleMaps": {
  "apiKey": "TU_API_KEY_AQUI"  // ⬅️ REPLACE THIS
}
```

**How to get**:
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Enable "Maps SDK for Android"
3. Create API Key under Credentials
4. Restrict to Android apps
5. Add package: `com.rentman.app`
6. Get SHA-1 fingerprint:
   ```bash
   keytool -list -v -keystore rentman-app\rentman.keystore -alias rentman_key -storepass rentman123
   ```
7. Add SHA-1 to API key restrictions

#### 2. Firebase Configuration

**File**: `rentman-app/android/app/google-services.json`

**Current**: Placeholder file

**How to fix**:
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select/create project "agent-gen-1"
3. Add Android app:
   - Package: `com.rentman.app`
   - SHA-1: (from command above)
4. Download `google-services.json`
5. Replace existing file

#### 3. Backend Environment

**File**: `backend/.env`

**Required**:
```env
SUPABASE_URL=https://uoekolfgbbmvhzsfkjef.supabase.co
SUPABASE_SERVICE_KEY=your_actual_service_key_here
PORT=8080
NODE_ENV=production
```

**Get Supabase key**:
1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Project Settings → API
3. Copy "service_role" secret key

---

## 🔨 Build Instructions

### Option 1: Automated Build (Recommended)

```bash
cd rentman-app
.\fix_all.bat
```

This script:
1. Kills zombie processes (Java, Node, Gradle)
2. Cleans build directories
3. Installs dependencies
4. Verifies assets
5. Generates Android project
6. Configures keystore
7. Builds release APK

### Option 2: Manual Build

```bash
cd rentman-app

# 1. Clean
npm run clean

# 2. Install
npm install

# 3. Prebuild
npx expo prebuild --platform android --clean

# 4. Build
npm run build:android
```

### Option 3: Development Build

```bash
cd rentman-app
npx expo run:android
```

---

## 🔍 Build Output

### Success

```
✓ Build Success!
APK: rentman-app/android/app/build/outputs/apk/release/app-release.apk
```

### Installation

```bash
# Via ADB
adb install android\app\build\outputs\apk\release\app-release.apk

# Or copy APK to device and install manually
```

---

## 🐛 Troubleshooting

### Issue: `npm install` fails

**Solution**: Should work now with `.npmrc`, but if it fails:
```bash
npm install --legacy-peer-deps --force
```

### Issue: EBUSY / File locking errors

**Cause**: Java/Gradle processes holding files

**Solution**: Run `fix_all.bat` which kills processes automatically

Or manually:
```bash
taskkill /F /IM java.exe
taskkill /F /IM gradle.exe
```

### Issue: Gradle build fails

**Solutions**:
1. Check Java is installed: `java -version`
2. Check Android SDK is installed
3. Clean gradle cache:
   ```bash
   cd rentman-app\android
   .\gradlew clean
   ```

### Issue: Google Sign-In error "Developer Error"

**Cause**: SHA-1 fingerprint not added to Firebase/Google Cloud

**Solution**:
1. Get SHA-1:
   ```bash
   keytool -list -v -keystore rentman.keystore -alias rentman_key -storepass rentman123
   ```
2. Add to Firebase Console → App Settings
3. Add to Google Cloud Console → Credentials

### Issue: Map doesn't display

**Cause**: Invalid or missing API key

**Solution**:
1. Verify API key in `app.json`
2. Check "Maps SDK for Android" is enabled
3. Check API key restrictions (package name + SHA-1)

---

## 📁 Project Structure

```
Rentman/
├── rentman-app/                    # Mobile App
│   ├── android/                   # Generated Android project
│   │   └── app/
│   │       ├── build.gradle       # ✅ Fixed signing config
│   │       └── google-services.json # ⚠️ Needs real config
│   ├── app/                       # React Native app code
│   ├── assets/                    # Images, fonts
│   ├── components/                # Reusable components
│   ├── services/                  # API clients
│   ├── app.json                   # ⚠️ Needs Maps API key (line 34)
│   ├── package.json               # ✅ Fixed dependencies
│   ├── .npmrc                     # ✅ New - fixes dep conflicts
│   ├── rentman.keystore           # Production signing key
│   ├── fix_all.bat               # ✅ Main repair script
│   └── fix_all.ps1               # ✅ PowerShell version
│
├── backend/                       # API Server
│   ├── src/                      # Source code
│   ├── .env                      # ⚠️ Needs Supabase keys
│   ├── package.json              # Dependencies
│   ├── Dockerfile                # Cloud Run deployment
│   └── cloudbuild.yaml           # GCP build config
│
├── supabase/                     # Database
│   ├── migrations/               # SQL migrations
│   └── functions/                # Edge functions
│
├── REPAIR_SUMMARY.md             # ✅ What was fixed
├── CONFIGURATION_CHECKLIST.md    # ✅ What needs config
├── check_config.bat              # ✅ Configuration checker
└── README.md                     # This file
```

---

## 🔐 Credentials Reference

### Keystore
- **File**: `rentman-app/rentman.keystore`
- **Alias**: `rentman_key`
- **Password**: `rentman123`
- **Type**: RSA 2048-bit

### Package Info
- **Package**: `com.rentman.app`
- **App Name**: Rentman
- **Version**: 1.0.0

### OAuth
- **Client ID**: Found in `client_secret_*.json` files
- **Project**: agent-gen-1

---

## 📚 Additional Documentation

- `REPAIR_SUMMARY.md` - Detailed list of fixes applied
- `CONFIGURATION_CHECKLIST.md` - Step-by-step configuration guide
- `HANDOFF_TO_DEV.md.resolved` - Original handoff document
- `backend/README.md` - Backend API documentation
- `rentman-app/BUILD_GUIDE.md` - Build process details

---

## 🎯 Next Steps

1. ✅ Run `check_config.bat` to see what needs configuration
2. ✅ Update Google Maps API Key in `app.json`
3. ✅ Replace `google-services.json` with real Firebase config
4. ✅ Configure backend `.env` with Supabase keys
5. ✅ Run `fix_all.bat` to build the app
6. ✅ Test on Android device

---

## 📞 Support

If you encounter issues:

1. Check `CONFIGURATION_CHECKLIST.md`
2. Check `REPAIR_SUMMARY.md`
3. Run `check_config.bat` for diagnostics
4. Check error logs in:
   - `rentman-app/build-log.txt`
   - `rentman-app/android/app/build/outputs/logs/`

---

## ✨ Status Summary

| Component | Status | Action Required |
|-----------|--------|-----------------|
| Build Scripts | ✅ Fixed | None |
| Dependency Management | ✅ Fixed | None |
| Signing Configuration | ✅ Fixed | None |
| Google Maps API | ⚠️ Placeholder | Add real API key |
| Firebase Config | ⚠️ Placeholder | Add real config |
| Backend Environment | ⚠️ Unknown | Check `.env` file |

---

**Last Updated**: 2026-02-06  
**Status**: Ready for configuration and build  
**Tested**: Windows 11, Node 18+, Java 17+

🎉 **The build infrastructure is fixed and ready to use!**
