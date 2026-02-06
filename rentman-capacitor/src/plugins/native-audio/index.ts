import { registerPlugin } from '@capacitor/core';
import type { NativeAudioPlugin } from './definitions';
import { NativeAudioWeb } from './web';

const NativeAudio = registerPlugin<NativeAudioPlugin>('NativeAudio', {
    web: () => new NativeAudioWeb(),
});

export { NativeAudio };
export type { NativeAudioPlugin };
