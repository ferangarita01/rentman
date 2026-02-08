# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Upload Secrets to Google Cloud Secret Manager
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

param(
    [string]$ProjectId = "rentman-449419"
)

Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "🔐 Rentman - Upload Secrets to Google Cloud Secret Manager" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host ""

# Check if authenticated
Write-Host "🔍 Checking Google Cloud authentication..." -ForegroundColor Yellow
$authCheck = gcloud auth list --filter=status:ACTIVE --format="value(account)" 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Not authenticated. Run: gcloud auth login" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Authenticated as: $authCheck" -ForegroundColor Green
Write-Host ""

# Check project access
Write-Host "🔍 Verifying project access..." -ForegroundColor Yellow
$projectCheck = gcloud projects describe $ProjectId 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Cannot access project: $ProjectId" -ForegroundColor Red
    Write-Host "   Make sure you have the correct permissions." -ForegroundColor Red
    exit 1
}
Write-Host "✅ Project access verified: $ProjectId" -ForegroundColor Green
Write-Host ""

# Load secrets from backup
$envFile = "_SECRETS_BACKUP_20260208_132332\.env"
if (-not (Test-Path $envFile)) {
    Write-Host "❌ Backup file not found: $envFile" -ForegroundColor Red
    exit 1
}

Write-Host "📦 Reading secrets from: $envFile" -ForegroundColor Cyan
$envContent = Get-Content $envFile

# Parse and upload secrets
$secrets = @{
    "STRIPE_SECRET_KEY" = ""
    "WEBHOOK_SECRET" = ""
    "SUPABASE_SERVICE_ROLE_KEY" = ""
}

foreach ($line in $envContent) {
    if ($line -match '^([A-Z_]+)=(.+)$') {
        $key = $Matches[1]
        $value = $Matches[2]
        if ($secrets.ContainsKey($key)) {
            $secrets[$key] = $value
        }
    }
}

Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "📤 Uploading secrets to Secret Manager..." -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host ""

# Upload STRIPE_SECRET_KEY
if ($secrets["STRIPE_SECRET_KEY"]) {
    Write-Host "📤 Uploading: stripe-secret-key..." -ForegroundColor Yellow
    
    # Check if secret exists
    $exists = gcloud secrets describe stripe-secret-key --project=$ProjectId 2>&1
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "   Secret exists. Adding new version..." -ForegroundColor Gray
        echo $secrets["STRIPE_SECRET_KEY"] | gcloud secrets versions add stripe-secret-key --data-file=- --project=$ProjectId
    } else {
        Write-Host "   Creating new secret..." -ForegroundColor Gray
        echo $secrets["STRIPE_SECRET_KEY"] | gcloud secrets create stripe-secret-key --data-file=- --project=$ProjectId --replication-policy="automatic"
    }
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "   ✅ stripe-secret-key uploaded" -ForegroundColor Green
    } else {
        Write-Host "   ❌ Failed to upload stripe-secret-key" -ForegroundColor Red
    }
}

# Generate WEBHOOK_SECRET if not exists
if (-not $secrets["WEBHOOK_SECRET"]) {
    Write-Host "🔑 Generating new WEBHOOK_SECRET..." -ForegroundColor Yellow
    $secrets["WEBHOOK_SECRET"] = node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
}

Write-Host "📤 Uploading: webhook-secret..." -ForegroundColor Yellow
$exists = gcloud secrets describe webhook-secret --project=$ProjectId 2>&1

if ($LASTEXITCODE -eq 0) {
    Write-Host "   Secret exists. Adding new version..." -ForegroundColor Gray
    echo $secrets["WEBHOOK_SECRET"] | gcloud secrets versions add webhook-secret --data-file=- --project=$ProjectId
} else {
    Write-Host "   Creating new secret..." -ForegroundColor Gray
    echo $secrets["WEBHOOK_SECRET"] | gcloud secrets create webhook-secret --data-file=- --project=$ProjectId --replication-policy="automatic"
}

if ($LASTEXITCODE -eq 0) {
    Write-Host "   ✅ webhook-secret uploaded" -ForegroundColor Green
} else {
    Write-Host "   ❌ Failed to upload webhook-secret" -ForegroundColor Red
}

# SUPABASE_SERVICE_ROLE_KEY (if exists)
if ($secrets["SUPABASE_SERVICE_ROLE_KEY"]) {
    Write-Host "📤 Uploading: supabase-service-role-key..." -ForegroundColor Yellow
    
    $exists = gcloud secrets describe supabase-service-role-key --project=$ProjectId 2>&1
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "   Secret exists. Adding new version..." -ForegroundColor Gray
        echo $secrets["SUPABASE_SERVICE_ROLE_KEY"] | gcloud secrets versions add supabase-service-role-key --data-file=- --project=$ProjectId
    } else {
        Write-Host "   Creating new secret..." -ForegroundColor Gray
        echo $secrets["SUPABASE_SERVICE_ROLE_KEY"] | gcloud secrets create supabase-service-role-key --data-file=- --project=$ProjectId --replication-policy="automatic"
    }
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "   ✅ supabase-service-role-key uploaded" -ForegroundColor Green
    } else {
        Write-Host "   ❌ Failed to upload supabase-service-role-key" -ForegroundColor Red
    }
} else {
    Write-Host "⚠️  SUPABASE_SERVICE_ROLE_KEY not found in backup. Skipping..." -ForegroundColor Yellow
    Write-Host "   You'll need to add this manually:" -ForegroundColor Gray
    Write-Host "   echo 'YOUR_KEY' | gcloud secrets create supabase-service-role-key --data-file=- --project=$ProjectId" -ForegroundColor Gray
}

Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "✅ Secret upload complete!" -ForegroundColor Green
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host ""
Write-Host "📋 Next steps:" -ForegroundColor Cyan
Write-Host "   1. Update deploy.ps1 to use --set-secrets" -ForegroundColor White
Write-Host "   2. Remove local .env files" -ForegroundColor White
Write-Host "   3. Deploy to Cloud Run" -ForegroundColor White
Write-Host ""
