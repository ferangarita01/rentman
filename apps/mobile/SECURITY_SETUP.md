# Security Setup Guide - Rentman Mobile

## 🔐 Environment Variables Configuration

### Development Setup

1. Copy `.env.example` to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```

2. Fill in your Supabase credentials in `.env.local`

### Production Build (Android Release)

The release APK signing now uses **environment variables** instead of hardcoded passwords.

#### Option 1: Local Build (PowerShell)
```powershell
$env:RENTMAN_KEYSTORE_PASSWORD = "your_keystore_password"
$env:RENTMAN_KEY_ALIAS = "rentman"
$env:RENTMAN_KEY_PASSWORD = "your_key_password"
npm run android:release
```

#### Option 2: Local Build (Bash/Linux/macOS)
```bash
export RENTMAN_KEYSTORE_PASSWORD="your_keystore_password"
export RENTMAN_KEY_ALIAS="rentman"
export RENTMAN_KEY_PASSWORD="your_key_password"
npm run android:release
```

#### Option 3: CI/CD (GitHub Actions)

Add these secrets in your GitHub repository settings:
- `RENTMAN_KEYSTORE_PASSWORD`
- `RENTMAN_KEY_ALIAS`
- `RENTMAN_KEY_PASSWORD`

Example workflow step:
```yaml
- name: Build Release APK
  env:
    RENTMAN_KEYSTORE_PASSWORD: ${{ secrets.RENTMAN_KEYSTORE_PASSWORD }}
    RENTMAN_KEY_ALIAS: ${{ secrets.RENTMAN_KEY_ALIAS }}
    RENTMAN_KEY_PASSWORD: ${{ secrets.RENTMAN_KEY_PASSWORD }}
  run: npm run android:release
```

## 🛡️ Security Improvements Implemented

### 1. Build Configuration (`android/app/build.gradle`)
- ✅ Removed hardcoded passwords
- ✅ Using `System.getenv()` for credentials
- ✅ Enabled `minifyEnabled true` for code obfuscation

### 2. Supabase Client (`src/lib/supabase.ts`)
- ✅ Removed hardcoded fallback credentials
- ✅ Strict environment variable checking
- ✅ Throws error if env vars are missing
- ✅ Console logs only in development mode

### 3. Auth Page (`src/app/auth/page.tsx`)
- ✅ Removed Global Click Logger (performance impact)
- ✅ Removed excessive console.log statements
- ✅ Development-only logging with `NODE_ENV` check

## ⚠️ Important Notes

1. **Never commit** `.env.local` to git (already in `.gitignore`)
2. **Never hardcode** credentials in source code
3. **Always use** environment variables for sensitive data
4. **Keep** `.env.example` up to date as documentation

## 🔄 Migration from Old Setup

If you have the old hardcoded credentials:

1. **Remove** them from `build.gradle` (already done)
2. **Set** environment variables before building
3. **Verify** build works with new setup
4. **Update** your CI/CD pipelines

## 📋 Verification Checklist

- [ ] `.env.local` exists and has correct values
- [ ] Environment variables set for release builds
- [ ] No hardcoded credentials in code
- [ ] `minifyEnabled true` in build.gradle
- [ ] Production logs removed or gated by `NODE_ENV`

## 🆘 Troubleshooting

### "Keystore password is empty"
- Make sure environment variables are set before running build
- Check variable names are exact (case-sensitive)

### "Missing Supabase environment variables"
- Copy `.env.example` to `.env.local`
- Fill in correct Supabase URL and Anon Key

### Build fails with ProGuard errors
- Check `android/app/proguard-rules.pro` for missing rules
- Common fix: Add `-dontwarn` rules for problematic libraries

## 📞 Support

For security concerns, contact: security@rentman.app
