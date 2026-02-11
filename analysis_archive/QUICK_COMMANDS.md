# 🚀 ESCROW SYSTEM - QUICK COMMANDS REFERENCE

## Deployment Commands

### Database
```sql
-- Apply migration (Supabase SQL Editor)
-- Copy/paste: apps/dashboard/supabase/migrations/004_escrow_system.sql
-- Click "Run"
```

### Backend Deploy
```bash
cd apps/backend
gcloud run deploy rentman-backend --source . --region us-central1 --allow-unauthenticated
```

### Cron Setup
```bash
# Get backend URL
BACKEND_URL=$(gcloud run services describe rentman-backend --region us-central1 --format 'value(status.url)')

# Create cron job
gcloud scheduler jobs create http auto-approve-proofs \
    --schedule="0 * * * *" \
    --uri="$BACKEND_URL/api/cron/auto-approve" \
    --http-method=POST \
    --oidc-service-account-email=cloud-scheduler-invoker@agent-gen-1.iam.gserviceaccount.com \
    --location=us-central1
```

---

## Testing Commands

### Test Backend Health
```bash
BACKEND_URL="https://rentman-backend-XXXXX.run.app"
curl $BACKEND_URL/
```

### Test Escrow Lock
```bash
curl -X POST "$BACKEND_URL/api/escrow/lock" \
  -H "Content-Type: application/json" \
  -d '{"taskId":"TASK_ID","humanId":"HUMAN_ID"}'
```

### Test Proof Upload
```bash
curl -X POST "$BACKEND_URL/api/proofs/upload" \
  -H "Content-Type: application/json" \
  -d '{
    "taskId":"TASK_ID",
    "humanId":"HUMAN_ID",
    "proofType":"photo",
    "title":"Test Proof",
    "fileUrl":"https://example.com/photo.jpg"
  }'
```

### Test Escrow Status
```bash
curl "$BACKEND_URL/api/escrow/status/TASK_ID"
```

### Test Cron Manually
```bash
gcloud scheduler jobs run auto-approve-proofs --location=us-central1
```

---

## Monitoring Commands

### Backend Logs
```bash
# Last 20 entries
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=rentman-backend" --limit=20

# Escrow-specific logs
gcloud logging read "textPayload=~'escrow|proof'" --limit=10

# Errors only
gcloud logging read "severity>=ERROR" --limit=10
```

### Cron Logs
```bash
gcloud logging read "resource.type=cloud_scheduler_job AND resource.labels.job_id=auto-approve-proofs" --limit=5
```

### Cloud Run Status
```bash
# Get service URL
gcloud run services describe rentman-backend --region us-central1 --format='value(status.url)'

# Get revision history
gcloud run revisions list --service rentman-backend --region us-central1

# Get metrics
gcloud run services describe rentman-backend --region us-central1
```

---

## Database Queries

### Check Tables Created
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_name IN ('escrow_transactions', 'task_proofs');
```

### View Recent Escrows
```sql
SELECT 
    e.id,
    e.task_id,
    e.status,
    e.gross_amount / 100.0 as amount_usd,
    e.net_amount / 100.0 as net_usd,
    e.held_at,
    e.released_at
FROM escrow_transactions e
ORDER BY e.created_at DESC
LIMIT 10;
```

### View Recent Proofs
```sql
SELECT 
    p.id,
    p.task_id,
    p.proof_type,
    p.status,
    p.title,
    p.created_at,
    p.reviewed_at
FROM task_proofs p
ORDER BY p.created_at DESC
LIMIT 10;
```

### Check Auto-Approve Candidates
```sql
SELECT 
    id,
    task_id,
    title,
    created_at,
    NOW() - created_at as age
FROM task_proofs
WHERE status = 'pending'
AND created_at < NOW() - INTERVAL '24 hours';
```

### Escrow Summary by Status
```sql
SELECT 
    status,
    COUNT(*) as count,
    SUM(gross_amount) / 100.0 as total_gross,
    SUM(net_amount) / 100.0 as total_net
FROM escrow_transactions
GROUP BY status;
```

---

## Rollback Commands

### Rollback Backend
```bash
# List revisions
gcloud run revisions list --service rentman-backend --region us-central1

# Rollback to previous
gcloud run services update-traffic rentman-backend \
    --to-revisions=PREVIOUS_REVISION=100 \
    --region us-central1
```

### Pause Cron
```bash
gcloud scheduler jobs pause auto-approve-proofs --location=us-central1
```

### Resume Cron
```bash
gcloud scheduler jobs resume auto-approve-proofs --location=us-central1
```

### Delete Cron Job
```bash
gcloud scheduler jobs delete auto-approve-proofs --location=us-central1
```

---

## Maintenance Commands

### Update Backend
```bash
cd apps/backend
gcloud run deploy rentman-backend --source .
```

### Restart Service
```bash
# No direct restart, deploy new revision
gcloud run deploy rentman-backend --image IMAGE_URL --region us-central1
```

### Scale Down (save costs)
```bash
gcloud run services update rentman-backend \
    --min-instances=0 \
    --max-instances=1 \
    --region us-central1
```

### Scale Up (handle traffic)
```bash
gcloud run services update rentman-backend \
    --min-instances=1 \
    --max-instances=10 \
    --region us-central1
```

---

## Stripe Commands

### Test Webhook Locally
```bash
stripe listen --forward-to localhost:8080/webhooks/stripe
```

### Trigger Test Webhook
```bash
stripe trigger payment_intent.succeeded
```

### View Recent Events
```bash
stripe events list --limit=10
```

---

## Supabase CLI Commands

### Apply Migration
```bash
cd apps/dashboard
supabase db push
```

### Generate Types
```bash
supabase gen types typescript --local > types/supabase.ts
```

### Reset Database (DANGER!)
```bash
supabase db reset
```

---

## Mobile App Commands

### Build
```bash
cd apps/mobile
npm run build
npx cap sync
```

### Open Android Studio
```bash
npx cap open android
```

### Clean Build
```bash
rm -rf .next out node_modules
npm install
npm run build
```

---

## Debugging Commands

### Test Supabase Connection
```bash
node -e "
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
supabase.from('tasks').select('count').then(console.log);
"
```

### Test Vertex AI
```bash
curl -X POST "$BACKEND_URL/api/chat" \
  -H "Content-Type: application/json" \
  -d '{"message":"Test"}'
```

### Check Secrets
```bash
gcloud secrets versions access latest --secret="STRIPE_SECRET_KEY"
gcloud secrets versions access latest --secret="SUPABASE_URL"
```

---

## Quick Reference

### Backend URL
```bash
echo $BACKEND_URL
# or
gcloud run services describe rentman-backend --region us-central1 --format='value(status.url)'
```

### Supabase URL
```bash
echo $SUPABASE_URL
# Found in: apps/mobile/.env.local
```

### Project ID
```bash
gcloud config get-value project
# Should be: agent-gen-1
```

---

## Emergency Contacts

**Infrastructure Issues:**
```bash
# Check Cloud Status
open https://status.cloud.google.com/

# Check Supabase Status
open https://status.supabase.com/

# Check Stripe Status
open https://status.stripe.com/
```

**Support:**
- GCP: https://cloud.google.com/support
- Supabase: https://supabase.com/support
- Stripe: https://support.stripe.com

---

**Last Updated:** 2026-02-09  
**Maintained by:** DevOps Team
