# Rentman Mobile - Apply Database Migrations
# Run this script to apply all pending migrations to Supabase

Write-Host "==================================" -ForegroundColor Cyan
Write-Host "RENTMAN MOBILE - DATABASE MIGRATIONS" -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan
Write-Host ""

# Check if .env.local exists
if (-not (Test-Path ".env.local")) {
    Write-Host "ERROR: .env.local not found!" -ForegroundColor Red
    Write-Host "Please create .env.local with your Supabase credentials" -ForegroundColor Yellow
    exit 1
}

# Load environment variables
Get-Content .env.local | ForEach-Object {
    if ($_ -match '^([^=]+)=(.+)$') {
        $key = $matches[1].Trim()
        $value = $matches[2].Trim()
        [System.Environment]::SetEnvironmentVariable($key, $value, 'Process')
    }
}

$SUPABASE_URL = $env:NEXT_PUBLIC_SUPABASE_URL
$SUPABASE_KEY = $env:NEXT_PUBLIC_SUPABASE_ANON_KEY

if (-not $SUPABASE_URL -or -not $SUPABASE_KEY) {
    Write-Host "ERROR: Supabase credentials not found in .env.local" -ForegroundColor Red
    Write-Host "Required: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY" -ForegroundColor Yellow
    exit 1
}

Write-Host "✓ Supabase credentials loaded" -ForegroundColor Green
Write-Host "  URL: $SUPABASE_URL" -ForegroundColor Gray
Write-Host ""

# List migration files
$migrations = Get-ChildItem -Path ".\migrations\*.sql" | Sort-Object Name

if ($migrations.Count -eq 0) {
    Write-Host "No migration files found in ./migrations/" -ForegroundColor Yellow
    exit 0
}

Write-Host "Found $($migrations.Count) migration file(s):" -ForegroundColor Cyan
foreach ($migration in $migrations) {
    Write-Host "  - $($migration.Name)" -ForegroundColor Gray
}
Write-Host ""

# Ask for confirmation
Write-Host "⚠️  WARNING: This will modify your Supabase database!" -ForegroundColor Yellow
Write-Host "Make sure you have a backup before proceeding." -ForegroundColor Yellow
Write-Host ""
$confirm = Read-Host "Do you want to apply these migrations? (yes/no)"

if ($confirm -ne "yes") {
    Write-Host "Migration cancelled by user" -ForegroundColor Yellow
    exit 0
}

Write-Host ""
Write-Host "==================================" -ForegroundColor Cyan
Write-Host "APPLYING MIGRATIONS" -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan
Write-Host ""

# Apply each migration
foreach ($migration in $migrations) {
    Write-Host "Applying: $($migration.Name)..." -ForegroundColor Cyan
    
    $sqlContent = Get-Content $migration.FullName -Raw
    
    # Note: This requires manual application through Supabase Dashboard
    # or using Supabase CLI
    Write-Host "  → Please run this SQL in Supabase Dashboard > SQL Editor" -ForegroundColor Yellow
    Write-Host "  → File: $($migration.FullName)" -ForegroundColor Gray
}

Write-Host ""
Write-Host "==================================" -ForegroundColor Cyan
Write-Host "MANUAL STEPS REQUIRED" -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Go to: https://supabase.com/dashboard" -ForegroundColor White
Write-Host "2. Select your project" -ForegroundColor White
Write-Host "3. Navigate to: SQL Editor" -ForegroundColor White
Write-Host "4. Create a new query" -ForegroundColor White
Write-Host "5. Copy and paste the content from each migration file" -ForegroundColor White
Write-Host "6. Run the query" -ForegroundColor White
Write-Host ""
Write-Host "Migration files location:" -ForegroundColor Cyan
Write-Host "  $((Get-Location).Path)\migrations\" -ForegroundColor Gray
Write-Host ""
Write-Host "Order of execution:" -ForegroundColor Cyan
foreach ($migration in $migrations) {
    Write-Host "  $($migration.Name)" -ForegroundColor White
}
Write-Host ""
Write-Host "After applying migrations, verify with:" -ForegroundColor Cyan
Write-Host "  SELECT * FROM messages LIMIT 1;" -ForegroundColor Gray
Write-Host "  SELECT id, settings FROM profiles LIMIT 1;" -ForegroundColor Gray
Write-Host ""
Write-Host "✓ Migration files ready for application" -ForegroundColor Green
Write-Host ""
