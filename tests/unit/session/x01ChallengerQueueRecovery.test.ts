// Spec 137 (RM-15, §16, AC-12) : la file des challengers est un champ optionnel de la session, assaini à la lecture.
import { describe, expect, it } from 'vitest';
import { parsePersistedAppSession } from '../../../src/app/sessionRecovery';
import { APP_SESSION_SCHEMA_VERSION, type PersistedAppSession } from '../../../src/shared';

const NOW = 1_800_000_000_000;

const session = (extra: Record<string, unknown> = {}): Record<string, unknown> => ({
  schemaVersion: APP_SESSION_SCHEMA_VERSION,
  savedAt: NOW - 1_000,
  screen: 'STATS',
  selectedGameType: 'X01',
  currentMatch: null,
  matchWinner: '',
  arenaPrefillPlayers: [],
  cricketResults: null,
  triathlonData: null,
  capitalResults: [],
  matchRuntime: null,
  ...extra,
});

const restoredQueue = (raw: Record<string, unknown>): PersistedAppSession['x01ChallengerQueue'] => {
  const result = parsePersistedAppSession(raw, NOW);
  if (result.status !== 'restored') throw new Error(`session non restaurée : ${result.status}`);
  return result.session.x01ChallengerQueue;
};

describe('file des challengers dans la session (spec 137)', () => {
  it('restaure la file telle qu’écrite', () => {
    expect(restoredQueue(session({ x01ChallengerQueue: ['Léa', 'Zoé'] }))).toEqual(['Léa', 'Zoé']);
  });

  it('lit une session antérieure, sans le champ, avec une file vide', () => {
    expect(restoredQueue(session())).toEqual([]);
  });

  it('assainit une file invalide sans écarter la session', () => {
    expect(restoredQueue(session({ x01ChallengerQueue: 'Léa' }))).toEqual([]);
    expect(restoredQueue(session({ x01ChallengerQueue: ['Léa', 'LÉA', 42, '', 'x'.repeat(101), ' Zoé '] }))).toEqual(['Léa', 'Zoé']);
    expect(restoredQueue(session({ x01ChallengerQueue: Array.from({ length: 20 }, (_, index) => `J${index}`) }))).toHaveLength(12);
  });
});
