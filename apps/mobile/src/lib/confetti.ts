/**
 * Confetti Utility
 * Conditional celebration effects for milestones
 * Only triggers on real achievements (7, 30, 100 days) to keep dopamine high
 */

import confetti from 'canvas-confetti';

type ConfettiTheme = 'light' | 'dark';

const themeColors: Record<ConfettiTheme, string[]> = {
    light: ['#FF3D00', '#FF6B6B', '#FF8E8E', '#FF6B35', '#FFD700'], // Sarah Orange Lava + Gold
    dark: ['#A855F7', '#84CC16', '#22D3EE', '#FF5722', '#F472B6'],   // Neon Purple/Lime/Cyan
};

/**
 * Fire confetti celebration
 * @param streak - Current streak count (only fires on milestones)
 * @param theme - Current app theme for color matching
 * @returns boolean - Whether confetti was fired
 */
export function celebrate(streak: number, theme: ConfettiTheme = 'light'): boolean {
    const milestones = [7, 14, 21, 30, 50, 75, 100, 150, 200, 365];

    if (!milestones.includes(streak)) {
        return false; // No confetti for non-milestones
    }

    const colors = themeColors[theme];
    const intensity = streak >= 100 ? 'epic' : streak >= 30 ? 'big' : 'normal';

    switch (intensity) {
        case 'epic':
            // 100+ days: EPIC fireworks from all sides
            confetti({
                particleCount: 150,
                spread: 180,
                origin: { y: 0.6 },
                colors,
            });
            setTimeout(() => {
                confetti({
                    particleCount: 100,
                    angle: 60,
                    spread: 80,
                    origin: { x: 0 },
                    colors,
                });
                confetti({
                    particleCount: 100,
                    angle: 120,
                    spread: 80,
                    origin: { x: 1 },
                    colors,
                });
            }, 200);
            break;

        case 'big':
            // 30-99 days: Big burst
            confetti({
                particleCount: 100,
                spread: 100,
                origin: { y: 0.6 },
                colors,
            });
            break;

        default:
            // 7-29 days: Normal celebration
            confetti({
                particleCount: 50,
                spread: 60,
                origin: { y: 0.7 },
                colors,
            });
    }

    return true;
}

/**
 * Quick burst for daily completion (non-milestone)
 * Subtle but satisfying
 */
export function microCelebrate(theme: ConfettiTheme = 'light'): void {
    const colors = themeColors[theme];

    confetti({
        particleCount: 15,
        spread: 30,
        startVelocity: 20,
        decay: 0.95,
        origin: { y: 0.8 },
        colors: colors.slice(0, 2),
        scalar: 0.8,
    });
}

export default { celebrate, microCelebrate };
