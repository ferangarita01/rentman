# Deploy to Cloud Run
$PROJECT_ID = "agent-gen-1"
$SERVICE_NAME = "rentman-backend"
$REGION = "us-east1"

Write-Host "🚀 Building and Deploying to Cloud Run..." -ForegroundColor Cyan

# 1. Build Container (using Cloud Build for simplicity/speed)
gcloud builds submit --tag gcr.io/$PROJECT_ID/$SERVICE_NAME

# 2. Deploy
gcloud run deploy $SERVICE_NAME `
  --image gcr.io/$PROJECT_ID/$SERVICE_NAME `
  --platform managed `
  --region $REGION `
  --allow-unauthenticated `
  --set-env-vars "WEBHOOK_SECRET=$env:WEBHOOK_SECRET,SUPABASE_SERVICE_ROLE_KEY=$env:SUPABASE_SERVICE_ROLE_KEY,PROJECT_ID=$PROJECT_ID"

Write-Host "✅ Deployment Complete!" -ForegroundColor Green
