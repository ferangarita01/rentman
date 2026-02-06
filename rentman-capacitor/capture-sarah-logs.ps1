# Script para capturar logs de Sarah desde APK
# Uso: .\capture-sarah-logs.ps1

Write-Host "`n📱 Sarah Logs Capture - APK Android`n" -ForegroundColor Cyan

# Limpiar logs anteriores
Write-Host "🧹 Limpiando logs anteriores..." -ForegroundColor Yellow
adb logcat -c

Write-Host "✅ Logs limpiados`n" -ForegroundColor Green

Write-Host "📋 INSTRUCCIONES:" -ForegroundColor Cyan
Write-Host "1. En tu dispositivo, ve a la pantalla de Sarah" -ForegroundColor White
Write-Host "2. Habla con ella o prueba las funcionalidades" -ForegroundColor White
Write-Host "3. Presiona Ctrl+C cuando termines`n" -ForegroundColor White

Write-Host "🔍 Capturando logs... (filtrado por tags nativos de Android)`n" -ForegroundColor Yellow

# Capturar logs en tiempo real con filtro de tags nativos de Android
try {
    # Tags específicos de nuestra app nativa Android
    adb logcat SarahJS:V SarahMainActivity:V AudioStreamer:V WSAudioBridge:V NativeAudioPlugin:V chromium:I *:S | ForEach-Object {
        $line = $_.Line
        
        # Colorear según tipo de log
        if ($line -match "🟢") {
            Write-Host $line -ForegroundColor Green
        }
        elseif ($line -match "✅") {
            Write-Host $line -ForegroundColor Green
        }
        elseif ($line -match "🔵") {
            Write-Host $line -ForegroundColor Cyan
        }
        elseif ($line -match "⚠️") {
            Write-Host $line -ForegroundColor Yellow
        }
        elseif ($line -match "❌|🔴") {
            Write-Host $line -ForegroundColor Red
        }
        elseif ($line -match "🎤") {
            Write-Host $line -ForegroundColor Magenta
        }
        else {
            Write-Host $line
        }
    }
}
catch {
    Write-Host "`n⚠️ Captura detenida`n" -ForegroundColor Yellow
}

Write-Host "`n✅ Captura finalizada`n" -ForegroundColor Green
Write-Host "Para guardar logs en archivo, ejecuta:" -ForegroundColor Cyan
Write-Host "  adb logcat -d > sarah-logs.txt`n" -ForegroundColor Gray
