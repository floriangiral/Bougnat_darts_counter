// @vitest-environment jsdom
// Spec ref: specs/010-counter-offline-session-recovery-guarantees (Révision V2 : V2-FR-03, V2-FR-04, V2-AC-03, V2-AC-04).
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { createMatch } from '../../../src/application/scoring/matchLifecycle';
import { createGotchaState } from '../../../src/domain/gotcha/gotcha';
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

describe('restauration — enveloppe versionnée', () => {
  const NOW = Date.UTC(2026, 10, 20, 12);
  const DAY_MS = 24 * 60 * 60 * 1000;
  const versioned = (overrides: Partial<PersistedAppSession> = {}): PersistedAppSession => ({
    ...buildLegacyX01Session(),
    schemaVersion: 2,
    savedAt: NOW - 1000,
    ...overrides,
  });

  it('signale une session écartée et supprime la donnée (V2-FR-04)', () => {
    store({ ...versioned(), screen: 'ARCADE' });

    expect(appShell.restoreAppSession(NOW)).toEqual({ session: null, discarded: true });
    expect(window.localStorage.getItem(APP_SESSION_STORAGE_KEY)).toBeNull();
    expect(infrastructure.clearPersistedAppSessionAsync).toHaveBeenCalledOnce();
  });

  it('purge sans message une session de plus de 7 jours (Q6), mais garde une session de 6 jours', () => {
    store(versioned({ savedAt: NOW - 6 * DAY_MS }));
    expect(appShell.restoreAppSession(NOW).session?.screen).toBe('MATCH');

    store(versioned({ savedAt: NOW - 8 * DAY_MS }));
    expect(appShell.restoreAppSession(NOW)).toEqual({ session: null, discarded: false });
    expect(window.localStorage.getItem(APP_SESSION_STORAGE_KEY)).toBeNull();
  });

  it('écarte une session versionnée sans date d’écriture', () => {
    store({ ...versioned(), savedAt: undefined });
    expect(appShell.restoreAppSession(NOW).discarded).toBe(true);
  });

  it('restaure le statut d’envoi partenaire depuis les statistiques', () => {
    const partnerResultStatus = { state: 'failed' as const, host: 'partner.example' };
    store(versioned({
      screen: 'STATS',
      partnerResultStatus,
      externalMatch: null,
    }));

    expect(appShell.restoreAppSession(NOW).session?.partnerResultStatus).toEqual(partnerResultStatus);
  });

  it('écarte avec message un jeu non-X01 en cours enregistré par l’ancienne version (Q1)', () => {
    store({ ...buildLegacyX01Session(), screen: 'CRICKET_GAME', selectedGameType: 'CRICKET', matchRuntime: null });
    expect(appShell.restoreAppSession(NOW)).toEqual({ session: null, discarded: true });
  });

  it('conserve un écran de statistiques de l’ancienne version', () => {
    const legacy = buildLegacyX01Session();
    store({ ...legacy, screen: 'CAPITAL_STATS', selectedGameType: 'CAPITAL', matchRuntime: null, capitalResults: [{ id: 'anne', name: 'Anne', score: 10, targetIndex: 17, history: [] }] });

    const session = appShell.restoreAppSession(NOW).session;
    expect(session?.screen).toBe('CAPITAL_STATS');
    expect(session?.schemaVersion).toBe(2);
    expect(session?.killerResults).toBeNull();
  });

  it.each([
    ['CRICKET_STATS', { cricketResults: null }],
    ['TRIATHLON_STATS', { triathlonData: null }],
    ['KILLER_STATS', {}],
    ['GOTCHA_STATS', {}],
  ])('renvoie à la sélection des jeux un écran %s sans données affichables (V2-FR-09)', (screen, overrides) => {
    store(versioned({ screen, matchRuntime: null, ...overrides }));
    expect(appShell.restoreAppSession(NOW).session?.screen).toBe('GAME_SELECTION');
  });

  it.each([
    ['currentMatch', { currentMatch: { id: 'x' } }],
    ['matchWinner', { matchWinner: 3 }],
    ['arenaPrefillPlayers', { arenaPrefillPlayers: [1] }],
    ['arenaPrefillConfig', { arenaPrefillConfig: 'x' }],
    ['cricketResults', { cricketResults: { competitors: 'x' } }],
    ['triathlonData', { triathlonData: { globalScores: {} } }],
    ['capitalResults', { capitalResults: null }],
    ['killerResults', { killerResults: { players: null } }],
    ['gotchaResults', { gotchaResults: 'x' }],
    ['matchRuntime', { matchRuntime: { match: null } }],
    ['pile d’annulation X01', { matchRuntime: { match: buildPlayedMatch(), hasGameStarted: true, elapsedSeconds: 1, undoStack: [{ match: null }] } }],
    ['configuration X01', { currentMatch: { ...buildPlayedMatch(), config: { ...config, checkOut: 'Triple' } } }],
    ['joueurs en double', { currentMatch: { ...buildPlayedMatch(), players: [players[0], players[0]] } }],
  ])('écarte une session dont le champ %s est invalide', (_field, overrides) => {
    store({ ...versioned(), ...overrides });
    expect(appShell.restoreAppSession(NOW).discarded).toBe(true);
  });

  it('reprend le chrono X01 au moment de la dernière écriture (V2-FR-06)', () => {
    const session = versioned();
    const match = session.matchRuntime!.match;
    store(versioned({ matchRuntime: { match, hasGameStarted: true, elapsedSeconds: 42, measuredAt: NOW - 31_000 } }));
    expect(appShell.restoreAppSession(NOW).session?.matchRuntime?.elapsedSeconds).toBe(72);

    store(versioned({ matchRuntime: { match: { ...match, status: 'finished' }, hasGameStarted: true, elapsedSeconds: 42, measuredAt: NOW - 31_000 } }));
    expect(appShell.restoreAppSession(NOW).session?.matchRuntime?.elapsedSeconds).toBe(42);
  });

  it('ignore sans message un instantané d’un autre jeu (retour arrière puis autre jeu), accepte le bon', () => {
    const gameRuntime = { gameType: 'GOTCHA' as const, state: createGotchaState(players), history: [], timing: { elapsedSeconds: 3, measuredAt: NOW - 2_000, running: true } };
    store(versioned({ screen: 'SETUP', selectedGameType: 'KILLER', matchRuntime: null, gameRuntime }));
    const mismatch = appShell.restoreAppSession(NOW);
    expect(mismatch.discarded).toBe(false);
    expect(mismatch.session?.screen).toBe('SETUP');
    expect(mismatch.session?.selectedGameType).toBe('KILLER');
    expect(mismatch.session?.gameRuntime).toBeNull();

    store(versioned({ screen: 'GOTCHA_GAME', selectedGameType: 'GOTCHA', matchRuntime: null, gameRuntime }));
    expect(appShell.restoreAppSession(NOW).session?.gameRuntime?.timing.elapsedSeconds).toBe(4);
  });

  it('valide aussi la session lue dans IndexedDB', async () => {
    infrastructure.restorePersistedAppSessionAsync.mockResolvedValueOnce(versioned());
    expect((await appShell.restoreAppSessionAsync(NOW)).session?.screen).toBe('MATCH');

    infrastructure.restorePersistedAppSessionAsync.mockResolvedValueOnce({ ...versioned(), schemaVersion: 3 });
    expect(await appShell.restoreAppSessionAsync(NOW)).toEqual({ session: null, discarded: true });

    infrastructure.restorePersistedAppSessionAsync.mockResolvedValueOnce(null);
    expect(await appShell.getRestoredAppSessionAsync()).toBeNull();
  });
});

describe('écriture de la session', () => {
  it('estampille la version et la date d’écriture, et écrit immédiatement à la mise en arrière-plan', () => {
    vi.useFakeTimers({ now: 5_000 });
    try {
      const session = buildLegacyX01Session();
      appShell.persistAppSession({ ...session, screen: 'SETUP' });
      appShell.persistAppSessionNow(session);
      expect(infrastructure.persistAppSessionAsync).toHaveBeenCalledOnce();
      expect(infrastructure.persistAppSessionAsync).toHaveBeenCalledWith({ ...session, schemaVersion: 2, savedAt: 5_000 });

      vi.advanceTimersByTime(1_000);
      expect(infrastructure.persistAppSessionAsync).toHaveBeenCalledOnce();
    } finally {
      vi.useRealTimers();
    }
  });

  it('signale une seule fois une session qui n’a pu être écrite nulle part (V2-FR-08)', async () => {
    const listener = vi.fn();
    const unsubscribe = appShell.onAppSessionPersistenceFailure(listener);
    infrastructure.persistAppSessionAsync.mockResolvedValueOnce(true as never);
    appShell.persistAppSessionNow(buildLegacyX01Session());
    await Promise.resolve();
    expect(listener).not.toHaveBeenCalled();

    infrastructure.persistAppSessionAsync.mockResolvedValueOnce(false as never);
    appShell.persistAppSessionNow(buildLegacyX01Session());
    infrastructure.persistAppSessionAsync.mockRejectedValueOnce(new Error('quota'));
    appShell.persistAppSessionNow(buildLegacyX01Session());
    await vi.waitFor(() => expect(listener).toHaveBeenCalledOnce());
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(listener).toHaveBeenCalledOnce();
    unsubscribe();
  });
});
