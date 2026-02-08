# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Google Cloud Secret Manager - Setup Script
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# 
# This script helps you migrate from local .env files to Google Cloud
# Secret Manager for production-grade secret management.
#
# Prerequisites:
#   - gcloud CLI installed and authenticated
#   - Project set to agent-gen-1
#   - Secret Manager API enabled
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

param(
    [Parameter(Mandatory=$false)]
    [switch]$Check,
    
    [Parameter(Mandatory=$false)]
    [switch]$Create,
    
    [Parameter(Mandatory=$false)]
    [switch]$Update
)

$PROJECT_ID = "agent-gen-1"

Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "🔐 GOOGLE CLOUD SECRET MANAGER - SETUP" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host ""

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Function: Check Secret Manager Status
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function Check-SecretManager {
    Write-Host "📋 Checking Secret Manager status..." -ForegroundColor Yellow
    Write-Host ""
    
    # Check if API is enabled
    $apiEnabled = gcloud services list --enabled --filter="name:secretmanager.googleapis.com" --project=$PROJECT_ID --format="value(name)" 2>&1
    
    if ($apiEnabled) {
        Write-Host "   ✅ Secret Manager API is enabled" -ForegroundColor Green
    } else {
        Write-Host "   ❌ Secret Manager API is NOT enabled" -ForegroundColor Red
        Write-Host ""
        Write-Host "   To enable, run:" -ForegroundColor Yellow
        Write-Host "   gcloud services enable secretmanager.googleapis.com --project=$PROJECT_ID" -ForegroundColor White
        Write-Host ""
        return
    }
    
    Write-Host ""
    
    # Check secrets
    $REQUIRED_SECRETS = @(
        @{Name="stripe-secret-key"; Description="Stripe API Secret Key"},
        @{Name="webhook-secret"; Description="Webhook Authentication Secret"},
        @{Name="supabase-service-role-key"; Description="Supabase Service Role Key"}
    )
    
    Write-Host "🔍 Secret Status:" -ForegroundColor Yellow
    Write-Host ""
    
    foreach ($secret in $REQUIRED_SECRETS) {
        $exists = gcloud secrets describe $secret.Name --project=$PROJECT_ID 2>&1
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "   ✅ $($secret.Name.PadRight(30)) EXISTS" -ForegroundColor Green
        } else {
            Write-Host "   ❌ $($secret.Name.PadRight(30)) MISSING" -ForegroundColor Red
        }
    }
    
    Write-Host ""
}

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Function: Create Secrets Interactively
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function Create-Secrets {
    Write-Host "🆕 Creating Secrets Interactively..." -ForegroundColor Yellow
    Write-Host ""
    
    # 1. Stripe Secret Key
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor DarkGray
    Write-Host "1️⃣  Stripe Secret Key" -ForegroundColor Cyan
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor DarkGray
    Write-Host ""
    Write-Host "Get from: https://dashboard.stripe.com/apikeys" -ForegroundColor Gray
    Write-Host "Format: sk_live_... (or sk_test_... for testing)" -ForegroundColor Gray
    Write-Host ""
    
    $stripeKey = Read-Host "Enter Stripe Secret Key (or press Enter to skip)"
    
    if ($stripeKey) {
        Write-Host ""
        Write-Host "Creating secret..." -ForegroundColor Yellow
        echo $stripeKey | gcloud secrets create stripe-secret-key --data-file=- --project=$PROJECT_ID 2>&1
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ stripe-secret-key created" -ForegroundColor Green
        } else {
            Write-Host "❌ Failed to create stripe-secret-key" -ForegroundColor Red
        }
    }
    
    Write-Host ""
    
    # 2. Webhook Secret
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor DarkGray
    Write-Host "2️⃣  Webhook Secret" -ForegroundColor Cyan
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor DarkGray
    Write-Host ""
    Write-Host "This is a random secret for authenticating webhooks." -ForegroundColor Gray
    Write-Host ""
    
    $generateWebhook = Read-Host "Generate random webhook secret? (Y/n)"
    
    if ($generateWebhook -ne "n") {
        Write-Host ""
        Write-Host "Generating random secret..." -ForegroundColor Yellow
        
        # Generate random 32-byte hex string
        $webhookSecret = -join ((1..64) | ForEach-Object { "{0:x}" -f (Get-Random -Maximum 16) })
        
        Write-Host "Generated: $webhookSecret" -ForegroundColor Green
        Write-Host ""
        Write-Host "Creating secret..." -ForegroundColor Yellow
        
        echo $webhookSecret | gcloud secrets create webhook-secret --data-file=- --project=$PROJECT_ID 2>&1
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ webhook-secret created" -ForegroundColor Green
        } else {
            Write-Host "❌ Failed to create webhook-secret" -ForegroundColor Red
        }
    }
    
    Write-Host ""
    
    # 3. Supabase Service Role Key
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor DarkGray
    Write-Host "3️⃣  Supabase Service Role Key" -ForegroundColor Cyan
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor DarkGray
    Write-Host ""
    Write-Host "Get from: https://app.supabase.com/project/uoekolfgbbmvhzsfkjef/settings/api" -ForegroundColor Gray
    Write-Host "Look for: 'service_role' key (not 'anon' key)" -ForegroundColor Gray
    Write-Host ""
    
    $supabaseKey = Read-Host "Enter Supabase Service Role Key (or press Enter to skip)"
    
    if ($supabaseKey) {
        Write-Host ""
        Write-Host "Creating secret..." -ForegroundColor Yellow
        echo $supabaseKey | gcloud secrets create supabase-service-role-key --data-file=- --project=$PROJECT_ID 2>&1
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ supabase-service-role-key created" -ForegroundColor Green
        } else {
            Write-Host "❌ Failed to create supabase-service-role-key" -ForegroundColor Red
        }
    }
    
    Write-Host ""
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Green
    Write-Host "✅ Secret creation complete!" -ForegroundColor Green
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Green
    Write-Host ""
    Write-Host "Run './setup-secrets.ps1 -Check' to verify." -ForegroundColor Cyan
    Write-Host ""
}

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Function: Update Existing Secrets
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function Update-Secrets {
    Write-Host "🔄 Updating Secrets..." -ForegroundColor Yellow
    Write-Host ""
    
    $secretName = Read-Host "Enter secret name to update (stripe-secret-key, webhook-secret, supabase-service-role-key)"
    
    if (-not $secretName) {
        Write-Host "❌ No secret name provided" -ForegroundColor Red
        return
    }
    
    Write-Host ""
    $secretValue = Read-Host "Enter new value for $secretName"
    
    if ($secretValue) {
        Write-Host ""
        Write-Host "Adding new version..." -ForegroundColor Yellow
        
        echo $secretValue | gcloud secrets versions add $secretName --data-file=- --project=$PROJECT_ID 2>&1
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ $secretName updated with new version" -ForegroundColor Green
        } else {
            Write-Host "❌ Failed to update $secretName" -ForegroundColor Red
        }
    }
    
    Write-Host ""
}

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Main Execution
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

if ($Check) {
    Check-SecretManager
} elseif ($Create) {
    Create-Secrets
} elseif ($Update) {
    Update-Secrets
} else {
    Write-Host "Usage:" -ForegroundColor Yellow
    Write-Host "   ./setup-secrets.ps1 -Check    # Check current status" -ForegroundColor White
    Write-Host "   ./setup-secrets.ps1 -Create   # Create secrets interactively" -ForegroundColor White
    Write-Host "   ./setup-secrets.ps1 -Update   # Update existing secret" -ForegroundColor White
    Write-Host ""
}
