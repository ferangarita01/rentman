# 🚀 Quick Start - Sarah Habit Coach

## ✅ Health Check

```powershell
.\health-check.ps1
```

This verifies:
- ✅ Node.js & npm
- ✅ Java JDK
- ✅ ADB (Android Debug Bridge)
- ✅ Project structure
- ✅ Dependencies installed

---

## 🎨 Theme Mode (Dark/Light)

### Test in Browser:
```bash
npm run dev
# Visit http://localhost:3000/settings
# Toggle the theme switch
```

### How It Works:
- **ThemeContext** detects system preference
- Saves to localStorage
- Applies `.dark` class to `<html>`
- All components respond to `isDark` prop

### Files:
- `src/contexts/ThemeContext.tsx` - Theme state management
- `src/components/ThemeToggle.tsx` - Toggle UI component
- `src/app/globals.css` - CSS variables (light & dark)

---

## 📱 Android Deployment

### Prerequisites:
1. **Android device** with USB Debugging enabled
2. **USB cable** connected to PC
3. **ADB** installed (via Android Studio)

### Enable USB Debugging:
```
Settings → About Phone
Tap "Build Number" 7 times
Settings → Developer Options
Enable "USB Debugging"
```

### Deploy Commands:

#### Option 1: PowerShell Script (Recommended)
```powershell
# Full deployment (build + install + launch)
.\deploy-android.ps1 -Action run

# Just build APK
.\deploy-android.ps1 -Action build

# Clean build cache
.\deploy-android.ps1 -Action clean

# View logs
.\deploy-android.ps1 -Action logs
```

#### Option 2: NPM Scripts
```bash
# Build + Install + Launch
npm run android:run

# Build only
npm run android:build

# Install existing APK
npm run android:install

# View logs
npm run android:logcat
```

---

## 🔧 Development Workflow

### 1. Make Code Changes
Edit files in `src/`

### 2. Test in Browser
```bash
npm run dev
```
Visit: `http://localhost:3000`

### 3. Test on Android
```powershell
.\deploy-android.ps1 -Action run
```

### 4. Debug Issues
```powershell
# View Android logs
.\deploy-android.ps1 -Action logs

# Or use Chrome DevTools
# chrome://inspect
```

---

## 📂 Project Structure

```
pwa/
├── src/
│   ├── app/                    # Next.js pages
│   │   ├── page.tsx           # Home (habits list)
│   │   ├── sarah/             # Sarah voice assistant
│   │   ├── progress/          # Stats & insights
│   │   └── settings/          # User settings
│   ├── components/            # React components
│   │   ├── gadgets/           # Inline gadgets (habit creator, etc.)
│   │   ├── ThemeToggle.tsx
│   │   └── SarahEmbeddedVoice.tsx
│   └── contexts/              # React contexts
│       ├── ThemeContext.tsx
│       ├── AuthContext.tsx
│       └── SarahContext.tsx
├── android/                    # Capacitor Android project
├── out/                        # Next.js static export (gitignored)
├── package.json               # Dependencies & scripts
├── capacitor.config.ts        # Capacitor configuration
├── next.config.ts             # Next.js config (static export)
├── deploy-android.ps1         # Deployment automation
└── health-check.ps1           # System verification
```

---

## 🐛 Troubleshooting

### ❌ "adb: device not found"
**Solution:**
```bash
# Restart ADB server
adb kill-server
adb start-server

# Verify device
adb devices
```

### ❌ "INSTALL_FAILED_UPDATE_INCOMPATIBLE"
**Solution:**
```bash
# Uninstall old version
adb uninstall com.sarah.habitcoach

# Reinstall
npm run android:install
```

### ❌ Theme not changing
**Solution:**
```bash
# Clear browser cache
# Or in DevTools: Application → Storage → Clear site data

# On Android: Clear app data
adb shell pm clear com.sarah.habitcoach
```

### ❌ Gradle build fails
**Solution:**
```powershell
# Clean build cache
.\deploy-android.ps1 -Action clean

# Rebuild
.\deploy-android.ps1 -Action build
```

---

## 📦 Build Outputs

| Build Type | Location |
|------------|----------|
| Next.js Static | `/out` |
| Debug APK | `/android/app/build/outputs/apk/debug/app-debug.apk` |
| Release APK | `/android/app/build/outputs/apk/release/app-release.apk` |

---

## 🌐 Environment Variables

Create `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

---

## 🎯 Key Features Implemented

### ✅ "3 Avisos" Strategy
- **Aviso 1:** SarahStatusBar (global background indicator)
- **Aviso 2:** SarahHeader (embedded in Sarah screen)
- **Aviso 3:** Dynamic Gadgets (inline habit creator)

### ✅ Dark/Light Mode
- System preference detection
- Manual toggle in Settings
- CSS variable-based theming
- localStorage persistence

### ✅ Android Deployment
- Static export via Next.js
- Capacitor integration
- PowerShell automation
- ADB installation via USB

---

## 📖 Documentation

- `ANDROID_DEPLOYMENT.md` - Complete Android guide
- `THREE_AVISOS_IMPLEMENTATION.md` - UI strategy details
- `THEME_AND_DEPLOYMENT_FIX.md` - Recent fixes summary

---

## 🚀 Next Steps

### For Development:
```bash
# 1. Run health check
.\health-check.ps1

# 2. Test in browser
npm run dev

# 3. Deploy to Android
.\deploy-android.ps1 -Action run
```

### For Production:
```bash
# Generate release keystore (first time)
cd android/app
keytool -genkeypair -v -keystore sarah-release.keystore -alias sarah -keyalg RSA -keysize 2048 -validity 10000

# Build release APK
cd android
.\gradlew assembleRelease

# Build AAB for Google Play
.\gradlew bundleRelease
```

---

## 📊 Status

| Feature | Status |
|---------|--------|
| Dark/Light Mode | 🟢 Working |
| Theme Persistence | 🟢 Working |
| Android Build | 🟢 Ready |
| APK Install | 🟢 Automated |
| 3 Avisos Strategy | 🟢 Implemented |
| Gadgets System | 🟢 Working |

---

**Need Help?**
- Run `.\health-check.ps1` to diagnose issues
- Check `ANDROID_DEPLOYMENT.md` for detailed troubleshooting
- View logs: `.\deploy-android.ps1 -Action logs`

**Status:** 🟢 **PRODUCTION READY**
