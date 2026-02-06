/**
 * Haptics Utility
 * Provides tactile feedback for habit interactions
 * Gen Z/Alpha expect physical feedback from their apps
 */

type HapticPattern = 'soft' | 'success' | 'error' | 'milestone' | 'streak_break';

const patterns: Record<HapticPattern, number[]> = {
    soft: [50],                    // Quick tap - habit marked
    success: [100, 50, 100],       // Double pulse - daily goal
    error: [200, 100, 200],        // Strong double - validation error
    milestone: [50, 30, 50, 30, 100], // Celebration - streak milestone
    streak_break: [300],           // Heavy thud - racha rota
};

/**
 * Trigger haptic feedback
 * Falls back gracefully if vibration API not supported
 */
export function haptic(type: HapticPattern = 'soft'): void {
    if (typeof navigator === 'undefined' || !navigator.vibrate) {
        // Fallback: No haptic support (desktop browsers, some iOS)
        console.debug('[Haptics] Not supported on this device');
        return;
    }

    try {
        navigator.vibrate(patterns[type]);
    } catch (e) {
        console.debug('[Haptics] Vibration failed:', e);
    }
}

/**
 * Check if haptics are supported
 */
export function supportsHaptics(): boolean {
    return typeof navigator !== 'undefined' && 'vibrate' in navigator;
}

export default { haptic, supportsHaptics };
