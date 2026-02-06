# Update IP Address for Sarah Backend
# Automatically detects local IP and updates .env.local

Write-Host "🔍 Detecting Local IP Address..." -ForegroundColor Cyan

# Get IPv4 address (preferring Ethernet/Wi-Fi over Virtual adapters if possible, but taking the first valid non-localhost)
# This filter tries to avoid 192.168.56.x (VirtualBox) if others exist, but currently user seems to use it.
# Let's just pick the one that has a gateway or is Up.

$ip = (Get-NetIPAddress -AddressFamily IPv4 -Type Unicast | Where-Object { 
        $_.InterfaceAlias -notlike "*Loopback*" -and 
        $_.InterfaceAlias -notlike "*vEthernet*" -and
        $_.PrefixOrigin -ne "WellKnown"
    } | Select-Object -First 1).IPAddress

if (-not $ip) {
    # Fallback method
    $ip = (ipconfig | Select-String "IPv4" | Select-Object -First 1).ToString().Split(":")[1].Trim()
}

Write-Host "✅ Detected IP: $ip" -ForegroundColor Green

$envFile = ".env.local"

if (Test-Path $envFile) {
    $content = Get-Content $envFile
    $newContent = $content -replace "NEXT_PUBLIC_BACKEND_URL=http://.*:808[0-9]", "NEXT_PUBLIC_BACKEND_URL=http://$($ip):8081"
    
    # Check if changed
    if ($content -join "`n" -eq $newContent -join "`n") {
        Write-Host "⚠️  IP is already set to $ip. No changes needed." -ForegroundColor Yellow
    }
    else {
        Set-Content -Path $envFile -Value $newContent
        Write-Host "✅ Updated .env.local with new IP." -ForegroundColor Green
        Write-Host "⚠️  You must rebuild the app for changes to take effect:" -ForegroundColor Yellow
        Write-Host "   .\deploy-android.ps1 -Action run" -ForegroundColor Gray
    }
}
else {
    Write-Host "❌ .env.local not found!" -ForegroundColor Red
}
