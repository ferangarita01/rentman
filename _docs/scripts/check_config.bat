@echo off
setlocal enabledelayedexpansion

echo ========================================
echo   Rentman Project - Configuration Checker
echo ========================================
echo.

set "ERRORS=0"
set "WARNINGS=0"

cd /d "%~dp0rentman-app"

echo [1/10] Checking keystore...
if exist "rentman.keystore" (
    echo   [OK] Keystore found
) else (
    echo   [ERROR] Keystore not found: rentman.keystore
    set /a ERRORS+=1
)

echo.
echo [2/10] Checking google-services.json...
if exist "android\app\google-services.json" (
    findstr /C:"AIzaSyDummyKey" "android\app\google-services.json" >NUL 2>&1
    if !errorlevel! == 0 (
        echo   [WARNING] google-services.json contains dummy API key
        set /a WARNINGS+=1
    ) else (
        echo   [OK] google-services.json exists and appears configured
    )
) else (
    echo   [ERROR] google-services.json not found
    set /a ERRORS+=1
)

echo.
echo [3/10] Checking Google Maps API Key...
findstr /C:"TU_API_KEY_AQUI" "app.json" >NUL 2>&1
if !errorlevel! == 0 (
    echo   [WARNING] Google Maps API key is still placeholder
    set /a WARNINGS+=1
) else (
    echo   [OK] Google Maps API key appears to be set
)

echo.
echo [4/10] Checking package.json...
if exist "package.json" (
    echo   [OK] package.json found
) else (
    echo   [ERROR] package.json not found
    set /a ERRORS+=1
)

echo.
echo [5/10] Checking .npmrc...
if exist ".npmrc" (
    echo   [OK] .npmrc found (helps with dependencies)
) else (
    echo   [WARNING] .npmrc not found (may cause dependency issues)
    set /a WARNINGS+=1
)

echo.
echo [6/10] Checking node_modules...
if exist "node_modules" (
    echo   [OK] node_modules exists
) else (
    echo   [WARNING] node_modules not found - run npm install
    set /a WARNINGS+=1
)

echo.
echo [7/10] Checking Android project...
if exist "android\app\build.gradle" (
    echo   [OK] Android project exists
) else (
    echo   [ERROR] Android project not found - run: npx expo prebuild
    set /a ERRORS+=1
)

echo.
echo [8/10] Checking build.gradle signing config...
if exist "android\app\build.gradle" (
    findstr /C:"signingConfig signingConfigs.release" "android\app\build.gradle" >NUL 2>&1
    if !errorlevel! == 0 (
        echo   [OK] Release signing configured
    ) else (
        echo   [WARNING] Release signing may not be configured
        set /a WARNINGS+=1
    )
)

echo.
echo [9/10] Checking backend configuration...
cd /d "%~dp0backend"
if exist ".env" (
    findstr /C:"SUPABASE_SERVICE_KEY=your_service_role_key_here" ".env" >NUL 2>&1
    if !errorlevel! == 0 (
        echo   [WARNING] Backend .env has placeholder values
        set /a WARNINGS+=1
    ) else (
        echo   [OK] Backend .env exists and appears configured
    )
) else (
    echo   [WARNING] Backend .env not found
    set /a WARNINGS+=1
)

echo.
echo [10/10] Checking if Java is installed...
java -version >NUL 2>&1
if !errorlevel! == 0 (
    echo   [OK] Java is installed
) else (
    echo   [ERROR] Java not found - required for Android builds
    set /a ERRORS+=1
)

echo.
echo ========================================
echo   Configuration Check Complete
echo ========================================
echo.
echo Errors:   !ERRORS!
echo Warnings: !WARNINGS!
echo.

if !ERRORS! == 0 (
    if !WARNINGS! == 0 (
        echo [SUCCESS] All checks passed! Ready to build.
        echo.
        echo Run: cd rentman-app
        echo      .\fix_all.bat
    ) else (
        echo [PARTIAL] No critical errors, but !WARNINGS! warning(s) found.
        echo Review warnings above and fix if needed.
        echo.
        echo You can try building with: cd rentman-app
        echo                             .\fix_all.bat
    )
) else (
    echo [FAILED] !ERRORS! critical error(s) found.
    echo Fix the errors above before building.
    echo.
    echo See CONFIGURATION_CHECKLIST.md for details.
)

echo.
pause
