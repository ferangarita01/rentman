# ⚡ ESCROW SYSTEM - QUICK DEPLOYMENT CHECKLIST

## Pre-requisitos
- [ ] Google Cloud CLI configurado
- [ ] Acceso a Supabase Dashboard
- [ ] Acceso a Stripe Dashboard
- [ ] Node.js y npm instalados

---

## 📋 Deployment Steps (30 minutos)

### 1. Database (5 min)
```bash
# 1. Abrir Supabase Dashboard > SQL Editor
# 2. Copiar apps/dashboard/supabase/migrations/004_escrow_system.sql
# 3. Ejecutar

# 4. Crear Storage Bucket
# Ir a Storage > Create bucket
# Name: task-proofs
# Public: Yes
# Max size: 10MB
```
- [ ] Migration ejecutada
- [ ] Bucket creado
- [ ] Tablas verificadas

### 2. Stripe (10 min)
```bash
# 1. Habilitar Stripe Connect
# Dashboard > Connect > Get started

# 2. Configurar webhooks
# Endpoint: https://YOUR_BACKEND_URL/webhooks/stripe
# Events: payment_intent.succeeded, transfer.created

# 3. Guardar webhook secret
gcloud secrets create STRIPE_WEBHOOK_SECRET --data-file=-
# (paste secret and press Ctrl+D)
```
- [ ] Connect habilitado
- [ ] Webhooks configurados
- [ ] Secret guardado

### 3. Backend Deploy (10 min)
```bash
cd apps/backend

# Deploy
gcloud run deploy rentman-backend \
    --source . \
    --platform managed \
    --region us-central1 \
    --allow-unauthenticated \
    --memory 512Mi \
    --timeout 60s

# Get URL
gcloud run services describe rentman-backend \
    --region us-central1 \
    --format 'value(status.url)'
```
- [ ] Backend deployed
- [ ] URL obtenida
- [ ] Health check OK

### 4. Cron Setup (5 min)
```bash
# Create service account
gcloud iam service-accounts create cloud-scheduler-invoker

# Grant permissions
gcloud run services add-iam-policy-binding rentman-backend \
    --region us-central1 \
    --member serviceAccount:cloud-scheduler-invoker@agent-gen-1.iam.gserviceaccount.com \
    --role roles/run.invoker

# Create cron job
BACKEND_URL=$(gcloud run services describe rentman-backend --region us-central1 --format 'value(status.url)')

gcloud scheduler jobs create http auto-approve-proofs \
    --schedule="0 * * * *" \
    --uri="$BACKEND_URL/api/cron/auto-approve" \
    --http-method=POST \
    --oidc-service-account-email=cloud-scheduler-invoker@agent-gen-1.iam.gserviceaccount.com \
    --location=us-central1

# Test manually
gcloud scheduler jobs run auto-approve-proofs --location=us-central1
```
- [ ] Service account creado
- [ ] Cron job creado
- [ ] Test manual exitoso

### 5. Mobile App (opcional - si deployeas)
```bash
cd apps/mobile

# Update .env.local with production backend URL
echo "NEXT_PUBLIC_BACKEND_URL=$BACKEND_URL" >> .env.local

# Build
npm install
npm run build
npx cap sync

# Open in Android Studio
npx cap open android
```
- [ ] Environment actualizado
- [ ] Build exitoso
- [ ] App abierta en Android Studio

---

## ✅ Verification (5 min)

### Database Check
```sql
-- Run in Supabase SQL Editor
SELECT table_name FROM information_schema.tables 
WHERE table_name IN ('escrow_transactions', 'task_proofs');

-- Should return 2 rows
```

### Backend Check
```bash
curl https://YOUR_BACKEND_URL/
# Should return: "Rentman Backend is Active 🧠"

curl https://YOUR_BACKEND_URL/api/escrow/status/test
# Should return 404 (expected)
```

### Cron Check
```bash
gcloud logging read \
    "resource.type=cloud_scheduler_job AND resource.labels.job_id=auto-approve-proofs" \
    --limit=1
```

---

## 🧪 Quick Test (opcional)

### Test Flow
```bash
cd apps/backend
.\test-escrow.ps1
```

O manualmente:
```bash
# 1. Lock escrow
curl -X POST "$BACKEND_URL/api/escrow/lock" \
  -H "Content-Type: application/json" \
  -d '{"taskId":"TEST_ID","humanId":"USER_ID"}'

# 2. Upload proof
curl -X POST "$BACKEND_URL/api/proofs/upload" \
  -H "Content-Type: application/json" \
  -d '{"taskId":"TEST_ID","humanId":"USER_ID","proofType":"photo","title":"Test"}'

# 3. Check status
curl "$BACKEND_URL/api/escrow/status/TEST_ID"
```

---

## 📊 Post-Deployment

### Monitor Logs
```bash
# Backend logs
gcloud logging read "resource.type=cloud_run_revision" --limit=10

# Cron logs
gcloud logging read "resource.type=cloud_scheduler_job" --limit=5
```

### Stripe Dashboard
- [ ] Check PaymentIntents en test mode
- [ ] Verify Connect is enabled
- [ ] Test webhook delivery

### Supabase Dashboard
- [ ] Check table data
- [ ] Monitor Storage usage
- [ ] Review RLS policies active

---

## 🚨 Troubleshooting

### Error: "Escrow not found"
```sql
-- Check if escrow_transactions table exists
SELECT COUNT(*) FROM escrow_transactions;
```

### Error: "Failed to upload proof"
```bash
# Check backend logs
gcloud logging read "textPayload=~'proof'" --limit=5
```

### Error: "Cron not running"
```bash
# Check job status
gcloud scheduler jobs describe auto-approve-proofs --location=us-central1

# Pause and resume
gcloud scheduler jobs pause auto-approve-proofs --location=us-central1
gcloud scheduler jobs resume auto-approve-proofs --location=us-central1
```

---

## 🎯 Success Criteria

✅ All checks passed:
- [ ] Database tables created
- [ ] Backend responding
- [ ] Cron job scheduled
- [ ] Stripe webhooks configured
- [ ] Mobile app builds

✅ Test flow completed:
- [ ] Can lock escrow
- [ ] Can upload proof
- [ ] Can get status
- [ ] Can approve proof
- [ ] Can release payment

---

## 📞 Next Steps After Deployment

1. **Add Monitoring**
   - Setup alerts in Cloud Monitoring
   - Configure error tracking (Sentry)

2. **User Testing**
   - Create test accounts
   - Run full contract flow
   - Verify payments in Stripe

3. **Documentation**
   - Update user guides
   - Create video tutorials
   - FAQ for common issues

4. **Team Training**
   - Demo to support team
   - Walkthrough dispute process
   - Review admin controls

---

## 📚 Reference Docs

- Full Implementation: `ESCROW_IMPLEMENTATION_COMPLETE.md`
- Deployment Guide: `apps/backend/PRODUCTION_DEPLOYMENT.md`
- Cron Setup: `apps/backend/CRON_SETUP.md`
- Testing Guide: `apps/backend/test-escrow.ps1`

---

**Estimated Total Time:** 30-40 minutes  
**Difficulty:** Medium  
**Prerequisites:** Admin access to all platforms  

🎉 **Ready to deploy!**
