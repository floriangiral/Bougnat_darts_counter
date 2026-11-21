// Spec ref: specs/010-counter-offline-session-recovery-guarantees (V2-FR-05, V2-FR-06, décision Q4).
// A game clock is persisted as "elapsed seconds measured at a given instant", captured on
// business changes only: a clock tick never triggers a write. On restore, the time between
// that instant and the last write (`savedAt`, refreshed when the page is hidden or closed) is
// added back; the time spent with the app closed is not counted.
import type { GameTiming } from '../../shared/session/persistedAppSession';

export const captureGameTiming = (elapsedSeconds: number, running: boolean, now = Date.now()): GameTiming => ({
  elapsedSeconds,
  measuredAt: now,
  running,
});

export const resumeElapsedSeconds = (
  elapsedSeconds: number,
  measuredAt: number | undefined,
  running: boolean,
  savedAt: number | undefined,
): number => {
  if (!running || measuredAt === undefined || savedAt === undefined) return elapsedSeconds;
  return elapsedSeconds + Math.max(0, Math.floor((savedAt - measuredAt) / 1000));
};

export const resumeGameTiming = (timing: GameTiming, savedAt: number | undefined): GameTiming => ({
  ...timing,
  elapsedSeconds: resumeElapsedSeconds(timing.elapsedSeconds, timing.measuredAt, timing.running, savedAt),
});
