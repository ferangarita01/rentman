# 🚀 Rentman Unified Production Deployment Roadmap

**Status:** ✅ READY TO DEPLOY  
**Target Launch:** 2026-02-09  
**Platform:** Google Cloud Run + Play Store + NPM

---

## 📋 Pre-Flight Checklist Complete


### ✅ Security Audit
- [x] All secrets in Google Cloud Secret Manager
- [x] No hardcoded keys in repository
- [x] Android signing via environment variables
- [x] OAuth credentials backed up securely

### ✅ Architecture
- [x] Backend with Secret Manager integration
- [x] Agent Gateway professional TypeScript
- [x] Mobile app optimized (minifyEnabled)
- [x] CLI using Conf storage
- [x] Dashboard cleaned up

### ✅ Legal & Analytics
- [x] Privacy Policy + Terms of Service
- [x] Google Analytics 4 + GTM configured

---

## 🎯 Deployment Sequence

### Phase 1: Deploy Backend (30 min)

```powershell
cd C:\Users\Natan\Documents\predict\Rentman\apps\backend

# Verify secrets
.\manage-secrets.ps1 list
# Expected: ✅ STRIPE_SECRET_KEY, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, WEBHOOK_SECRET

# Deploy
.\deploy.ps1
# URL: https://rentman-brain-1021032187840.us-central1.run.app

# Test
curl https://rentman-brain-1021032187840.us-central1.run.app/health
```

---

### Phase 2: Deploy Agent Gateway (15 min)

```powershell
cd C:\Users\Natan\Documents\predict\Rentman\apps\agent-gateway

npm run build

gcloud run deploy agent-gateway `
  --source . `
  --project agent-gen-1 `
  --region us-central1 `
  --allow-unauthenticated

# Test
curl https://agent-gateway-1021032187840.us-central1.run.app/v1/health
curl https://agent-gateway-1021032187840.us-central1.run.app/docs/json
```

---

### Phase 3: Build Mobile (Play Store) (45 min)

```powershell
cd C:\Users\Natan\Documents\predict\Rentman\apps\mobile

# Set signing variables
$env:RELEASE_KEYSTORE_FILE = "C:\path\to\release.keystore"
$env:RELEASE_KEYSTORE_PASSWORD = "your_password"
$env:RELEASE_KEY_ALIAS = "release"
$env:RELEASE_KEY_PASSWORD = "your_password"

# Build AAB
.\build-playstore.ps1
# Output: rentman-v1.1.0-playstore.aab (15MB)
```

**Upload to Play Console:**
1. https://play.google.com/console
2. Production → Create new release
3. Upload AAB
4. Add release notes
5. Rollout to Production

---

### Phase 4: Deploy Dashboard (15 min)

```powershell
cd C:\Users\Natan\Documents\predict\Rentman\apps\dashboard

npm run build
vercel --prod

# Verify
curl https://rentman-dashboard.vercel.app
```

---

### Phase 5: Publish CLI (10 min)

```powershell
cd C:\Users\Natan\Documents\predict\Rentman\apps\cli

npm publish

# Test
npm install -g rentman-cli
rentman --version
```

---

## 🧪 Post-Deployment Testing

### Health Checks
```powershell
# Backend
curl https://rentman-brain-1021032187840.us-central1.run.app/health

# Gateway
curl https://agent-gateway-1021032187840.us-central1.run.app/v1/health
```

### Complete User Flow
1. ✅ Mobile: Login → Create Task
2. ✅ Mobile: Accept Task → Complete
3. ✅ Backend: AI verifies proof
4. ✅ Stripe: Payment processed

---

## 📊 Monitoring

### Cloud Run Logs
```powershell
gcloud run services logs read rentman-brain --project=agent-gen-1 --limit=50
gcloud run services logs read agent-gateway --project=agent-gen-1 --limit=50
```

### Dashboards
- **Stripe:** https://dashboard.stripe.com
- **Google Analytics:** https://analytics.google.com
- **Supabase:** https://app.supabase.com/project/uoekolfgbbmvhzsfkjef
- **Play Console:** https://play.google.com/console

---

## 🚨 Rollback Procedures

### Backend/Gateway
```powershell
gcloud run services update-traffic rentman-brain `
  --to-revisions=<previous-revision>=100
```

### Mobile
- Play Console → Halt rollout

### Secrets
```powershell
cd apps\backend
.\manage-secrets.ps1 update STRIPE_SECRET_KEY "<new_key>"
.\deploy.ps1
```

---

## 🎯 Success Metrics

| Metric | Target |
|--------|--------|
| App Rating | ≥ 4.0 ⭐ |
| DAU | 100+ |
| Uptime | ≥ 99.9% |
| AI Success | ≥ 95% |
| Payment Success | ≥ 99% |

---

## 🎉 Launch Day Checklist

**09:00** - Pre-launch verification  
**10:00** - Deploy cloud services  
**11:00** - Upload mobile AAB  
**12:00** - Deploy dashboard  
**14:00** - Publish CLI  
**15:00** - Final testing  
**16:00** - **GO LIVE! 🚀**

---

**Prepared:** 2026-02-08  
**Launch:** 2026-02-09  
**Status:** ✅ PRODUCTION READY

**Let's ship it! 🚀**
