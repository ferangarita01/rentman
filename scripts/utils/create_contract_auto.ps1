# create_contract_auto.ps1
$ADBS = "adb shell input"

Write-Host "--- Starting Robust Automation ---"

# 1. Close keyboard if open
Write-Host "Ensuring keyboard is closed..."
adb shell input keyevent 4
Start-Sleep -Seconds 1

# 2. Ensure we are at the top and in Manual mode
Write-Host "Scrolling to top..."
adb shell input swipe 360 400 360 1200
Start-Sleep -Seconds 1

# 3. Fill Title
Write-Host "Filling Title..."
adb shell input tap 360 350
# Clear existing text (assuming 20 chars max for safety)
for ($i = 0; $i -lt 20; $i++) { adb shell input keyevent 67 }
adb shell input text "ROBUST_ADB_TASK"
adb shell input keyevent 66 # Enter
Start-Sleep -Seconds 1

# 4. Fill Description
Write-Host "Filling Description..."
adb shell input tap 360 500
for ($i = 0; $i -lt 20; $i++) { adb shell input keyevent 67 }
adb shell input text "AUTOMATED_VERIFICATION_v2"
adb shell input keyevent 66 # Enter
Start-Sleep -Seconds 1

# 5. Fill Budget
Write-Host "Filling Budget..."
adb shell input tap 360 650
for ($i = 0; $i -lt 5; $i++) { adb shell input keyevent 67 }
adb shell input text "100"
adb shell input keyevent 66 # Enter
Start-Sleep -Seconds 1

# 6. Close keyboard after typing
Write-Host "Closing keyboard..."
adb shell input keyevent 4
Start-Sleep -Seconds 1

# 7. Deploy
Write-Host "Tapping Deploy..."
# Deploy button is at the bottom.
adb shell input tap 360 1500

Write-Host "--- Automation Complete ---"

# Capture Result
adb shell screencap -p /sdcard/auto_v2_result.png
adb pull /sdcard/auto_v2_result.png c:\Users\Natan\Documents\predict\Rentman\auto_v2_result.png
