/**
 * MonitoredAudioSource.ts
 *
 * Optional speaker output for sources that use a Web Audio graph. Analysis stays
 * on the analyser tap; monitoring routes the same signal to `destination`.
 */
export interface MonitoredAudioSource {
  setMonitoringEnabled(enabled: boolean): void;
}

export function isMonitoredAudioSource(source: unknown): source is MonitoredAudioSource {
  return (
    typeof source === "object" &&
    source !== null &&
    "setMonitoringEnabled" in source &&
    typeof (source as MonitoredAudioSource).setMonitoringEnabled === "function"
  );
}
