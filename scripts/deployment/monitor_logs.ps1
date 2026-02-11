$package = "com.rentman.app"
Write-Host "Search for PID of $package..."
$pid_line = adb shell pidof -s $package
if (-not $pid_line) {
    Write-Host "App not running. Launching it..."
    adb shell monkey -p $package -c android.intent.category.LAUNCHER 1
    Start-Sleep -Seconds 3
    $pid_line = adb shell pidof -s $package
}

if ($pid_line) {
    Write-Host "App running with PID: $pid_line"
    Write-Host "Tailing logs... (Press Ctrl+C to stop)"
    # Filter for the PID and specific tags
    adb logcat -v color | Select-String -Pattern "$pid_line|Capacitor|Web Console|Rentman"
}
else {
    Write-Host "Could not verify app is running."
}
