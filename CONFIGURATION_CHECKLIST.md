# Rentman Project - Configuration Checklist

## 🎯 CRITICAL CONFIGURATIONS NEEDED

### 1. Mobile App (rentman-app)

#### ✅ Google Maps API Key
**File**: `rentman-app/app.json`  
**Line**: 34

**Current**:
```json
"googleMaps": {
  "apiKey": "TU_API_KEY_AQUI"
}
```

**Action**: Replace with real Google Maps API key

**Steps**:
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select project "agent-gen-1" or create new one
3. Enable "Maps SDK for Android"
4. Go to "Credentials"
5. Create API Key
6. Restrict key to Android apps
7. Add package name: `com.rentman.app`
8. Add SHA-1 fingerprint (see below)
9. Copy API key and update app.json

**Get SHA-1 fingerprint**:
```bash
keytool -list -v -keystore rentman-app\rentman.keystore -alias rentman_key -storepass rentman123
```

---

#### ✅ Firebase / Google Services
**File**: `rentman-app/android/app/google-services.json`

**Current**: Placeholder file created

**Action**: Replace with real Firebase configuration

**Steps**:
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select project "agent-gen-1" or create new
3. Add Android app
   - Package name: `com.rentman.app`
   - App nickname: Rentman
   - SHA-1: (from command above)
4. Download `google-services.json`
5. Replace `rentman-app/android/app/google-services.json`

---

#### ✅ Environment Variables (if needed)
**File**: `rentman-app/.env` (create if doesn't exist)

**Recommended**:
```env
EXPO_PUBLIC_SUPABASE_URL=https://uoekolfgbbmvhzsfkjef.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
EXPO_PUBLIC_API_URL=https://your-backend-url.run.app
```

**Where to get values**:
- Supabase: [Supabase Dashboard](https://supabase.com/dashboard) → Settings → API
- Backend URL: Check `backend/README.md` or deployment logs

---

### 2. Backend (backend)

#### ✅ Environment Variables
**File**: `backend/.env`

**Check if exists**:
```bash
type backend\.env
```

**Should contain**:
```env
SUPABASE_URL=https://uoekolfgbbmvhzsfkjef.supabase.co
SUPABASE_SERVICE_KEY=your_service_role_key_here
PORT=8080
NODE_ENV=production
```

**Get Supabase Service Key**:
1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Settings → API
4. Copy "service_role" key (secret, not anon)

---

## 📋 VERIFICATION CHECKLIST

### Before Building

- [ ] Google Maps API Key updated in `app.json`
- [ ] Real `google-services.json` in place
- [ ] SHA-1 fingerprint added to Firebase Console
- [ ] SHA-1 fingerprint added to Google Cloud Console (for Maps)
- [ ] Backend `.env` file exists with real keys
- [ ] Supabase project is accessible
- [ ] Keystore file exists: `rentman-app/rentman.keystore`

### Build Process

- [ ] Run `rentman-app\fix_all.bat` successfully
- [ ] No errors during `npm install`
- [ ] `npx expo prebuild` completes successfully
- [ ] Gradle build completes without errors
- [ ] APK file created in correct location

### Post-Build Testing

- [ ] APK installs on Android device
- [ ] App launches without crashing
- [ ] Google Sign-In works
- [ ] Map displays correctly
- [ ] Backend API is reachable
- [ ] Location permissions work

---

## 🔐 SECURITY CHECKLIST

### Credentials to NEVER Commit

- [ ] `backend/.env` (add to .gitignore)
- [ ] `rentman-app/.env` (add to .gitignore)
- [ ] `rentman.keystore` (keep secure backup)
- [ ] `google-services.json` (sensitive if real)
- [ ] Any files with "secret" in name
- [ ] Service role keys

### Files Safe to Commit

- [x] `app.json` (after API key is added)
- [x] `package.json`
- [x] `.npmrc`
- [x] Build scripts (`.bat`, `.ps1`)
- [x] `.env.example` (template only)

---

## 🚀 DEPLOYMENT CHECKLIST

### Backend Deployment

- [ ] Backend deployed to Cloud Run
- [ ] Environment variables set in Cloud Run
- [ ] Service URL accessible
- [ ] Health check endpoint working: `GET /health`
- [ ] API docs accessible: `GET /docs`

### Mobile App Deployment

- [ ] APK signed with production keystore
- [ ] Version code incremented
- [ ] Play Store listing prepared (if applicable)
- [ ] Screenshots ready
- [ ] Privacy policy URL set
- [ ] Terms & conditions URL set

---

## 📞 IMPORTANT CONTACTS & LINKS

### Google Cloud Console
- Project: agent-gen-1
- URL: https://console.cloud.google.com/

### Firebase Console
- Project: agent-gen-1
- URL: https://console.firebase.google.com/

### Supabase Dashboard
- Project: (check backend/.env)
- URL: https://supabase.com/dashboard

### Repository
- Local: C:\Users\Natan\Documents\predict\Rentman

---

## 🐛 COMMON ISSUES & SOLUTIONS

### Issue: Google Sign-In fails with "Developer Error"
**Cause**: SHA-1 fingerprint not added to Firebase/Google Cloud

**Solution**:
1. Get SHA-1: `keytool -list -v -keystore rentman.keystore -alias rentman_key -storepass rentman123`
2. Add to Firebase Console → Project Settings → Your Android App
3. Add to Google Cloud Console → Credentials → OAuth 2.0 Client ID

### Issue: Map doesn't load
**Cause**: Invalid or missing API key

**Solution**:
1. Verify API key in app.json
2. Check Maps SDK for Android is enabled
3. Check API key restrictions

### Issue: Backend API not reachable
**Cause**: Wrong URL or service not deployed

**Solution**:
1. Check backend is deployed: `gcloud run services list`
2. Verify URL in mobile app
3. Check CORS settings in backend

---

## ✅ QUICK START

**For the impatient developer:**

```bash
# 1. Navigate to mobile app
cd rentman-app

# 2. Update configurations (see above)
# - app.json line 34
# - android/app/google-services.json

# 3. Run repair script
.\fix_all.bat

# 4. Build APK
cd android
.\gradlew assembleRelease

# 5. Install on device
adb install app\build\outputs\apk\release\app-release.apk
```

Done! 🎉

---

**Last Updated**: 2026-02-06  
**Status**: Configuration required before build
