/**
 * RecordedAudioSource.ts
 *
 * Plays back a microphone recording captured by {@link MicrophoneInput} as an
 * {@link AudioFrameSource}. The raw mono PCM is wrapped in an {@link AudioBuffer}
 * and looped through the shared {@link BufferPlaybackSource} machinery, exactly like
 * a bundled clip — so a recording behaves as just another selectable preset.
 */
import { BufferPlaybackSource } from "./BufferPlaybackSource.js";

export class RecordedAudioSource extends BufferPlaybackSource {
  private readonly samples: Float32Array;
  private readonly recordedSampleRate: number;

  public constructor(samples: Float32Array, recordedSampleRate: number, fftSize: number) {
    super(fftSize);
    this.samples = samples;
    this.recordedSampleRate = recordedSampleRate;
  }

  protected resolveBuffer(audioContext: AudioContext): Promise<AudioBuffer | null> {
    // Build the buffer at the captured rate; playback resamples to the context rate
    // if they differ (they normally match, so this is a no-op copy).
    const buffer = audioContext.createBuffer(1, this.samples.length, this.recordedSampleRate);
    buffer.getChannelData(0).set(this.samples);
    return Promise.resolve(buffer);
  }
}
