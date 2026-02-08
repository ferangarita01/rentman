# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Rentman Backend - Google Cloud Secret Manager Utility
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Usage:
#   .\manage-secrets.ps1 list              # List all secrets
#   .\manage-secrets.ps1 get STRIPE_SECRET_KEY    # Get specific secret
#   .\manage-secrets.ps1 update WEBHOOK_SECRET "new-value"    # Update secret
#   .\manage-secrets.ps1 sync              # Sync from backup .env to Secret Manager
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

param(
    [Parameter(Mandatory=$true)]
    [string]$Action,
    
    [Parameter(Mandatory=$false)]
    [string]$SecretName,
    
    [Parameter(Mandatory=$false)]
    [string]$SecretValue
)

$PROJECT_ID = "agent-gen-1"

function List-Secrets {
    Write-Host "📋 Secrets in project $PROJECT_ID`n" -ForegroundColor Cyan
    gcloud secrets list --project=$PROJECT_ID
}

function Get-Secret {
    param([string]$Name)
    
    Write-Host "🔍 Fetching secret: $Name" -ForegroundColor Yellow
    $value = gcloud secrets versions access latest --secret=$Name --project=$PROJECT_ID 2>&1
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Secret value:" -ForegroundColor Green
        Write-Host $value
    } else {
        Write-Host "❌ Failed to fetch secret" -ForegroundColor Red
        Write-Host $value
    }
}

function Update-Secret {
    param(
        [string]$Name,
        [string]$Value
    )
    
    Write-Host "🔄 Updating secret: $Name" -ForegroundColor Yellow
    
    # Check if secret exists
    $exists = gcloud secrets describe $Name --project=$PROJECT_ID 2>&1
    
    if ($LASTEXITCODE -eq 0) {
        # Update existing secret
        echo $Value | gcloud secrets versions add $Name --data-file=- --project=$PROJECT_ID
        Write-Host "✅ Secret updated successfully" -ForegroundColor Green
    } else {
        # Create new secret
        echo $Value | gcloud secrets create $Name --data-file=- --project=$PROJECT_ID
        Write-Host "✅ Secret created successfully" -ForegroundColor Green
    }
}

function Sync-FromBackup {
    Write-Host "🔄 Syncing secrets from _SECRETS_BACKUP_*/.env to Secret Manager...`n" -ForegroundColor Cyan
    
    $backupDir = Get-ChildItem -Path "_SECRETS_BACKUP_*" -Directory | Select-Object -First 1
    
    if (-not $backupDir) {
        Write-Host "❌ No backup directory found" -ForegroundColor Red
        exit 1
    }
    
    $envFile = Join-Path $backupDir.FullName ".env"
    
    if (-not (Test-Path $envFile)) {
        Write-Host "❌ .env file not found in backup directory" -ForegroundColor Red
        exit 1
    }
    
    Write-Host "📂 Reading from: $envFile`n" -ForegroundColor Gray
    
    Get-Content $envFile | ForEach-Object {
        if ($_ -match '^([A-Z_]+)=(.+)$') {
            $key = $matches[1]
            $value = $matches[2]
            
            # Skip PORT and comments
            if ($key -eq "PORT" -or $key.StartsWith("#")) {
                return
            }
            
            Write-Host "  → $key" -ForegroundColor Yellow
            Update-Secret -Name $key -Value $value
        }
    }
    
    Write-Host "`n✅ Sync complete!" -ForegroundColor Green
}

function Show-Help {
    Write-Host @"
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Rentman Backend - Secret Manager Utility
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

USAGE:
  .\manage-secrets.ps1 <action> [options]

ACTIONS:
  list                          List all secrets
  get <SECRET_NAME>             Get a specific secret value
  update <SECRET_NAME> <VALUE>  Update or create a secret
  sync                          Sync all secrets from backup .env file
  help                          Show this help message

EXAMPLES:
  .\manage-secrets.ps1 list
  .\manage-secrets.ps1 get STRIPE_SECRET_KEY
  .\manage-secrets.ps1 update WEBHOOK_SECRET "my-new-secret"
  .\manage-secrets.ps1 sync

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
"@
}

# Main switch
switch ($Action.ToLower()) {
    "list" { List-Secrets }
    "get" {
        if (-not $SecretName) {
            Write-Host "❌ Error: Secret name required" -ForegroundColor Red
            Write-Host "Usage: .\manage-secrets.ps1 get SECRET_NAME"
            exit 1
        }
        Get-Secret -Name $SecretName
    }
    "update" {
        if (-not $SecretName -or -not $SecretValue) {
            Write-Host "❌ Error: Secret name and value required" -ForegroundColor Red
            Write-Host "Usage: .\manage-secrets.ps1 update SECRET_NAME VALUE"
            exit 1
        }
        Update-Secret -Name $SecretName -Value $SecretValue
    }
    "sync" { Sync-FromBackup }
    "help" { Show-Help }
    default {
        Write-Host "❌ Unknown action: $Action" -ForegroundColor Red
        Write-Host ""
        Show-Help
        exit 1
    }
}
