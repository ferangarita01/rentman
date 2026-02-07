#!/bin/bash

# Rentman APK Build, Install & Launch Script
# Usage: ./build-install.sh [debug|release]

BUILD_TYPE=${1:-debug}
PROJECT_DIR="C:/Users/Natan/Documents/predict/Rentman/rentman-capacitor"
ANDROID_DIR="$PROJECT_DIR/android"
APP_PACKAGE="com.rentman.app"

echo "🚀 Rentman Build, Install & Launch Script"
echo "=========================================="
echo "Build type: $BUILD_TYPE"
echo ""

# Step 1: Sync Capacitor
echo "📦 Step 1/5: Syncing Capacitor..."
cd "$PROJECT_DIR"
npx cap sync android
if [ $? -ne 0 ]; then
    echo "❌ Capacitor sync failed"
    exit 1
fi
echo "✅ Capacitor synced"
echo ""

# Step 2: Build APK
echo "🔨 Step 2/5: Building APK..."
cd "$ANDROID_DIR"

if [ "$BUILD_TYPE" == "release" ]; then
    ./gradlew assembleRelease
    APK_PATH="app/build/outputs/apk/release/app-release.apk"
else
    ./gradlew assembleDebug
    APK_PATH="app/build/outputs/apk/debug/app-debug.apk"
fi

if [ $? -ne 0 ]; then
    echo "❌ Build failed"
    exit 1
fi
echo "✅ APK built successfully"
echo ""

# Step 3: Check for connected devices
echo "📱 Step 3/5: Checking for connected devices..."
adb devices -l
DEVICE_COUNT=$(adb devices | grep -c "device$")
if [ $DEVICE_COUNT -eq 0 ]; then
    echo "❌ No devices connected. Please connect a device or start an emulator."
    exit 1
fi
echo "✅ Found $DEVICE_COUNT device(s)"
echo ""

# Step 4: Uninstall old version (optional)
echo "🗑️  Step 4/5: Removing old version..."
adb uninstall $APP_PACKAGE 2>/dev/null
echo "✅ Old version removed (if existed)"
echo ""

# Step 5: Install APK
echo "📲 Step 5/5: Installing APK..."
adb install -r "$APK_PATH"
if [ $? -ne 0 ]; then
    echo "❌ Installation failed"
    exit 1
fi
echo "✅ APK installed successfully"
echo ""

# Step 6: Launch app
echo "🎯 Launching app..."
adb shell am start -n $APP_PACKAGE/.MainActivity
if [ $? -ne 0 ]; then
    echo "❌ Failed to launch app"
    exit 1
fi
echo "✅ App launched successfully"
echo ""

echo "✨ All done! App is running on your device."
echo "📊 To view logs: adb logcat | grep -i rentman"
