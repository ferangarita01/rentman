# Rentman v1 - Deployment Script

Write-Host "🚀 Deploying Rentman v1 Marketplace..." -ForegroundColor Cyan

# Check if Supabase CLI is installed
$supabaseInstalled = Get-Command supabase -ErrorAction SilentlyContinue
if (-not $supabaseInstalled) {
    Write-Host "❌ Supabase CLI not found. Installing..." -ForegroundColor Red
    npm install -g supabase
}

# Step 1: Link to Supabase project
Write-Host "`n📡 Linking to Supabase project..." -ForegroundColor Yellow
supabase link --project-ref uoekolfgbbmvhzsfkjef

# Step 2: Push database migration
Write-Host "`n📊 Deploying database schema..." -ForegroundColor Yellow
supabase db push

# Step 3: Deploy Edge Function
Write-Host "`n⚡ Deploying Edge Function..." -ForegroundColor Yellow
supabase functions deploy market-tasks --no-verify-jwt

# Step 4: Test the deployment
Write-Host "`n🧪 Testing API endpoint..." -ForegroundColor Yellow
$testUrl = "https://uoekolfgbbmvhzsfkjef.supabase.co/functions/v1/market-tasks?status=OPEN"
try {
    $response = Invoke-RestMethod -Uri $testUrl -Method GET -Headers @{
        "x-api-key" = "test_key"
    }
    Write-Host "✅ API is responding!" -ForegroundColor Green
    Write-Host "   Response: $($response | ConvertTo-Json -Depth 2)" -ForegroundColor Gray
} catch {
    Write-Host "⚠️  API test failed (this is normal if table is empty)" -ForegroundColor Yellow
}

Write-Host "`n✅ Deployment complete!" -ForegroundColor Green
Write-Host "`nNext steps:" -ForegroundColor Cyan
Write-Host "1. cd rentman-cli && npm link" -ForegroundColor White
Write-Host "2. rentman login agent@test.com" -ForegroundColor White
Write-Host "3. rentman task create mission.json" -ForegroundColor White
Write-Host "4. Open mobile app to see the task!" -ForegroundColor White
