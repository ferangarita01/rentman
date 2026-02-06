// Native Android Logger for APK
// Uses Capacitor plugin to log to Android logcat

import { Capacitor, registerPlugin } from '@capacitor/core';

const isNative = Capacitor.isNativePlatform();

interface SarahLoggerPlugin {
    log(options: { message: string; level: string }): Promise<void>;
}

const SarahLogger = registerPlugin<SarahLoggerPlugin>('SarahLogger');

async function logToNative(message: string, level: 'info' | 'warn' | 'error' | 'debug' = 'info') {
    if (!isNative) return;
    
    try {
        await SarahLogger.log({ message, level });
    } catch (e) {
        // Fallback to console
        console.log('[Native Log Failed]', message);
    }
}

export const NativeLog = {
    info: (msg: string) => logToNative(msg, 'info'),
    warn: (msg: string) => logToNative(msg, 'warn'),
    error: (msg: string) => logToNative(msg, 'error'),
    debug: (msg: string) => logToNative(msg, 'debug'),
};
