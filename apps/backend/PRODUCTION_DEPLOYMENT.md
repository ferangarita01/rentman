# 🚀 ESCROW SYSTEM - PRODUCTION DEPLOYMENT GUIDE

## Pre-requisitos

- [x] Google Cloud CLI instalado y configurado
- [x] Acceso a Supabase Dashboard
- [x] Acceso a Stripe Dashboard
- [x] Permisos de admin en proyecto GCP

---

## Step 1: Database Migration (Supabase)

### 1.1 Apply Migration

```bash
# Opción A: Via Supabase Dashboard
# 1. Ir a Supabase Dashboard > SQL Editor
# 2. Copiar contenido de: apps/dashboard/supabase/migrations/004_escrow_system.sql
# 3. Ejecutar

# Opción B: Via CLI (si tienes Supabase CLI)
cd apps/dashboard
supabase db push
```

### 1.2 Create Storage Bucket

En Supabase Dashboard > Storage:

1. Crear nuevo bucket: `task-proofs`
2. Configuración:
   - **Public:** ✅ Yes
   - **File size limit:** 10 MB
   - **Allowed MIME types:** `image/*`, `video/*`, `application/pdf`

3. RLS Policy para bucket:
```sql
-- Allow authenticated users to upload to their task folders
CREATE POLICY "Users can upload proofs"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'task-proofs' AND
    auth.uid()::text = (storage.foldername(name))[1]
);

-- Anyone can view proofs (public bucket)
CREATE POLICY "Anyone can view proofs"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'task-proofs');
```

### 1.3 Verify Tables Created

```sql
-- Check tables exist
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('escrow_transactions', 'task_proofs');

-- Check RLS enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('escrow_transactions', 'task_proofs');
```

---

## Step 2: Stripe Setup

### 2.1 Stripe Connect Configuration

1. **Ir a:** https://dashboard.stripe.com/settings/connect
2. **Enable Stripe Connect**
3. **Platform Settings:**
   - Platform name: `Rentman`
   - Support email: `support@rentman.app`
   - Brand color: `#00ff88`

### 2.2 Create Connect Application

```bash
# Via Stripe CLI
stripe apps create rentman-connect \
    --type=standard \
    --country=US
```

O via Dashboard:
1. Settings > Connect > Platform Profile
2. Click "Create application"
3. Fill details

### 2.3 Configure Webhooks

**Endpoint URL:** `https://rentman-backend-XXXXX.run.app/webhooks/stripe`

**Events to subscribe:**
- `payment_intent.succeeded`
- `payment_intent.payment_failed`
- `transfer.created`
- `transfer.failed`
- `account.updated` (for Connect)

```bash
# Get webhook signing secret
stripe webhooks create \
    --url https://rentman-backend-XXXXX.run.app/webhooks/stripe \
    --events payment_intent.succeeded,transfer.created

# Save secret to Google Secret Manager
echo "whsec_YOUR_SECRET" | gcloud secrets create STRIPE_WEBHOOK_SECRET --data-file=-
```

---

## Step 3: Backend Deployment

### 3.1 Build and Deploy

```bash
cd apps/backend

# Deploy to Cloud Run
gcloud run deploy rentman-backend \
    --source . \
    --platform managed \
    --region us-central1 \
    --allow-unauthenticated \
    --memory 512Mi \
    --timeout 60s \
    --min-instances 0 \
    --max-instances 10 \
    --set-env-vars "NODE_ENV=production"
```

### 3.2 Verify Deployment

```bash
# Get service URL
gcloud run services describe rentman-backend \
    --region us-central1 \
    --format 'value(status.url)'

# Test health endpoint
curl https://rentman-backend-XXXXX.run.app/

# Should return: "Rentman Backend is Active 🧠"
```

### 3.3 Test Endpoints

```bash
# Get backend URL
BACKEND_URL=$(gcloud run services describe rentman-backend --region us-central1 --format 'value(status.url)')

# Test escrow status endpoint
curl "$BACKEND_URL/api/escrow/status/test-task-id"

# Should return 404 (expected, just testing endpoint is live)
```

---

## Step 4: Cloud Scheduler (Cron)

### 4.1 Create Service Account

```bash
# Create service account for Cloud Scheduler
gcloud iam service-accounts create cloud-scheduler-invoker \
    --display-name "Cloud Scheduler Invoker"

# Grant Cloud Run Invoker role
gcloud run services add-iam-policy-binding rentman-backend \
    --region us-central1 \
    --member serviceAccount:cloud-scheduler-invoker@agent-gen-1.iam.gserviceaccount.com \
    --role roles/run.invoker
```

### 4.2 Create Scheduler Job

```bash
# Get backend URL
BACKEND_URL=$(gcloud run services describe rentman-backend --region us-central1 --format 'value(status.url)')

# Create hourly cron job
gcloud scheduler jobs create http auto-approve-proofs \
    --schedule="0 * * * *" \
    --uri="$BACKEND_URL/api/cron/auto-approve" \
    --http-method=POST \
    --oidc-service-account-email=cloud-scheduler-invoker@agent-gen-1.iam.gserviceaccount.com \
    --location=us-central1 \
    --headers="Content-Type=application/json" \
    --message-body='{"cron":"auto-approve"}' \
    --time-zone="America/Los_Angeles"
```

### 4.3 Test Cron Job Manually

```bash
# Trigger job manually
gcloud scheduler jobs run auto-approve-proofs --location=us-central1

# Check logs
gcloud logging read \
    "resource.type=cloud_scheduler_job AND resource.labels.job_id=auto-approve-proofs" \
    --limit=5 \
    --format=json
```

---

## Step 5: Mobile App Update

### 5.1 Update Environment Variables

**File:** `apps/mobile/.env.local`

```bash
# Backend URL (production)
NEXT_PUBLIC_BACKEND_URL=https://rentman-backend-XXXXX.run.app

# Supabase (ya configurados)
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_ANON_KEY
```

### 5.2 Build Mobile App

```bash
cd apps/mobile

# Install dependencies
npm install

# Build Next.js
npm run build

# Sync with Capacitor
npx cap sync

# Open Android Studio
npx cap open android
```

### 5.3 Test on Device/Emulator

1. Run app from Android Studio
2. Navigate to Inbox > Contract
3. Test upload proof flow
4. Test approve/reject flow
5. Test payment release

---

## Step 6: Verification & Testing

### 6.1 Database Verification

```sql
-- Check escrow transactions
SELECT id, task_id, status, gross_amount, net_amount 
FROM escrow_transactions 
ORDER BY created_at DESC 
LIMIT 10;

-- Check proofs
SELECT id, task_id, proof_type, status, created_at 
FROM task_proofs 
ORDER BY created_at DESC 
LIMIT 10;

-- Check escrow summary view
SELECT * FROM escrow_summary;
```

### 6.2 End-to-End Test

**Scenario:** Complete contract flow

1. **Create test task:**
```sql
INSERT INTO tasks (title, description, task_type, budget_amount, status, requester_id)
VALUES ('Test Delivery', 'Test escrow system', 'delivery', 100.00, 'OPEN', 'YOUR_USER_ID');
```

2. **Accept task (via mobile or API):**
```bash
curl -X POST "$BACKEND_URL/api/escrow/lock" \
    -H "Content-Type: application/json" \
    -d '{"taskId":"TASK_ID","humanId":"HUMAN_ID"}'
```

3. **Upload proof (via mobile):**
   - Use mobile app
   - Click "Upload Proof"
   - Take photo or select file
   - Submit

4. **Approve proof:**
   - Login as requester
   - View proof
   - Click "Approve"

5. **Release payment:**
   - Click "Release Payment"
   - Verify transfer in Stripe Dashboard

6. **Verify completion:**
```sql
SELECT status, payment_status, completed_at 
FROM tasks 
WHERE id = 'TASK_ID';
```

### 6.3 Monitor Logs

```bash
# Backend logs
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=rentman-backend" \
    --limit=50 \
    --format=json

# Filter escrow-related logs
gcloud logging read "resource.type=cloud_run_revision AND textPayload=~'escrow|proof'" \
    --limit=20
```

---

## Step 7: Monitoring & Alerts

### 7.1 Setup Cloud Monitoring

```bash
# Create alert for escrow failures
gcloud alpha monitoring policies create \
    --notification-channels=CHANNEL_ID \
    --display-name="Escrow Release Failures" \
    --condition-display-name="Error rate > 5%" \
    --condition-threshold-value=5 \
    --condition-threshold-duration=60s
```

### 7.2 Stripe Monitoring

En Stripe Dashboard:
1. Configure webhook alerts
2. Set up email notifications for failed transfers
3. Monitor Connect account applications

### 7.3 Database Monitoring

En Supabase Dashboard:
1. Monitor query performance
2. Check storage usage for `task-proofs`
3. Review RLS policy hits

---

## Step 8: Rollback Plan

Si algo falla:

### 8.1 Rollback Backend

```bash
# List revisions
gcloud run revisions list --service rentman-backend --region us-central1

# Rollback to previous
gcloud run services update-traffic rentman-backend \
    --to-revisions=PREVIOUS_REVISION=100 \
    --region us-central1
```

### 8.2 Rollback Database

```bash
# Disable triggers
ALTER TABLE escrow_transactions DISABLE TRIGGER trigger_calculate_escrow_fees;

# Drop tables (CUIDADO!)
DROP TABLE IF EXISTS task_proofs CASCADE;
DROP TABLE IF EXISTS escrow_transactions CASCADE;

# Revert profile changes
ALTER TABLE profiles DROP COLUMN IF EXISTS stripe_connect_account_id;
```

### 8.3 Disable Cron

```bash
gcloud scheduler jobs pause auto-approve-proofs --location=us-central1
```

---

## Post-Deployment Checklist

- [ ] Database migration applied successfully
- [ ] Storage bucket created and configured
- [ ] Stripe Connect enabled and webhooks configured
- [ ] Backend deployed to Cloud Run
- [ ] Cloud Scheduler job created and tested
- [ ] Mobile app updated with production URLs
- [ ] End-to-end test completed successfully
- [ ] Monitoring and alerts configured
- [ ] Documentation updated
- [ ] Team notified of new features

---

## Support Contacts

**Database Issues:** Supabase Support  
**Payment Issues:** Stripe Support  
**Infrastructure:** GCP Support  
**Code Issues:** GitHub Issues

---

## Next Steps

1. **Stripe Connect Onboarding:**
   - Build UI for humans to connect Stripe accounts
   - Add webhook handler for `account.updated`
   - Test payout flow

2. **Enhanced Monitoring:**
   - Add Sentry for error tracking
   - Setup custom metrics in Cloud Monitoring
   - Create dashboard for escrow metrics

3. **User Documentation:**
   - Create help docs for proof upload
   - Add FAQ for dispute process
   - Video tutorial for requester approval flow

---

**Deployed by:** DevOps Team  
**Date:** 2026-02-09  
**Version:** v1.0.0  
**Status:** ✅ Ready for Production
