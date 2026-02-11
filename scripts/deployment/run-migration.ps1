# Helper script para ejecutar migración
# Ejecutar desde: C:\Users\Natan\Documents\predict\Rentman

# Verificar conexión
Write-Host "Verificando conexión a Supabase..." -ForegroundColor Cyan

# Leer variables de entorno
if (Test-Path .env) {
    Get-Content .env | ForEach-Object {
        if ($_ -match '^SUPABASE_URL=(.+)') {
            $env:SUPABASE_URL = $matches[1]
        }
        if ($_ -match '^SUPABASE_SERVICE_ROLE_KEY=(.+)') {
            $env:SUPABASE_KEY = $matches[1]
        }
    }
}

Write-Host "URL: $env:SUPABASE_URL" -ForegroundColor Green

# Ejecutar migración
Write-Host "
Ejecutando migración..." -ForegroundColor Yellow
supabase db push --db-url $env:SUPABASE_URL

Write-Host "
✅ Migración completada" -ForegroundColor Green
