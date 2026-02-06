import { WebPlugin } from '@capacitor/core';
import type { NativeAudioPlugin, StartRecordingOptions, StartRecordingResult, AECSupportResult } from './definitions';

/**
 * Web fallback implementation - uses existing WebAudio approach
 * This is used when running in browser (not native Android)
 */
export class NativeAudioWeb extends WebPlugin implements NativeAudioPlugin {
    async startRecording(_options: StartRecordingOptions): Promise<StartRecordingResult> {
        console.warn('NativeAudio: Using web fallback (no hardware AEC available)');
        // In browser, delegate to existing WebAudio implementation
        // This plugin only activates on native Android
        return { success: false, aecEnabled: false };
    }

    async stopRecording(): Promise<void> {
        console.log('NativeAudio.stopRecording (web fallback)');
    }

    async isAECSupported(): Promise<AECSupportResult> {
        // Browser WebAudio AEC is unreliable, report as unsupported
        return { supported: false, reason: 'Web fallback - no hardware AEC' };
    }
}
