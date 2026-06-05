/**
 * AudioFileFrameSource.ts
 *
 * Plays a bundled audio clip (an openly-licensed recording — see CREDITS.md) as an
 * {@link AudioFrameSource}. The clip is fetched and decoded once, then looped through
 * an {@link AnalyserNode} by the shared {@link BufferPlaybackSource} machinery, so the
 * file plays at real time (a guitar scale advances at its natural pace, not at the
 * analyzer's frame rate).
 */
import { BufferPlaybackSource } from "./BufferPlaybackSource.js";

export class AudioFileFrameSource extends BufferPlaybackSource {
  private readonly url: string;

  public constructor(url: string, fftSize: number) {
    super(fftSize);
    this.url = url;
  }

  protected async resolveBuffer(audioContext: AudioContext): Promise<AudioBuffer | null> {
    const response = await fetch(this.url);
    const data = await response.arrayBuffer();
    return audioContext.decodeAudioData(data);
  }
}
