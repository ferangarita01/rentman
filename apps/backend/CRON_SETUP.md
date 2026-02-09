# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Cloud Scheduler Configuration for Auto-Approve Cron
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## Setup Instructions

### 1. Create Cloud Scheduler Job

```bash
gcloud scheduler jobs create http auto-approve-proofs \
    --schedule="0 * * * *" \
    --uri="https://YOUR_CLOUD_RUN_URL/api/cron/auto-approve" \
    --http-method=POST \
    --oidc-service-account-email=YOUR_SERVICE_ACCOUNT@agent-gen-1.iam.gserviceaccount.com \
    --location=us-central1 \
    --headers="Content-Type=application/json" \
    --message-body='{"cron":"auto-approve"}'
```

### 2. Add Endpoint to server.js

Add this endpoint to handle the cron trigger:

```javascript
app.post('/api/cron/auto-approve', async (req, res) => {
    try {
        // Verify request is from Cloud Scheduler
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        console.log('⏰ Cron triggered: auto-approve');
        
        const { autoApproveExpiredProofs } = require('./cron-auto-approve');
        await autoApproveExpiredProofs();

        res.json({ success: true, message: 'Auto-approve completed' });
    } catch (error) {
        console.error('❌ Cron error:', error);
        res.status(500).json({ error: error.message });
    }
});
```

### 3. Schedule Configuration

- **Frequency:** Every hour (0 * * * *)
- **Timezone:** UTC
- **Retry:** 3 attempts with exponential backoff

### 4. Alternative: Run Locally for Testing

```bash
cd apps/backend
node cron-auto-approve.js
```

### 5. Monitor Cron Execution

```bash
# View scheduler logs
gcloud scheduler jobs describe auto-approve-proofs --location=us-central1

# View execution history
gcloud logging read "resource.type=cloud_scheduler_job AND resource.labels.job_id=auto-approve-proofs" --limit=10
```

## Notes

- Cron runs every hour to check for proofs pending > 24 hours
- System user ID used for auto-approvals: `00000000-0000-0000-0000-000000000000`
- Auto-approval triggers task completion check
- If all proofs approved, task status updates to COMPLETED
