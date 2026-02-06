@echo off
echo ========================================
echo   Rentman Project - Complete Repair
echo ========================================
echo.

echo [1/7] Killing lingering processes...
taskkill /F /IM java.exe 2>NUL
taskkill /F /IM node.exe 2>NUL
taskkill /F /IM adb.exe 2>NUL
taskkill /F /IM gradle.exe 2>NUL
timeout /t 2 /nobreak >NUL
echo   Done.

echo.
echo [2/7] Cleaning build directories...
if exist node_modules rmdir /s /q node_modules 2>NUL
if exist android\.gradle rmdir /s /q android\.gradle 2>NUL
if exist android\build rmdir /s /q android\build 2>NUL
if exist android\app\build rmdir /s /q android\app\build 2>NUL
if exist .expo rmdir /s /q .expo 2>NUL
if exist package-lock.json del /f /q package-lock.json 2>NUL
echo   Done.

echo.
echo [3/7] Installing dependencies...
call npm install
if errorlevel 1 (
    echo   Error installing dependencies!
    exit /b 1
)
echo   Done.

echo.
echo [4/7] Verifying assets...
if not exist "assets\splash.png" (
    if exist "assets\splash-icon.png" (
        copy "assets\splash-icon.png" "assets\splash.png" >NUL
        echo   Created splash.png from splash-icon.png
    ) else if exist "assets\icon.png" (
        copy "assets\icon.png" "assets\splash.png" >NUL
        echo   Created splash.png from icon.png
    )
) else (
    echo   Assets OK.
)

echo.
echo [5/7] Generating Android project...
call npx expo prebuild --platform android --clean --no-install
if errorlevel 1 (
    echo   Error during prebuild!
    exit /b 1
)
echo   Done.

echo.
echo [6/7] Configuring keystore...
if not exist "rentman.keystore" (
    echo   Creating new keystore...
    keytool -genkey -v -keystore rentman.keystore -alias rentman_key -keyalg RSA -keysize 2048 -validity 10000 -storepass rentman123 -keypass rentman123 -dname "CN=Rentman Dev, OU=Rentman, O=Rentman, L=Madrid, S=Madrid, C=ES"
)
if exist "android\app" (
    copy /y "rentman.keystore" "android\app\rentman.keystore" >NUL
    echo   Keystore configured.
)

echo.
echo [7/7] Verifying configuration files...
if not exist "android\app\google-services.json" (
    echo   WARNING: google-services.json is a placeholder!
)
echo   Done.

echo.
echo ========================================
echo   REPAIR COMPLETE!
echo ========================================
echo.
echo NEXT STEPS:
echo 1. Update app.json line 34 with your Google Maps API Key
echo 2. Update android/app/google-services.json with real Firebase config
echo 3. Run: build_android_release.ps1 to build the APK
echo 4. Or run: npx expo run:android for development build
echo.
echo IMPORTANT WARNINGS:
echo - Google Maps API Key is still placeholder
echo - google-services.json may need real Firebase configuration
echo.
pause
