# debug_app.ps1
$PACKAGE_NAME = "com.rentman.app"
$OUTPUT_DIR = "c:\Users\Natan\Documents\predict\Rentman\debug_output"

if (!(Test-Path $OUTPUT_DIR)) { New-Item -ItemType Directory -Path $OUTPUT_DIR }

Write-Host "--- Refreshing Diagnostics ---"
adb shell screencap -p /sdcard/debug_screen_new.png
adb pull /sdcard/debug_screen_new.png "$OUTPUT_DIR\screen_new.png"

adb shell uiautomator dump /sdcard/view_new.xml
adb pull /sdcard/view_new.xml "$OUTPUT_DIR\view_new.xml"

# Capture more broad logs
adb logcat -d > "$OUTPUT_DIR\logcat_full.txt"

Write-Host "--- Data Pulled to $OUTPUT_DIR ---"
