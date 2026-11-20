// Spec ref: specs/010-counter-offline-session-recovery-guarantees (V2-FR-06, décision Q4).
import { describe, expect, it } from 'vitest';

import { captureGameTiming, resumeElapsedSeconds, resumeGameTiming } from '../../../src/features/game-session/gameTiming';

describe('chrono persisté par horodatage', () => {
  it('ajoute le temps écoulé jusqu’à la dernière écriture, pas le temps application fermée', () => {
    const timing = captureGameTiming(42, true, 10_000);
    expect(timing).toEqual({ elapsedSeconds: 42, measuredAt: 10_000, running: true });
    expect(resumeGameTiming(timing, 40_900)).toEqual({ ...timing, elapsedSeconds: 72 });
  });

  it('laisse le chrono inchangé à l’arrêt, sans horodatage ou avec une horloge reculée', () => {
    expect(resumeElapsedSeconds(42, 10_000, false, 40_000)).toBe(42);
    expect(resumeElapsedSeconds(42, undefined, true, 40_000)).toBe(42);
    expect(resumeElapsedSeconds(42, 10_000, true, undefined)).toBe(42);
    expect(resumeElapsedSeconds(42, 10_000, true, 5_000)).toBe(42);
  });
});
