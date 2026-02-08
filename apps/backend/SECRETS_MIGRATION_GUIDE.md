# 🔐 Google Cloud Secret Manager - Migration Guide

## Overview

This guide will help you migrate from local `.env` files to **Google Cloud Secret Manager** for production-grade secret management.

## Why Secret Manager?

✅ **Never store secrets locally or in Git**  
✅ **Automatic encryption at rest**  
✅ **Granular IAM permissions**  
✅ **Automatic rotation support**  
✅ **Audit logs for all access**  

---

## Prerequisites

1. **Google Cloud CLI installed**
   ```powershell
   gcloud --version
   ```

2. **Authenticated with correct account**
   ```powershell
   gcloud auth login
   ```

3. **Access to project: rentman-449419**
   ```powershell
   gcloud projects describe rentman-449419
   ```

---

## Step 1: Upload Secrets to Secret Manager

We've created an automated script for you:

```powershell
cd C:\Users\Natan\Documents\predict\Rentman\apps\backend
.\upload-secrets.ps1
```

### What this script does:

1. ✅ Reads secrets from `_SECRETS_BACKUP_20260208_132332\.env`
2. ✅ Uploads `STRIPE_SECRET_KEY` to Secret Manager
3. ✅ Generates and uploads `WEBHOOK_SECRET` (if not exists)
4. ✅ Uploads `SUPABASE_SERVICE_ROLE_KEY` (if exists)

### Manual Upload (if needed)

If you prefer to upload manually or add new secrets:

```powershell
# Upload Stripe Secret Key
echo "sk_test_REDACTED_YOUR_STRIPE_KEY" | `
  gcloud secrets create stripe-secret-key --data-file=- --project=rentman-449419

# Generate and upload Webhook Secret
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))" | `
  gcloud secrets create webhook-secret --data-file=- --project=rentman-449419

# Upload Supabase Service Role Key (get from Supabase Dashboard)
echo "YOUR_SUPABASE_SERVICE_ROLE_KEY" | `
  gcloud secrets create supabase-service-role-key --data-file=- --project=rentman-449419
```

---

## Step 2: Verify Secrets

List all secrets in your project:

```powershell
gcloud secrets list --project=rentman-449419
```

Expected output:
```
NAME                          CREATED              REPLICATION_POLICY  LOCATIONS
stripe-secret-key             2026-02-08T...      automatic           -
webhook-secret                2026-02-08T...      automatic           -
supabase-service-role-key     2026-02-08T...      automatic           -
```

---

## Step 3: Grant Cloud Run Service Account Access

The Cloud Run service needs permission to read these secrets:

```powershell
$PROJECT_ID = "rentman-449419"
$SERVICE_ACCOUNT = "${PROJECT_ID}@appspot.gserviceaccount.com"

# Grant access to each secret
gcloud secrets add-iam-policy-binding stripe-secret-key `
  --member="serviceAccount:${SERVICE_ACCOUNT}" `
  --role="roles/secretmanager.secretAccessor" `
  --project=$PROJECT_ID

gcloud secrets add-iam-policy-binding webhook-secret `
  --member="serviceAccount:${SERVICE_ACCOUNT}" `
  --role="roles/secretmanager.secretAccessor" `
  --project=$PROJECT_ID

gcloud secrets add-iam-policy-binding supabase-service-role-key `
  --member="serviceAccount:${SERVICE_ACCOUNT}" `
  --role="roles/secretmanager.secretAccessor" `
  --project=$PROJECT_ID
```

---

## Step 4: Deploy to Cloud Run

The `deploy.ps1` script is already configured to use Secret Manager:

```powershell
.\deploy.ps1
```

This will:
1. ✅ Validate all secrets exist
2. ✅ Build Docker container
3. ✅ Deploy to Cloud Run with secrets mounted as environment variables

### How it works:

The deploy script uses `--set-secrets` flag:

```powershell
gcloud run deploy rentman-backend `
  --set-secrets="STRIPE_SECRET_KEY=stripe-secret-key:latest,
                 WEBHOOK_SECRET=webhook-secret:latest,
                 SUPABASE_SERVICE_ROLE_KEY=supabase-service-role-key:latest"
```

Cloud Run automatically:
- Fetches the latest version of each secret
- Mounts them as environment variables in the container
- Rotates them when you update the secret version

---

## Step 5: Clean Up Local Secrets

After successful deployment, remove local `.env` files:

```powershell
# The backup is safe in _SECRETS_BACKUP_20260208_132332
# But we don't need .env anymore
Remove-Item .env -ErrorAction SilentlyContinue

# Verify .env is in .gitignore
Get-Content .gitignore | Select-String ".env"
```

---

## Accessing Secrets Locally (for development)

For local development, you have two options:

### Option A: Use a local .env file (recommended for dev)

```powershell
# Copy example
Copy-Item .env.example .env

# Edit and fill with test values
notepad .env
```

⚠️ **NEVER commit this file!**

### Option B: Fetch from Secret Manager

```powershell
# Fetch and use in development
$STRIPE_KEY = gcloud secrets versions access latest --secret=stripe-secret-key --project=rentman-449419

# Use in your local environment
$env:STRIPE_SECRET_KEY = $STRIPE_KEY
node server.js
```

---

## Rotating Secrets

When you need to update a secret (e.g., rotate Stripe key):

```powershell
# Add a new version (old version still works until deployment)
echo "sk_live_NEW_KEY" | `
  gcloud secrets versions add stripe-secret-key --data-file=- --project=rentman-449419

# Deploy with the new version
.\deploy.ps1
```

Cloud Run automatically uses the `:latest` version.

---

## Troubleshooting

### "Permission denied on resource project rentman-449419"

**Solution:** Authenticate with the correct account:

```powershell
gcloud auth login
gcloud config set project rentman-449419
```

### "Secret already exists"

**Solution:** Add a new version instead of creating:

```powershell
echo "NEW_VALUE" | gcloud secrets versions add SECRET_NAME --data-file=- --project=rentman-449419
```

### "Service account cannot access secrets"

**Solution:** Grant IAM permissions (see Step 3 above)

---

## Security Best Practices

✅ **DO:**
- Use Secret Manager for production
- Use IAM to control who can access secrets
- Enable audit logs to track secret access
- Rotate secrets periodically
- Use different secrets for dev/staging/prod

❌ **DON'T:**
- Commit secrets to Git (even in private repos)
- Share secrets via Slack/Email
- Use production secrets in development
- Hard-code secrets in source code
- Store secrets in local files long-term

---

## Next Steps

After migration:

1. ✅ Delete local `.env` files
2. ✅ Verify `_SECRETS_BACKUP_*` is in `.gitignore`
3. ✅ Update team documentation
4. ✅ Configure CI/CD to use Secret Manager
5. ✅ Set up secret rotation schedule (optional but recommended)

---

## Questions?

Check the official documentation:
- [Google Cloud Secret Manager](https://cloud.google.com/secret-manager/docs)
- [Using secrets in Cloud Run](https://cloud.google.com/run/docs/configuring/secrets)

---

**Last Updated:** 2026-02-08  
**Maintainer:** Rentman DevOps Team
