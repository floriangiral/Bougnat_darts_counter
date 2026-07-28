import { describe, expect, it } from 'vitest';

import { STATS_LABELS_FR } from '../../../../src/presentation/stats/statsLabels.fr';

describe('stats labels fr', () => {
  it('exposes french labels for x01 tabs and overview metrics', () => {
    expect(STATS_LABELS_FR.x01.tabs.overview).toBe("Vue d'ensemble");
    expect(STATS_LABELS_FR.x01.tabs.scoring).toBe('Scores');
    expect(STATS_LABELS_FR.x01.overview.matchDuration).toBe('Duree du match');
  });

  it('exposes french labels for cricket, capital and triathlon stats screens', () => {
    expect(STATS_LABELS_FR.cricket.finished).toBe('CRICKET TERMINE');
    expect(STATS_LABELS_FR.capital.title).toBe('Statistiques Capital');
    expect(STATS_LABELS_FR.triathlon.modalTitle).toBe('Statistiques Triathlon');
  });
});
