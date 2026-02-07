# Script to monitor Rentman App Logs in Real-Time
Write-Host "Started Rentman Log Monitor..." -ForegroundColor Cyan
Write-Host "Filtering for: USER_INTERACTION, DEBUG_SUPABASE_URL, AUTH_ERROR, Capacitor/Console" -ForegroundColor Gray

adb logcat -v time *:V | Select-String "USER_INTERACTION|DEBUG_SUPABASE_URL|AUTH_ERROR|Capacitor/Console|Supabase"
