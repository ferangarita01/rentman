export interface StartRecordingOptions {
  wsUrl: string;
  userId?: string;
}

export interface StartRecordingResult {
  success: boolean;
  aecEnabled: boolean;
}

export interface AECSupportResult {
  supported: boolean;
  reason?: string;
}

export interface NativeAudioPlugin {
  startRecording(options: StartRecordingOptions): Promise<StartRecordingResult>;
  stopRecording(): Promise<void>;
  isAECSupported(): Promise<AECSupportResult>;
}
