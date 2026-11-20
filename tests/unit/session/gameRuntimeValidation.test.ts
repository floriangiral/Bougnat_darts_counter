// Spec ref: specs/010-counter-offline-session-recovery-guarantees (V2-FR-03, V2-AC-04).
import { describe, expect, it } from 'vitest';

import { createGotchaState, recordGotchaTurn } from '../../../src/domain/gotcha/gotcha';
import { capitalGameReducer, createInitialCapitalGameState } from '../../../src/features/capital/capitalGameModel';
import { createMatch } from '../../../src/application/scoring/matchLifecycle';
import { createInitialTriathlonFlowState } from '../../../src/features/triathlon/triathlonFlow';
import { buildCricketMatchSummary, buildCricketCompetitors, createInitialCricketGameState, cricketGameReducer } from '../../../src/features/cricket/cricketGameModel';
import { assignKillerTarget, createKillerState, recordKillerDart } from '../../../src/domain/killer/killer';
import { isGameRuntimeSnapshot, resumeGameRuntime } from '../../../src/features/game-session/gameRuntime';
import { decodeStoredSession, encodeSessionForStorage } from '../../../src/features/game-session/storedSessionCodec';
import type { GameRuntimeSnapshot, PersistedAppSession } from '../../../src/shared';
import type { Player } from '../../../types';

const players: Player[] = [
  { id: 'anne', name: 'Anne', teamId: 'team1' },
  { id: 'zoe', name: 'Zoé', teamId: 'team2' },
];
const timing = { elapsedSeconds: 12, measuredAt: 1_000, running: true };

const gotcha = () => {
  const initial = createGotchaState(players, 301, 0);
  const state = recordGotchaTurn(initial, 60);
  return { gameType: 'GOTCHA' as const, state, history: [initial], timing };
};

// Builds a corrupted copy: `mutate` receives a deep clone of a valid snapshot.
const corrupt = <T extends GameRuntimeSnapshot>(snapshot: T, mutate: (copy: T) => void): unknown => {
  const copy = JSON.parse(JSON.stringify(snapshot)) as T;
  mutate(copy);
  return copy;
};
type GotchaSnapshot = ReturnType<typeof gotcha>;

describe('instantané de partie — validation commune', () => {
  it('refuse un type de jeu inconnu, un chrono invalide ou une valeur qui n’est pas un objet', () => {
    expect(isGameRuntimeSnapshot(null)).toBe(false);
    expect(isGameRuntimeSnapshot(corrupt(gotcha(), (copy) => { (copy as { gameType: string }).gameType = 'BOWLING'; }))).toBe(false);
    expect(isGameRuntimeSnapshot(corrupt(gotcha(), (copy) => { copy.timing = { elapsedSeconds: -1, measuredAt: 0, running: true }; }))).toBe(false);
  });

  it('reprend le chrono jusqu’à la dernière écriture', () => {
    expect(resumeGameRuntime(gotcha(), 11_000).timing.elapsedSeconds).toBe(22);
  });
});

describe('Gotcha — validation de l’instantané', () => {
  it('accepte un instantané réel', () => {
    expect(isGameRuntimeSnapshot(gotcha())).toBe(true);
  });

  it.each<[string, (copy: GotchaSnapshot) => void]>([
    ['joueur courant hors bornes', (copy) => { copy.state.currentPlayerIndex = 2; }],
    ['vainqueur inconnu', (copy) => { copy.state.winnerId = 'max'; }],
    ['score au-delà de la cible', (copy) => { copy.state.players[0].score = 400; }],
    ['un seul joueur', (copy) => { copy.state.players = [copy.state.players[0]]; }],
    ['joueurs en double', (copy) => { copy.state.players[1].id = 'anne'; }],
    ['cible nulle', (copy) => { copy.state.targetScore = 0; }],
    ['visite invalide', (copy) => { copy.state.players[0].history[0].gotchaVictimIds = [1] as unknown as string[]; }],
    ['pile d’annulation invalide', (copy) => { copy.history = [{} as GotchaSnapshot['state']]; }],
  ])('refuse : %s', (_label, mutate) => {
    expect(isGameRuntimeSnapshot(corrupt(gotcha(), mutate))).toBe(false);
  });
});

const killer = () => {
  const initial = createKillerState(players, 0);
  const assigned = assignKillerTarget(assignKillerTarget(initial, 'anne', 20), 'zoe', 19);
  const state = recordKillerDart(assigned, { type: 'DOUBLE_HIT', targetPlayerId: 'anne' });
  return { gameType: 'KILLER' as const, state, history: [assigned, initial], timing };
};
type KillerSnapshot = ReturnType<typeof killer>;

describe('Killer — validation de l’instantané', () => {
  it('accepte un instantané réel', () => {
    expect(isGameRuntimeSnapshot(killer())).toBe(true);
  });

  it.each<[string, (copy: KillerSnapshot) => void]>([
    ['phase inconnue', (copy) => { (copy.state as { phase: string }).phase = 'BONUS'; }],
    ['numéro attribué deux fois', (copy) => { copy.state.players[1].target = 20; }],
    ['numéro hors cible', (copy) => { (copy.state.players[0] as { target: number }).target = 21; }],
    ['vies au-delà du maximum', (copy) => { copy.state.players[0].lives = 4; }],
    ['fléchettes du tour hors bornes', (copy) => { copy.state.dartsInTurn = 3; }],
    ['joueur courant hors bornes', (copy) => { copy.state.currentPlayerIndex = -1; }],
    ['journal invalide', (copy) => { copy.state.log = [3] as unknown as string[]; }],
    ['pile d’annulation invalide', (copy) => { copy.history = [null as unknown as KillerSnapshot['state']]; }],
  ])('refuse : %s', (_label, mutate) => {
    expect(isGameRuntimeSnapshot(corrupt(killer(), mutate))).toBe(false);
  });
});

const capital = () => {
  const initial = createInitialCapitalGameState(players, 0);
  const pending = capitalGameReducer(initial, { type: 'add_dart', dart: { value: 60, multiplier: 1 } });
  const state = capitalGameReducer(capitalGameReducer(pending, { type: 'resolve_round' }), { type: 'add_dart', dart: { value: 20, multiplier: 3 } });
  return { gameType: 'CAPITAL' as const, state, hasGameStarted: true, timing };
};
type CapitalSnapshot = ReturnType<typeof capital>;

describe('Capital — validation de l’instantané', () => {
  it('accepte un instantané réel, y compris avec une manche en attente de résolution', () => {
    expect(isGameRuntimeSnapshot(capital())).toBe(true);
    const pending = capital();
    pending.state = capitalGameReducer(createInitialCapitalGameState(players, 0), { type: 'add_dart', dart: { value: 45, multiplier: 1 } });
    expect(pending.state.pendingResolution).not.toBeNull();
    expect(isGameRuntimeSnapshot(pending)).toBe(true);
  });

  it.each<[string, (copy: CapitalSnapshot) => void]>([
    ['joueur courant hors bornes', (copy) => { copy.state.currentPlayerIdx = 2; }],
    ['joueur sans état de score', (copy) => { copy.state.states = [copy.state.states[0]]; }],
    ['objectif hors bornes', (copy) => { copy.state.states[0].targetIndex = 18; }],
    ['plus de trois fléchettes', (copy) => { copy.state.currentDarts = [...copy.state.currentDarts, ...copy.state.currentDarts, ...copy.state.currentDarts, ...copy.state.currentDarts]; }],
    ['multiplicateur invalide', (copy) => { (copy.state.currentDarts[0] as { multiplier: number }).multiplier = 4; }],
    ['résolution pour un joueur inconnu', (copy) => { copy.state.pendingResolution = { darts: [], playerId: 'max', target: 'CAPITAL' }; }],
    ['objectif inconnu dans l’historique', (copy) => { (copy.state.states[0].history[0] as { target: string }).target = 'BONUS'; }],
    ['pile d’annulation invalide', (copy) => { copy.state.history = [{ ...copy.state.history[0], currentPlayerIdx: 9 }]; }],
    ['début de partie absent', (copy) => { (copy as { hasGameStarted?: boolean }).hasGameStarted = undefined; }],
  ])('refuse : %s', (_label, mutate) => {
    expect(isGameRuntimeSnapshot(corrupt(capital(), mutate))).toBe(false);
  });
});

const cricket = () => {
  const initial = createInitialCricketGameState({
    competitors: buildCricketCompetitors(players, false),
    rotation: { orderedPlayers: players, currentThrowerIdx: 0, startingCompetitorId: 'anne' },
    hasGameStarted: true,
    isDoubles: false,
    roundsLimit: 20,
  });
  const state = cricketGameReducer(cricketGameReducer(initial, { type: 'hit', target: 20, multiplier: 3 }), { type: 'misses', count: 1 });
  return { gameType: 'CRICKET' as const, state, timing };
};
type CricketSnapshot = ReturnType<typeof cricket>;

describe('Cricket — validation de l’instantané', () => {
  it('accepte un instantané réel', () => {
    expect(isGameRuntimeSnapshot(cricket())).toBe(true);
  });

  it.each<[string, (copy: CricketSnapshot) => void]>([
    ['lanceur hors bornes', (copy) => { copy.state.currentThrowerIdx = 2; }],
    ['fléchettes du tour hors bornes', (copy) => { copy.state.turnDartsThrown = 3; }],
    ['lanceur sans compétiteur', (copy) => { copy.state.orderedPlayers[1].id = 'max'; }],
    ['marque manquante', (copy) => { delete (copy.state.states[0].marks as Partial<Record<number, number>>)[25]; }],
    ['statistiques incohérentes', (copy) => { copy.state.aggregateStats = [copy.state.aggregateStats[0]]; }],
    ['vainqueur inconnu', (copy) => { copy.state.winnerId = 'max'; }],
    ['lancer invalide', (copy) => { (copy.state.states[0].history[0] as { multiplier: number }).multiplier = 5; }],
    ['limite de tours nulle', (copy) => { copy.state.roundsLimit = 0; }],
    ['pile d’annulation invalide', (copy) => { copy.state.history = [{ ...copy.state.history[0], currentThrowerIdx: 7 }]; }],
    ['mode équipes absent', (copy) => { (copy.state as { isDoubles?: boolean }).isDoubles = undefined; }],
  ])('refuse : %s', (_label, mutate) => {
    expect(isGameRuntimeSnapshot(corrupt(cricket(), mutate))).toBe(false);
  });
});

const x01Runtime = () => ({
  match: createMatch(players, { startingScore: 501, checkIn: 'Open', checkOut: 'Double', matchMode: 'LEGS', legsToWin: 1, setsToWin: 1, isDoubles: false }),
  hasGameStarted: true,
  elapsedSeconds: 20,
  measuredAt: 1_000,
});

const triathlon = () => {
  const cricketState = cricket().state;
  return {
    gameType: 'TRIATHLON' as const,
    flow: {
      ...createInitialTriathlonFlowState(),
      phase: 'X01' as const,
      startingCompetitorId: 'anne',
      results: {
        capital: capital().state.states,
        cricket: buildCricketMatchSummary(cricketState.aggregateStats, 'anne', x01Runtime().match.config, {}, {}, {}, {}),
      },
    },
    stage: { phase: 'X01' as const, runtime: x01Runtime() },
    timing,
  };
};
type TriathlonSnapshot = ReturnType<typeof triathlon>;

describe('Triathlon — validation de l’instantané', () => {
  it('accepte un instantané réel, avec ou sans épreuve embarquée', () => {
    expect(isGameRuntimeSnapshot(triathlon())).toBe(true);
    expect(isGameRuntimeSnapshot({ ...triathlon(), stage: null })).toBe(true);
    expect(isGameRuntimeSnapshot({ ...triathlon(), flow: createInitialTriathlonFlowState(), stage: null })).toBe(true);
    expect(isGameRuntimeSnapshot({ ...triathlon(), flow: { ...triathlon().flow, phase: 'CAPITAL', results: {} }, stage: { phase: 'CAPITAL', runtime: capital() } })).toBe(true);
    expect(isGameRuntimeSnapshot({ ...triathlon(), flow: { ...triathlon().flow, phase: 'CRICKET', results: { capital: capital().state.states } }, stage: { phase: 'CRICKET', runtime: cricket() } })).toBe(true);
  });

  it.each<[string, (copy: TriathlonSnapshot) => void]>([
    ['phase inconnue', (copy) => { (copy.flow as { phase: string }).phase = 'BOWLING'; }],
    ['résultat Capital manquant', (copy) => { delete (copy.flow.results as { capital?: unknown }).capital; }],
    ['résultat Cricket manquant', (copy) => { delete (copy.flow.results as { cricket?: unknown }).cricket; }],
    ['501 manquant au départage', (copy) => { (copy.flow as { phase: string }).phase = 'TIE_BREAK_X01'; (copy.stage as { phase: string }).phase = 'TIE_BREAK_X01'; }],
    ['match de départage invalide', (copy) => { (copy.flow.results as { tieBreakMatch?: unknown }).tieBreakMatch = {}; }],
    ['premier lanceur absent', (copy) => { copy.flow.startingCompetitorId = null as unknown as string; }],
    ['épreuve embarquée d’une autre phase', (copy) => { (copy.stage as { phase: string }).phase = 'CRICKET'; }],
    ['épreuve embarquée invalide', (copy) => { copy.stage.runtime.match.currentPlayerIndex = 4; }],
    ['tableau invalide', (copy) => { copy.flow.scorecards = [1] as unknown as typeof copy.flow.scorecards; }],
  ])('refuse : %s', (_label, mutate) => {
    expect(isGameRuntimeSnapshot(corrupt(triathlon(), mutate))).toBe(false);
  });

  it('refuse une épreuve Capital ou Cricket mal typée', () => {
    const atCapital = { ...triathlon(), flow: { ...triathlon().flow, phase: 'CAPITAL' as const, results: {} } };
    expect(isGameRuntimeSnapshot({ ...atCapital, stage: { phase: 'CAPITAL', runtime: cricket() } })).toBe(false);
    const atCricket = { ...triathlon(), flow: { ...triathlon().flow, phase: 'CRICKET' as const, results: { capital: capital().state.states } } };
    expect(isGameRuntimeSnapshot({ ...atCricket, stage: { phase: 'CRICKET', runtime: capital() } })).toBe(false);
    const atDraw = { ...triathlon(), flow: createInitialTriathlonFlowState() };
    expect(isGameRuntimeSnapshot({ ...atDraw, stage: { phase: 'STARTING_DRAW', runtime: {} } })).toBe(false);
  });

  it('reprend le chrono du Triathlon et de l’épreuve embarquée', () => {
    const resumed = resumeGameRuntime(triathlon(), 11_000);
    expect(resumed.timing.elapsedSeconds).toBe(22);
    expect(resumed.gameType === 'TRIATHLON' && resumed.stage?.phase === 'X01' && resumed.stage.runtime.elapsedSeconds).toBe(30);

    for (const stage of [{ phase: 'CAPITAL' as const, runtime: capital() }, { phase: 'CRICKET' as const, runtime: cricket() }]) {
      const resumedStage = resumeGameRuntime({ ...triathlon(), stage }, 11_000);
      expect(resumedStage.gameType === 'TRIATHLON' && resumedStage.stage?.runtime).toMatchObject({ timing: { elapsedSeconds: 22 } });
    }
    expect(resumeGameRuntime({ ...triathlon(), stage: null }, 11_000)).toMatchObject({ stage: null });
  });
});

describe('encodage compact des étapes d’annulation', () => {
  const session = (overrides: Partial<PersistedAppSession>): PersistedAppSession => ({
    screen: 'HOME', selectedGameType: 'X01', currentMatch: null, matchWinner: '', arenaPrefillPlayers: [],
    cricketResults: null, triathlonData: null, capitalResults: [], matchRuntime: null, ...overrides,
  });
  const roundTrip = (value: PersistedAppSession) =>
    decodeStoredSession(JSON.parse(JSON.stringify(encodeSessionForStorage(value))) as Record<string, unknown>);

  // A long Cricket game: many undo steps whose per-dart histories grow.
  const longCricket = () => {
    let state = cricket().state;
    for (let dart = 0; dart < 40; dart += 1) {
      state = cricketGameReducer(state, { type: 'hit', target: 20, multiplier: 1 });
    }
    return { ...cricket(), state };
  };

  it('restitue à l’identique les 20 dernières étapes de chaque jeu', () => {
    const cricketRuntime = longCricket();
    expect(roundTrip(session({ gameRuntime: cricketRuntime })).gameRuntime)
      .toEqual({ ...cricketRuntime, state: { ...cricketRuntime.state, history: cricketRuntime.state.history.slice(-20) } });

    const capitalRuntime = capital();
    expect(roundTrip(session({ gameRuntime: capitalRuntime })).gameRuntime).toEqual(capitalRuntime);

    const gotchaRuntime = gotcha();
    expect(roundTrip(session({ gameRuntime: gotchaRuntime })).gameRuntime).toEqual(gotchaRuntime);

    const killerRuntime = killer();
    expect(roundTrip(session({ gameRuntime: killerRuntime })).gameRuntime).toEqual(killerRuntime);

    const triathlonRuntime = { ...triathlon(), stage: { phase: 'CRICKET' as const, runtime: cricketRuntime } };
    const decodedTriathlon = roundTrip(session({ gameRuntime: triathlonRuntime })).gameRuntime as typeof triathlonRuntime;
    expect(decodedTriathlon.stage.runtime.state.history).toEqual(cricketRuntime.state.history.slice(-20));

    const x01 = x01Runtime();
    const finishedLeg = { ...x01.match.currentLeg, winnerId: 'team1' };
    const match = { ...x01.match, completedLegs: [finishedLeg, finishedLeg] };
    const x01WithUndo = { ...x01, match, undoStack: [{ match: { ...match, completedLegs: [finishedLeg] }, elapsedSeconds: 1, showWinnerScreen: false, hasGameStarted: true }] };
    expect(roundTrip(session({ matchRuntime: x01WithUndo })).matchRuntime).toEqual(x01WithUndo);
    const decodedStage = roundTrip(session({ gameRuntime: { ...triathlon(), stage: { phase: 'X01', runtime: x01WithUndo } } })).gameRuntime as TriathlonSnapshot;
    expect(decodedStage.stage.runtime).toEqual(x01WithUndo);
  });

  it('rend invalide une étape dont le préfixe ne correspond pas à la partie courante', () => {
    const stored = JSON.parse(JSON.stringify(encodeSessionForStorage(session({ gameRuntime: longCricket() })))) as { gameRuntime: { state: { history: Array<{ states: Array<{ historyLength: number }> }> } } };
    stored.gameRuntime.state.history[0].states[0].historyLength = 999;
    const decoded = decodeStoredSession(stored);
    expect(isGameRuntimeSnapshot(decoded.gameRuntime)).toBe(false);

    const x01 = x01Runtime();
    const badX01 = { ...x01, undoStack: [{ match: { ...x01.match, completedLegs: [] }, completedLegsCount: 3, elapsedSeconds: 1, showWinnerScreen: false, hasGameStarted: true }] };
    expect(decodeStoredSession({ matchRuntime: badX01 }).matchRuntime).toMatchObject({ undoStack: [null] });
    expect(decodeStoredSession({ matchRuntime: { ...x01, undoStack: [3] } }).matchRuntime).toMatchObject({ undoStack: [3] });
    expect(decodeStoredSession({ matchRuntime: null, gameRuntime: 'x' })).toEqual({ matchRuntime: null, gameRuntime: 'x' });
    expect(decodeStoredSession({ gameRuntime: { gameType: 'GOTCHA', state: null } })).toMatchObject({ gameRuntime: { state: null } });
    expect(decodeStoredSession({ gameRuntime: { gameType: 'TRIATHLON', stage: null } })).toMatchObject({ gameRuntime: { stage: null } });
    expect(decodeStoredSession({ gameRuntime: { gameType: 'CAPITAL', state: null } })).toMatchObject({ gameRuntime: { state: null } });
  });
});
