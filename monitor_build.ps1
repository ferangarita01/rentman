$buildId = "a91562ae-7569-433f-a119-addd77e0f92d"
$lastSize = 0
while ($true) {
    $status = gcloud builds describe $buildId --format="value(status)" 2>$null
    $timestamp = Get-Date -Format "HH:mm:ss"
    
    if ($status -ne "WORKING") {
        Write-Host "[$timestamp] ✅ BUILD TERMINADO: $status" -ForegroundColor Green
        gcloud builds describe $buildId --format="table(status, finishTime)"
        break
    }
    
    # Check log size
    $logInfo = gsutil ls -l gs://rentman-builds/log-$buildId.txt 2>$null | Select-String "KiB|MiB"
    if ($logInfo) {
        $size = ($logInfo -split '\s+')[0]
        if ($size -ne $lastSize) {
            Write-Host "[$timestamp] 📊 Status: $status | Log: $size" -ForegroundColor Yellow
            $lastSize = $size
        }
    }
    
    Start-Sleep -Seconds 30
}
