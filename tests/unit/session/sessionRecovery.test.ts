// @vitest-environment jsdom
// Spec ref: specs/010-counter-offline-session-recovery-guarantees (Révision V2 : V2-FR-03, V2-FR-04, V2-AC-03, V2-AC-04).
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { createMatch } from '../../../src/application/scoring/matchLifecycle';
import type { PersistedAppSession } from '../../../src/shared';
import type { GameConfig, MatchState, Player } from '../../../types';
import { APP_SESSION_STORAGE_KEY } from '../../../utils/appPersistence';

const infrastructure = vi.hoisted(() => ({
  clearPersistedAppSessionAsync: vi.fn(() => Promise.resolve()),
  persistAppSessionAsync: vi.fn(() => Promise.resolve()),
  restorePersistedAppSessionAsync: vi.fn<() => Promise<unknown>>(() => Promise.resolve(null)),
}));

vi.mock('../../../src/infrastructure', () => infrastructure);

const appShell = await import('../../../src/app/appShell');

const players: Player[] = [
  { id: 'anne', name: 'Anne', teamId: 'team1' },
  { id: 'zoe', name: 'Zoé', teamId: 'team2' },
];
const config: GameConfig = {
  startingScore: 501, checkIn: 'Open', checkOut: 'Double', matchMode: 'LEGS', legsToWin: 1, setsToWin: 1, isDoubles: false,
};

const buildPlayedMatch = (): MatchState => {
  const match = createMatch(players, config);
  return {
    ...match,
    currentPlayerIndex: 1,
    currentLeg: {
      ...match.currentLeg,
      scores: { team1: 441, team2: 501 },
      history: [{ playerId: 'anne', score: 60, isBust: false, remainingAfter: 441, dartsThrown: 3 }],
    },
  };
};

// Session X01 telle qu'écrite par la version actuelle (sans schemaVersion).
const buildLegacyX01Session = (): PersistedAppSession => {
  const match = buildPlayedMatch();
  return {
    screen: 'MATCH',
    selectedGameType: 'X01',
    currentMatch: match,
    matchWinner: '',
    arenaPrefillPlayers: [],
    cricketResults: null,
    triathlonData: null,
    capitalResults: [],
    killerResults: null,
    gotchaResults: null,
    matchRuntime: { match, hasGameStarted: true, elapsedSeconds: 42 },
    externalMatch: null,
  };
};

const store = (value: unknown) => {
  window.localStorage.setItem(APP_SESSION_STORAGE_KEY, typeof value === 'string' ? value : JSON.stringify(value));
};

beforeEach(() => {
  window.localStorage.clear();
});

describe('restauration — format sans version (migration X01, Q1)', () => {
  it('reprend une partie X01 en cours enregistrée par l’ancienne version', () => {
    store(buildLegacyX01Session());

    const session = appShell.getRestoredAppSession();

    expect(session?.screen).toBe('MATCH');
    expect(session?.matchRuntime?.match.currentLeg.scores).toEqual({ team1: 441, team2: 501 });
    expect(session?.matchRuntime?.match.currentPlayerIndex).toBe(1);
    expect(session?.matchRuntime?.elapsedSeconds).toBe(42);
  });
});

describe('restauration — grille de corruption (V2-AC-04)', () => {
  const legacy = buildLegacyX01Session();
  const cases: Array<[string, unknown]> = [
    ['JSON illisible', '{"screen": "MATCH"'],
    ['champ obligatoire manquant', { ...legacy, screen: undefined }],
    ['index de joueur hors bornes', {
      ...legacy,
      matchRuntime: { ...legacy.matchRuntime, match: { ...legacy.currentMatch, currentPlayerIndex: 7 } },
    }],
    ['score d’équipe manquant', {
      ...legacy,
      currentMatch: { ...legacy.currentMatch, currentLeg: { ...legacy.currentMatch!.currentLeg, scores: { team1: 441 } } },
    }],
    ['type de jeu inconnu', { ...legacy, selectedGameType: 'BOWLING' }],
    ['écran inconnu', { ...legacy, screen: 'ARCADE' }],
    ['version future', { ...legacy, schemaVersion: 99, savedAt: Date.now() }],
    ['contenu qui n’est pas un objet', [1, 2, 3]],
  ];

  it.each(cases)('%s → aucune exception, démarrage propre et donnée supprimée', (_label, value) => {
    store(value);

    expect(() => appShell.getRestoredAppSession()).not.toThrow();
    store(value);
    expect(appShell.getRestoredAppSession()).toBeNull();
    expect(window.localStorage.getItem(APP_SESSION_STORAGE_KEY)).toBeNull();
  });
});
