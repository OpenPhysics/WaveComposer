/**
 * SharedAudioContext.ts
 *
 * One {@link AudioContext} per page, shared by file playback and synthetic Web
 * Audio sources so selecting through many presets never exhausts the browser's
 * per-page context budget.
 */
let sharedContext: AudioContext | null = null;

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
