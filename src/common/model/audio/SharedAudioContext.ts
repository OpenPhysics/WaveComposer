/**
 * SharedAudioContext.ts
 *
 * One {@link AudioContext} per page, shared by file playback and synthetic Web
 * Audio sources so selecting through many presets never exhausts the browser's
 * per-page context budget.
 */
const DEFAULT_SAMPLE_RATE = 44100;

let sharedContext: AudioContext | null = null;

/** Sample rate without creating a context (avoids autoplay warnings before a user gesture). */
export function getSharedSampleRate(): number {
  return sharedContext?.sampleRate ?? DEFAULT_SAMPLE_RATE;
}

export function getSharedAudioContext(): AudioContext {
  if (!sharedContext) {
    sharedContext = new AudioContext();
  }
  return sharedContext;
}

/** Resumes the shared context after a user gesture (required by autoplay policy). */
export async function resumeSharedAudioContext(): Promise<AudioContext> {
  const context = getSharedAudioContext();
  if (context.state === "suspended") {
    await context.resume();
  }
  return context;
}
