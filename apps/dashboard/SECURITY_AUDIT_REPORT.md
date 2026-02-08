# Dashboard Production Readiness - Security Audit Report

## 🚨 Executive Summary

**Status:** 🔴 **CRITICAL - NOT PRODUCTION READY**  
**Security Grade:** **F**  
**Date:** 2026-02-08  
**Auditor:** GitHub Copilot CLI  

---

## 🔴 CRITICAL VULNERABILITIES (4)

### 1. ❌ Google OAuth Client Secrets Exposed

**Severity:** 🔴 **CRITICAL**  
**CVSS Score:** 9.1 (Critical)

**Files Exposed:**
- `client_secret_XXXXXX-XXXXXXXXX.apps.googleusercontent.com.json`
- `client_secret_XXXXXX-XXXXXXXXX.apps.googleusercontent.com.json`

**Exposed Credentials:**
```json
{
  "client_secret": "GOCSPX-REDACTED",
  "project_id": "agent-gen-1",
  "client_id": "XXXXXX-XXXXXXXXX.apps.googleusercontent.com"
}
```

**Impact:**
- ✅ OAuth hijacking attacks possible
- ✅ Unauthorized access to user accounts
- ✅ Phishing attacks via cloned OAuth flows
- ✅ Token theft and replay attacks

**Required Actions:**
1. **IMMEDIATE:** Revoke these OAuth credentials in Google Cloud Console
2. **IMMEDIATE:** Generate new credentials
3. **IMMEDIATE:** Remove files from repository
4. **IMMEDIATE:** Add to `.gitignore`
5. Move to secure environment variables

---

### 2. ❌ Vercel OIDC Token Leaked

**Severity:** 🔴 **HIGH**  
**CVSS Score:** 8.2 (High)

**File:** `.env.local`

**Exposed Token:**
```
VERCEL_OIDC_TOKEN="eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6Im1yay00..."
```

**Token Details:**
- Team: `oangaritas-projects`
- Project: `rentman-web`
- Environment: `development`
- Expires: 2026-02-08 (12 hours from issue)

**Impact:**
- ✅ Full deployment access to Vercel project
- ✅ Environment variable read/write
- ✅ Project settings modification
- ✅ Potential production deployment hijacking

**Required Actions:**
1. **IMMEDIATE:** Revoke token in Vercel dashboard
2. **IMMEDIATE:** Delete `.env.local`
3. **IMMEDIATE:** Remove from Git history
4. Regenerate with shorter expiration

---

### 3. ❌ Hardcoded Supabase Anon Key

**Severity:** 🔴 **CRITICAL**  
**CVSS Score:** 9.3 (Critical)

**File:** `src/lib/supabase.ts` (Line 4)

**Code:**
```typescript
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVvZWtvbGZnYmJtdmh6c2ZramVmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAzMjQzNzUsImV4cCI6MjA4NTkwMDM3NX0.DYxAxi4TTBLgdVruu8uGM3Jog7JZaplWqikAvI0EXvk';
```

**Also in:** `backend/src/lib/supabase.ts`

**Impact:**
- ✅ Direct database access from anywhere
- ✅ RLS policy bypass (if misconfigured)
- ✅ Data exfiltration possible
- ✅ Unauthorized queries and mutations

**Required Actions:**
1. **IMMEDIATE:** Remove hardcoded fallback
2. **IMMEDIATE:** Regenerate anon key in Supabase
3. Force strict environment variable usage
4. Add build-time validation

---

### 4. 🟡 Misplaced Android APK

**Severity:** 🟡 **MEDIUM**  
**CVSS Score:** 4.0 (Medium)

**File:** `app-release-latest.apk` (45.52 MB)

**Impact:**
- ✅ Repository bloat (slows CI/CD)
- ✅ Unnecessary storage costs
- ✅ Potential reverse engineering target
- ✅ Confusion in project structure

**Required Actions:**
1. Move to `dist/` or dedicated storage (S3, Cloud Storage)
2. Add `*.apk` to `.gitignore`
3. Use artifact storage system

---

## 🏗️ ARCHITECTURAL ISSUES

### 5. Backend Redundancy (Logic Drift Risk)

**Severity:** 🟡 **HIGH (Architecture)**

**Problem:**
The `apps/dashboard/backend` duplicates ~90% of functionality that should be in `apps/agent-gateway`.

**Current State:**
```
apps/dashboard/backend/
├── src/routes/tasks.ts       ← Duplicates agent-gateway
├── src/routes/bids.ts         ← Duplicates agent-gateway
├── src/routes/matching.ts     ← Duplicates agent-gateway
└── src/services/matching.ts   ← Business logic leak
```

**Risks:**
- ❌ Logic drift between dashboard and gateway
- ❌ Inconsistent validation
- ❌ Duplicate maintenance burden
- ❌ Security updates miss one service

**Recommendation:**
1. **Migrate all marketplace logic to `apps/agent-gateway`**
2. Dashboard becomes pure client (consumes gateway API)
3. Deprecate `apps/dashboard/backend`
4. Enforce single source of truth

---

## 📊 SECURITY SCORECARD

| Category | Score | Issues |
|----------|-------|--------|
| **Secrets Management** | **F** 🔴 | 3 critical leaks |
| **Access Control** | **D** 🟠 | OAuth exposed |
| **Architecture** | **C** 🟡 | Backend redundancy |
| **Git Hygiene** | **F** 🔴 | Secrets in repo |
| **Build Security** | **D** 🟠 | No validation |
| **Overall** | **F** 🔴 | **NOT READY** |

---

## 🔧 IMMEDIATE REMEDIATION PLAN

### Phase 1: Stop the Bleeding (1 hour)

**Priority 0 - Critical (Do NOW):**

1. **Revoke OAuth Credentials**
```bash
# Google Cloud Console
1. Go to: https://console.cloud.google.com/apis/credentials?project=agent-gen-1
2. Delete both OAuth 2.0 Client IDs
3. Create new credentials
4. Store in environment variables ONLY
```

2. **Revoke Vercel Token**
```bash
# Vercel Dashboard
1. Go to: https://vercel.com/oangaritas-projects/rentman-web/settings
2. Revoke OIDC token
3. Generate new with 1-hour expiration
```

3. **Regenerate Supabase Key**
```bash
# Supabase Dashboard
1. Go to: https://app.supabase.com/project/uoekolfgbbmvhzsfkjef/settings/api
2. Regenerate anon key
3. Update all environment variables
```

### Phase 2: Clean Repository (2 hours)

4. **Remove Compromised Files**
```bash
cd apps/dashboard

# Remove files
rm client_secret_*.json
rm .env.local
rm app-release-latest.apk

# Clean Git history
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch client_secret_*.json .env.local app-release-latest.apk" \
  --prune-empty --tag-name-filter cat -- --all

# Force push (DANGEROUS - coordinate with team)
git push origin --force --all
```

5. **Update .gitignore**
```gitignore
# OAuth Secrets
client_secret_*.json
.env.local
*.credentials.json

# Build Artifacts
*.apk
*.aab
*.ipa

# Vercel
.vercel
```

### Phase 3: Secure Configuration (3 hours)

6. **Remove Hardcoded Keys**

File: `src/lib/supabase.ts`
```typescript
// ❌ BEFORE
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJ...';

// ✅ AFTER
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseAnonKey) {
  throw new Error(
    'VITE_SUPABASE_ANON_KEY is required. Set it in .env file.'
  );
}
```

7. **Create .env.example**
```env
# Supabase
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here

# Google OAuth (Server-side only)
GOOGLE_CLIENT_ID=your_client_id
GOOGLE_CLIENT_SECRET=your_client_secret

# Agent Gateway
VITE_AGENT_GATEWAY_URL=https://agent-gateway.rentman.app/v1
```

8. **Add Build Validation**

File: `vite.config.ts`
```typescript
export default defineConfig({
  plugins: [
    react(),
    {
      name: 'validate-env',
      buildStart() {
        const required = [
          'VITE_SUPABASE_URL',
          'VITE_SUPABASE_ANON_KEY',
          'VITE_AGENT_GATEWAY_URL',
        ];
        
        const missing = required.filter(key => !process.env[key]);
        
        if (missing.length > 0) {
          throw new Error(
            `Missing required environment variables: ${missing.join(', ')}`
          );
        }
      },
    },
  ],
});
```

---

## 🏗️ ARCHITECTURAL REFACTOR

### Backend Migration Strategy

**Goal:** Single source of truth for marketplace logic

**Step 1: Identify Overlap**
```bash
# Compare routes
apps/dashboard/backend/src/routes/tasks.ts
apps/agent-gateway/src/routes/market/tasks.ts

# They should be identical functionality
```

**Step 2: Migrate to Gateway**
1. Move all marketplace routes to `apps/agent-gateway`
2. Add dashboard-specific endpoints if needed
3. Dashboard becomes pure API consumer

**Step 3: Update Dashboard**

File: `src/services/api.ts` (create)
```typescript
const GATEWAY_URL = import.meta.env.VITE_AGENT_GATEWAY_URL;

export async function getTasks() {
  const response = await fetch(`${GATEWAY_URL}/market/tasks`);
  return response.json();
}

export async function createTask(taskData) {
  const response = await fetch(`${GATEWAY_URL}/market/tasks`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(taskData),
  });
  return response.json();
}
```

**Step 4: Remove Backend**
```bash
rm -rf apps/dashboard/backend
```

---

## 📋 VERIFICATION CHECKLIST

### Security
- [ ] All OAuth secrets revoked and regenerated
- [ ] Vercel OIDC token revoked
- [ ] Supabase anon key regenerated
- [ ] Hardcoded keys removed
- [ ] .gitignore updated
- [ ] Git history cleaned
- [ ] No secrets in build output

### Architecture
- [ ] Backend logic migrated to gateway
- [ ] Dashboard uses gateway API
- [ ] No direct Supabase calls from frontend
- [ ] Build validation added

### Testing
- [ ] `npm run build` succeeds
- [ ] No missing environment variables
- [ ] Login flow works
- [ ] No console errors
- [ ] SEO validation passes

---

## 🎯 POST-REMEDIATION STATUS

**Target Security Grade:** A  
**Estimated Time:** 6-8 hours  
**Breaking Changes:** YES (requires new credentials)  
**Rollback Possible:** NO (security requirement)  

---

## 📞 INCIDENT RESPONSE

### If Credentials Already Compromised:

1. **Check logs for unauthorized access:**
   - Google Cloud Console audit logs
   - Vercel deployment logs
   - Supabase SQL logs

2. **Notify affected users** (if data breach detected)

3. **Enable 2FA** on all admin accounts

4. **Rotate all other credentials** as precaution

---

## 📚 REFERENCES

- [OWASP Top 10 - A07:2021 Identification and Authentication Failures](https://owasp.org/Top10/A07_2021-Identification_and_Authentication_Failures/)
- [Git Secrets Detection](https://github.com/awslabs/git-secrets)
- [Vercel Environment Variables Best Practices](https://vercel.com/docs/concepts/projects/environment-variables)

---

**Report Status:** ✅ **COMPLETE**  
**Next Action:** 🔴 **IMMEDIATE REMEDIATION REQUIRED**  
**Estimated Risk:** 🔴 **CRITICAL**

---

*This report must be kept confidential. Distribution limited to security team only.*
