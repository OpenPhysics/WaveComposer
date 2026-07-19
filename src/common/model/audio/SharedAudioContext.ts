/**
 * SharedAudioContext.ts
 *
 * One {@link AudioContext} per page, shared by file playback and synthetic Web
 * Audio sources so selecting through many presets never exhausts the browser's
 * per-page context budget.
 */
const DEFAULT_SAMPLE_RATE = 44100;

let sharedContext: AudioContext | null = null;
let gestureResumeInstalled = false;

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

/**
 * Some browsers (notably Safari) only honour `resume()` when it is called from
 * inside a user-gesture handler, and a `resume()` issued earlier stays pending
 * forever. Install one-shot listeners that re-issue `resume()` on the first
 * gesture so a context started outside a gesture (e.g. the Composer screen's
 * synth graph built at sim startup) still comes alive once the user interacts.
 */
function installGestureResume(context: AudioContext): void {
  if (gestureResumeInstalled) {
    return;
  }
  gestureResumeInstalled = true;
  const events = ["pointerdown", "touchend", "keydown"] as const;
  const onGesture = () => {
    context
      .resume()
      .then(() => {
        for (const event of events) {
          window.removeEventListener(event, onGesture);
        }
        gestureResumeInstalled = false;
      })
      .catch(() => undefined);
  };
  for (const event of events) {
    window.addEventListener(event, onGesture, { passive: true });
  }
}

/** Resumes the shared context after a user gesture (required by autoplay policy). */
export async function resumeSharedAudioContext(): Promise<AudioContext> {
  const context = getSharedAudioContext();
  if (context.state === "suspended") {
    installGestureResume(context);
    await context.resume();
  }
  return context;
}
