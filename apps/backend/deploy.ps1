# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Rentman Backend - Production Deployment Script
# Platform: Google Cloud Run
# Secret Management: Google Cloud Secret Manager
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

$PROJECT_ID = "agent-gen-1"
$SERVICE_NAME = "rentman-backend"
$REGION = "us-east1"

Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "🚀 RENTMAN BACKEND - CLOUD RUN DEPLOYMENT" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host ""

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Step 1: Validate Secret Manager Setup
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Write-Host "🔐 Step 1: Validating Google Cloud Secret Manager..." -ForegroundColor Yellow
Write-Host ""

$REQUIRED_SECRETS = @(
    "STRIPE_SECRET_KEY",
    "WEBHOOK_SECRET",
    "SUPABASE_SERVICE_ROLE_KEY"
)

$missingSecrets = @()

foreach ($secret in $REQUIRED_SECRETS) {
    Write-Host "   Checking: $secret..." -ForegroundColor Gray -NoNewline
    
    $result = gcloud secrets describe $secret --project=$PROJECT_ID 2>&1
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host " ✅" -ForegroundColor Green
    } else {
        Write-Host " ❌ MISSING" -ForegroundColor Red
        $missingSecrets += $secret
    }
}

Write-Host ""

if ($missingSecrets.Count -gt 0) {
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Red
    Write-Host "❌ ERROR: Missing Required Secrets" -ForegroundColor Red
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Red
    Write-Host ""
    Write-Host "Missing secrets:" -ForegroundColor Yellow
    foreach ($secret in $missingSecrets) {
        Write-Host "   • $secret" -ForegroundColor Red
    }
    Write-Host ""
    Write-Host "📚 To create secrets, run:" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "   .\manage-secrets.ps1 update STRIPE_SECRET_KEY `"sk_live_...`"" -ForegroundColor White
    Write-Host "   .\manage-secrets.ps1 update WEBHOOK_SECRET `"your-random-secret`"" -ForegroundColor White
    Write-Host "   .\manage-secrets.ps1 update SUPABASE_SERVICE_ROLE_KEY `"eyJ...`"" -ForegroundColor White
    Write-Host ""
    Write-Host "   Or sync from backup:" -ForegroundColor Gray
    Write-Host "   .\manage-secrets.ps1 sync" -ForegroundColor White
    Write-Host ""
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Red
    Write-Host ""
    exit 1
}

Write-Host "✅ All required secrets are configured" -ForegroundColor Green
Write-Host ""

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Step 2: Build Container Image
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Write-Host "🏗️  Step 2: Building container image..." -ForegroundColor Yellow
Write-Host ""

gcloud builds submit --tag gcr.io/$PROJECT_ID/$SERVICE_NAME --project=$PROJECT_ID

if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "❌ Build failed" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "✅ Container image built successfully" -ForegroundColor Green
Write-Host ""

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Step 3: Deploy to Cloud Run
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Write-Host "🚀 Step 3: Deploying to Cloud Run..." -ForegroundColor Yellow
Write-Host ""

gcloud run deploy $SERVICE_NAME `
  --image gcr.io/$PROJECT_ID/$SERVICE_NAME `
  --platform managed `
  --region $REGION `
  --allow-unauthenticated `
  --project=$PROJECT_ID `
  --set-env-vars "GCP_PROJECT_ID=$PROJECT_ID,SUPABASE_URL=https://uoekolfgbbmvhzsfkjef.supabase.co,USE_LOCAL_SECRETS=false" `
  --update-secrets="STRIPE_SECRET_KEY=STRIPE_SECRET_KEY:latest,WEBHOOK_SECRET=WEBHOOK_SECRET:latest,SUPABASE_SERVICE_ROLE_KEY=SUPABASE_SERVICE_ROLE_KEY:latest" `
  --memory 512Mi `
  --cpu 1 `
  --timeout 60s `
  --max-instances 10 `
  --min-instances 0

if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "❌ Deployment failed" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Green
Write-Host "✅ DEPLOYMENT COMPLETE!" -ForegroundColor Green
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Green
Write-Host ""

# Get the service URL
$SERVICE_URL = gcloud run services describe $SERVICE_NAME --platform managed --region $REGION --format "value(status.url)" --project=$PROJECT_ID

Write-Host "🌐 Service URL: $SERVICE_URL" -ForegroundColor Cyan
Write-Host ""
Write-Host "📋 Next Steps:" -ForegroundColor Yellow
Write-Host "   1. Update Supabase webhook to use: $SERVICE_URL/webhooks/tasks" -ForegroundColor White
Write-Host "   2. Set webhook header: x-webhook-secret: [your-secret-value]" -ForegroundColor White
Write-Host "   3. Test with: curl $SERVICE_URL" -ForegroundColor White
Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Green
Write-Host ""

