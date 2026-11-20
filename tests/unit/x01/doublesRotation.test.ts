import { describe, expect, it } from 'vitest';

import { createMatch, resolveMatchStart, submitTurn, undoTurn } from '../../../src/application/scoring/matchLifecycle';
import { calculateDetailedStats, calculateDetailedStatsForTeam } from '../../../src/application/scoring/matchStats';
import { buildCheckoutConfirmResult, buildScoreSubmissionResult, cloneMatchState } from '../../../src/features/x01/scoring/matchSubmission';
import { buildPlayerScoreViewModel } from '../../../src/features/x01/scoring/matchPlayerScore';
import { buildSetupConfig, buildSetupPlayers } from '../../../src/features/game-setup/setupModel';
import type { GameConfig, InOutRule, MatchMode, MatchState, Player } from '../../../types';

// Équipe A (team1) : J1, J2 — Équipe B (team2) : J3, J4, comme construit par l'écran de configuration.
const ID = { J1: 't1p1', J2: 't1p2', J3: 't2p1', J4: 't2p2' } as const;
type Label = keyof typeof ID;
const LABEL_BY_ID: Record<string, Label> = { t1p1: 'J1', t1p2: 'J2', t2p1: 'J3', t2p2: 'J4' };
const TEAM_OF: Record<Label, 'team1' | 'team2'> = { J1: 'team1', J2: 'team1', J3: 'team2', J4: 'team2' };
const PARTNER: Record<Label, Label> = { J1: 'J2', J2: 'J1', J3: 'J4', J4: 'J3' };
const LABELS: Label[] = ['J1', 'J2', 'J3', 'J4'];

const players = buildSetupPlayers({
  isDoubles: true,
  playerNames: [],
  team1Names: ['J1', 'J2'],
  team2Names: ['J3', 'J4'],
});

const buildDoublesConfig = (
  teamStarterIds: Record<string, string>,
  overrides: Partial<{ matchMode: MatchMode; legsToWin: number; setsToWin: number; startingScore: number; checkOut: InOutRule }> = {},
): GameConfig =>
  buildSetupConfig({
    startingScore: overrides.startingScore ?? 101,
    checkIn: 'Open',
    checkOut: overrides.checkOut ?? 'Double',
    matchMode: overrides.matchMode ?? 'LEGS',
    legsToWin: overrides.legsToWin ?? 3,
    setsToWin: overrides.setsToWin ?? 1,
    cricketRounds: 20,
    isDoubles: true,
    startingPlayerIndex: 0,
    teamStarterIds,
  }).config;

/** Partie doublettes lancée comme dans l'application : setup puis choix de l'équipe qui commence. */
const startDoublesMatch = (
  starter: Label,
  overrides: Parameters<typeof buildDoublesConfig>[1] = {},
  otherTeamStarter?: Label,
): MatchState => {
  const starterTeam = TEAM_OF[starter];
  const otherTeam = starterTeam === 'team1' ? 'team2' : 'team1';
  const defaultOtherStarter: Label = otherTeam === 'team1' ? 'J1' : 'J3';
  const teamStarterIds = {
    [starterTeam]: ID[starter],
    [otherTeam]: ID[otherTeamStarter ?? defaultOtherStarter],
  };
  return resolveMatchStart(createMatch(players, buildDoublesConfig(teamStarterIds, overrides)), starterTeam);
};

const currentLabel = (match: MatchState): Label => LABEL_BY_ID[match.players[match.currentPlayerIndex].id];
const legStarterLabel = (match: MatchState): Label => LABEL_BY_ID[match.players[match.currentLeg.startingPlayerIndex].id];

/** Joue des volées à 0 jusqu'à ce que `finisher` soit au pas de tir, puis lui fait fermer la manche. */
const finishLegBy = (match: MatchState, finisher: Label): { next: MatchState; order: Label[] } => {
  let state = match;
  const order: Label[] = [];
  for (let guard = 0; currentLabel(state) !== finisher; guard += 1) {
    if (guard > 8) throw new Error(`${finisher} ne lance jamais`);
    order.push(currentLabel(state));
    state = submitTurn(state, 0, 3);
  }
  order.push(finisher);
  const remaining = state.currentLeg.scores[state.players[state.currentPlayerIndex].teamId];
  return { next: submitTurn(state, remaining, 3), order };
};

/** Joue `count` volées à 0 et renvoie l'ordre réel de passage. */
const playZeroVisits = (match: MatchState, count = 4): { state: MatchState; order: Label[] } => {
  let state = match;
  const order: Label[] = [];
  for (let index = 0; index < count; index += 1) {
    order.push(currentLabel(state));
    state = submitTurn(state, 0, 3);
  }
  return { state, order };
};

const observeOrder = (match: MatchState, count = 4): Label[] => playZeroVisits(match, count).order;

const expectedLegOrder = (legStarter: Label, otherTeamStarter: Label): Label[] =>
  [legStarter, otherTeamStarter, PARTNER[legStarter], PARTNER[otherTeamStarter]];

describe('X01 doublettes — anomalie remontée', () => {
  it('J1 commence et termine la manche : la manche suivante est lancée par J3 puis J1, jamais par J2 pour l’équipe A', () => {
    const firstRound = playZeroVisits(startDoublesMatch('J1'));
    expect(firstRound.order).toEqual(['J1', 'J3', 'J2', 'J4']);

    const { next, order } = finishLegBy(firstRound.state, 'J1');
    expect(order).toEqual(['J1']);
    expect(next.completedLegs).toHaveLength(1);
    expect(next.completedLegs[0].winnerId).toBe('team1');

    expect(legStarterLabel(next)).toBe('J3');
    expect(currentLabel(next)).toBe('J3');
    expect(observeOrder(next)).toEqual(['J3', 'J1', 'J4', 'J2']);
  });
});

describe('X01 doublettes — matrice lanceur × finisseur (16 scénarios)', () => {
  const scenarios = LABELS.flatMap((starter) => LABELS.map((finisher) => [starter, finisher] as const));

  it.each(scenarios)('départ %s, fin %s : alternance des équipes et ordre interne figé', (starter, finisher) => {
    const otherStarter: Label = TEAM_OF[starter] === 'team1' ? 'J3' : 'J1';
    const match = startDoublesMatch(starter);

    expect(legStarterLabel(match)).toBe(starter);
    expect(observeOrder(match)).toEqual(expectedLegOrder(starter, otherStarter));

    const { next } = finishLegBy(match, finisher);
    expect(next.status).toBe('active');
    expect(next.completedLegs[0].winnerId).toBe(TEAM_OF[finisher]);
    expect(next.legsWon[TEAM_OF[finisher]]).toBe(1);
    expect(next.currentLeg.history).toEqual([]);
    expect(next.currentLeg.scores).toEqual({ team1: 101, team2: 101 });

    expect(legStarterLabel(next)).toBe(otherStarter);
    expect(currentLabel(next)).toBe(otherStarter);
    expect(observeOrder(next)).toEqual(expectedLegOrder(otherStarter, starter));
  });
});

describe('X01 doublettes — plusieurs manches et plusieurs sets', () => {
  it('alterne l’équipe qui commence à chaque manche sans dérive, quel que soit le finisseur', () => {
    const finishers: Label[] = ['J2', 'J3', 'J4', 'J1', 'J2'];
    let match = startDoublesMatch('J2', { legsToWin: 5 }, 'J4');
    const starters: Label[] = [];
    const orders: Label[][] = [];

    finishers.forEach((finisher) => {
      starters.push(legStarterLabel(match));
      orders.push(observeOrder(match));
      match = finishLegBy(match, finisher).next;
    });

    expect(starters).toEqual(['J2', 'J4', 'J2', 'J4', 'J2']);
    expect(orders).toEqual([
      ['J2', 'J4', 'J1', 'J3'],
      ['J4', 'J2', 'J3', 'J1'],
      ['J2', 'J4', 'J1', 'J3'],
      ['J4', 'J2', 'J3', 'J1'],
      ['J2', 'J4', 'J1', 'J3'],
    ]);
    expect(match.players.map((player) => player.id)).toEqual([ID.J2, ID.J4, ID.J1, ID.J3]);
  });

  it('chaque set impair est ouvert par l’équipe qui a ouvert le match, chaque set pair par l’autre (WDF § 12.02)', () => {
    let match = startDoublesMatch('J1', { matchMode: 'SETS', legsToWin: 2, setsToWin: 3 });
    const starters: Label[] = [];
    const orders: Label[][] = [];

    // Set 1 : équipe A 2-0 ; set 2 : équipe B 2-0 ; set 3 : équipe B mène 1-0.
    (['J2', 'J1', 'J4', 'J3', 'J3'] as Label[]).forEach((finisher) => {
      starters.push(legStarterLabel(match));
      orders.push(observeOrder(match));
      match = finishLegBy(match, finisher).next;
    });

    // Set 1 ouvert par A, set 2 par B (et non par A comme le voudrait l'alternance continue), set 3 par A.
    expect(starters).toEqual(['J1', 'J3', 'J3', 'J1', 'J1']);
    expect(orders[2]).toEqual(['J3', 'J1', 'J4', 'J2']);
    expect(orders[3]).toEqual(['J1', 'J3', 'J2', 'J4']);
    expect(match.setsWon).toEqual({ team1: 1, team2: 1 });
    expect(match.legsWon).toEqual({ team1: 0, team2: 1 });
    // Dans le set, les manches alternent à partir du départ du set.
    expect(legStarterLabel(match)).toBe('J3');
    expect(observeOrder(match)).toEqual(['J3', 'J1', 'J4', 'J2']);
  });

  it('le départ d’un set ne dépend ni du nombre de manches du set précédent ni de son vainqueur', () => {
    let match = startDoublesMatch('J3', { matchMode: 'SETS', legsToWin: 2, setsToWin: 3 });
    // Set 1 en deux manches (B puis A) gagné 2-0 par A : l'alternance continue aurait fait ouvrir le set 2 par B.
    (['J1', 'J2'] as Label[]).forEach((finisher) => {
      match = finishLegBy(match, finisher).next;
    });
    expect(match.setsWon).toEqual({ team1: 1, team2: 0 });
    expect(legStarterLabel(match)).toBe('J1');
  });
});

describe('X01 doublettes — fin de manche et annulation', () => {
  it('ne modifie pas l’état reçu en terminant une manche (manches et sets)', () => {
    const match = startDoublesMatch('J1', { matchMode: 'SETS', legsToWin: 1, setsToWin: 3 });
    const before = structuredClone(match);

    const { next } = finishLegBy(match, 'J1');

    expect(next.setsWon.team1).toBe(1);
    expect(match).toEqual(before);
  });

  it('l’instantané d’annulation pris après le calcul de la fin de manche reste l’état d’avant (ordre de MatchView)', () => {
    let match = startDoublesMatch('J1');
    match = submitTurn(match, 61, 3);
    match = submitTurn(match, 0, 3);
    match = submitTurn(match, 0, 3);
    match = submitTurn(match, 0, 3);

    // handleCheckoutConfirm : calcule le résultat PUIS clone l'état courant pour l'annulation.
    const result = buildCheckoutConfirmResult(match, 40, 2, 120);
    const undoSnapshot = cloneMatchState(match);

    expect(result.nextMatch.legsWon).toEqual({ team1: 1, team2: 0 });
    expect(undoSnapshot.legsWon).toEqual({ team1: 0, team2: 0 });
    expect(undoSnapshot.currentLeg.history).toHaveLength(4);
    expect(currentLabel(undoSnapshot)).toBe('J1');

    // Rejouer la sortie après l'annulation ne compte la manche qu'une fois.
    const replayed = buildCheckoutConfirmResult(undoSnapshot, 40, 2, 130);
    expect(replayed.nextMatch.legsWon).toEqual({ team1: 1, team2: 0 });
    expect(currentLabel(replayed.nextMatch)).toBe('J3');
  });

  it('annuler une volée rend la main au même lanceur puis reprend l’ordre normal', () => {
    let match = startDoublesMatch('J3');
    match = submitTurn(match, 60, 3);
    match = submitTurn(match, 45, 3);
    expect(currentLabel(match)).toBe('J4');

    const undone = undoTurn(match);
    expect(currentLabel(undone)).toBe('J1');
    expect(undone.currentLeg.scores).toEqual({ team1: 101, team2: 41 });
    expect(observeOrder(undone)).toEqual(['J1', 'J4', 'J2', 'J3']);
  });
});

describe('X01 doublettes — volées particulières et modes de sortie', () => {
  it('un trop (score dépassé ou reste 1 en Double-Out) et une volée à zéro passent la main à l’autre équipe', () => {
    let match = startDoublesMatch('J1');
    match = submitTurn(match, 99, 3);
    expect(match.currentLeg.history.at(-1)?.isBust).toBe(false);
    match = submitTurn(match, 120, 3);
    expect(match.currentLeg.history.at(-1)?.isBust).toBe(true);
    expect(currentLabel(match)).toBe('J2');
    match = submitTurn(match, 0, 3);
    expect(currentLabel(match)).toBe('J4');
    match = submitTurn(match, 100, 3);
    expect(match.currentLeg.history.at(-1)?.isBust).toBe(true);
    expect(match.currentLeg.scores).toEqual({ team1: 2, team2: 101 });
    expect(currentLabel(match)).toBe('J1');
    expect(match.currentLeg.history.map((turn) => LABEL_BY_ID[turn.playerId])).toEqual(['J1', 'J3', 'J2', 'J4']);
  });

  it.each<InOutRule>(['Open', 'Double', 'Master'])('fin de manche en sortie %s : même rotation pour la manche suivante', (checkOut) => {
    const firstRound = playZeroVisits(startDoublesMatch('J4', { checkOut }), 2);
    const { next } = finishLegBy(firstRound.state, 'J3');
    expect(next.completedLegs[0].winnerId).toBe('team2');
    expect(observeOrder(next)).toEqual(['J1', 'J4', 'J2', 'J3']);
  });

  it.each([1, 2, 3] as const)('sortie confirmée en %s fléchette(s) : la manche suivante est ouverte par l’autre équipe', (darts) => {
    const match = startDoublesMatch('J2', { startingScore: 40 });
    const result = buildCheckoutConfirmResult(match, 40, darts, 10);
    expect(result.nextMatch.completedLegs[0].history.at(-1)).toMatchObject({ playerId: ID.J2, dartsThrown: darts });
    expect(observeOrder(result.nextMatch)).toEqual(['J3', 'J2', 'J4', 'J1']);
  });

  it('la saisie clavier (score normal) suit la même rotation que le moteur', () => {
    const match = startDoublesMatch('J3');
    const result = buildScoreSubmissionResult(match, 60, 5);
    expect(result.kind).toBe('applied');
    if (result.kind !== 'applied') return;
    expect(currentLabel(result.nextMatch)).toBe('J1');
  });
});

describe('X01 doublettes — affichage, choix du lanceur et fin de match', () => {
  it('le panneau de l’équipe qui reçoit affiche son premier lanceur au début de la manche suivante', () => {
    const { next } = finishLegBy(playZeroVisits(startDoublesMatch('J1')).state, 'J1');
    expect(buildPlayerScoreViewModel(next, 'team2', null)).toMatchObject({ name: 'J3', isActive: true });
    expect(buildPlayerScoreViewModel(next, 'team1', null)).toMatchObject({ name: 'J1', isActive: false, subtitle: 'J1 / J2' });

    const afterJ3 = submitTurn(next, 0, 3);
    expect(buildPlayerScoreViewModel(afterJ3, 'team2', null).name).toBe('J4');
    expect(buildPlayerScoreViewModel(afterJ3, 'team1', null).name).toBe('J1');
  });

  it('le choix manuel de l’équipe qui commence n’est possible qu’avant la première fléchette du match', () => {
    const match = createMatch(players, buildDoublesConfig({ team1: ID.J2, team2: ID.J4 }));
    const chosen = resolveMatchStart(match, 'team2');
    expect(observeOrder(chosen)).toEqual(['J4', 'J2', 'J3', 'J1']);

    const afterFirstVisit = submitTurn(chosen, 0, 3);
    expect(resolveMatchStart(afterFirstVisit, 'team1')).toBe(afterFirstVisit);

    const nextLeg = finishLegBy(chosen, 'J4').next;
    expect(nextLeg.currentLeg.history).toEqual([]);
    expect(resolveMatchStart(nextLeg, 'team2')).toBe(nextLeg);
    expect(observeOrder(nextLeg)).toEqual(['J2', 'J4', 'J1', 'J3']);
  });

  it.each([
    ['LEGS', { legsToWin: 2 }],
    ['SETS', { matchMode: 'SETS' as const, legsToWin: 1, setsToWin: 2 }],
  ] as const)('fin définitive du match (%s) : vainqueur figé, aucune nouvelle manche', (_mode, overrides) => {
    const leg1 = finishLegBy(startDoublesMatch('J1', overrides), 'J2').next;
    expect(leg1.status).toBe('active');
    const final = finishLegBy(leg1, 'J1').next;

    expect(final.status).toBe('finished');
    expect(final.matchWinnerId).toBe('team1');
    expect(final.currentLeg.winnerId).toBe('team1');
    expect(final.completedLegs).toHaveLength(1);
    expect(currentLabel(final)).toBe('J1');
    expect(final.players).toEqual(leg1.players);
  });

  it('les statistiques individuelles et d’équipe restent attribuées au bon lanceur', () => {
    let match = startDoublesMatch('J1', { startingScore: 301 });
    match = submitTurn(match, 100, 3); // J1
    match = submitTurn(match, 60, 3); // J3
    match = submitTurn(match, 140, 3); // J2
    match = submitTurn(match, 45, 3); // J4
    match = finishLegBy(match, 'J1').next; // J1 sort 61
    match = submitTurn(match, 26, 3); // J3
    match = submitTurn(match, 180, 3); // J1

    expect(calculateDetailedStats(match, ID.J1).highestScore).toBe(180);
    expect(calculateDetailedStats(match, ID.J2).highestScore).toBe(140);
    expect(calculateDetailedStats(match, ID.J1).highestCheckout).toBe(61);
    expect(calculateDetailedStats(match, ID.J3).highestScore).toBe(60);
    expect(calculateDetailedStatsForTeam(match, 'team1').highestScore).toBe(180);
    expect(calculateDetailedStatsForTeam(match, 'team2').highestScore).toBe(60);
  });
});

describe('X01 doublettes — reprise d’une partie sauvegardée', () => {
  it('une partie sérialisée en milieu de manche reprend exactement le même ordre', () => {
    const { next } = finishLegBy(playZeroVisits(startDoublesMatch('J1')).state, 'J1');
    const midLeg = submitTurn(submitTurn(next, 0, 3), 0, 3);
    const restored = JSON.parse(JSON.stringify(midLeg)) as MatchState;

    expect(observeOrder(restored, 6)).toEqual(observeOrder(midLeg, 6));
    expect(observeOrder(restored, 6)).toEqual(['J4', 'J2', 'J3', 'J1', 'J4', 'J2']);
  });

  it('une partie enregistrée avec l’ancien algorithme termine la manche en cours dans son ordre, puis applique la règle', () => {
    // État produit avant correction : manche 2 ouverte par J3 avec le cycle J3, J2, J4, J1.
    const base = startDoublesMatch('J1');
    const legacy: MatchState = {
      ...base,
      completedLegs: [{ ...base.currentLeg, winnerId: 'team1' }],
      legsWon: { team1: 1, team2: 0 },
      currentLeg: {
        scores: { team1: 101, team2: 101 },
        history: [
          { playerId: ID.J3, score: 0, isBust: false, remainingAfter: 101, dartsThrown: 3 },
          { playerId: ID.J2, score: 0, isBust: false, remainingAfter: 101, dartsThrown: 3 },
        ],
        winnerId: null,
        startingPlayerIndex: 1,
      },
      currentPlayerIndex: 3,
    };
    const restored = JSON.parse(JSON.stringify(legacy)) as MatchState;

    expect(currentLabel(restored)).toBe('J4');
    expect(observeOrder(restored, 4)).toEqual(['J4', 'J1', 'J3', 'J2']);
    const { next } = finishLegBy(restored, 'J1');
    expect(observeOrder(next)).toEqual(['J1', 'J3', 'J2', 'J4']);
  });

  it('une partie sans premiers lanceurs mémorisés retombe sur le premier joueur de chaque équipe', () => {
    const base = startDoublesMatch('J1');
    const legacy: MatchState = { ...base, config: { ...base.config, teamStarterIds: undefined } };
    expect(observeOrder(legacy)).toEqual(['J1', 'J3', 'J2', 'J4']);
    expect(observeOrder(finishLegBy(legacy, 'J3').next)).toEqual(['J3', 'J1', 'J4', 'J2']);
  });
});

describe('X01 — non-régression simple, robot et Triathlon', () => {
  const single: Player[] = [
    { id: 'p1', name: 'Alice', teamId: 'p1' },
    { id: 'p2', name: 'Robot', teamId: 'p2', isBot: true, botLevel: 'CLUB' },
  ];
  const singleConfig: GameConfig = {
    startingScore: 40, checkIn: 'Open', checkOut: 'Double', matchMode: 'LEGS',
    legsToWin: 4, setsToWin: 1, isDoubles: false, initialStartingPlayerIndex: 1,
  };

  it('en simple (humain contre robot), le lanceur alterne à chaque volée et à chaque manche, quel que soit le vainqueur', () => {
    let match = createMatch(single, singleConfig);
    const starters: string[] = [];
    (['p2', 'p2', 'p1'] as const).forEach((winner) => {
      starters.push(match.players[match.currentLeg.startingPlayerIndex].id);
      if (match.players[match.currentPlayerIndex].id !== winner) {
        match = submitTurn(match, 0, 3);
        expect(match.players[match.currentPlayerIndex].id).toBe(winner);
      }
      match = submitTurn(match, 40, 2);
    });
    starters.push(match.players[match.currentLeg.startingPlayerIndex].id);

    expect(starters).toEqual(['p2', 'p1', 'p2', 'p1']);
    expect(match.legsWon).toEqual({ p1: 1, p2: 2 });
  });

  it('en simple et en sets, le joueur qui a ouvert le match ouvre les sets impairs (WDF § 12.02)', () => {
    let match = createMatch(single, { ...singleConfig, matchMode: 'SETS', legsToWin: 2, setsToWin: 3 });
    const starters: string[] = [];
    // Set 1 : p2 puis p1 ouvrent, gagné 2-0 par p1 ; set 2 (pair) : ouvert par p1, alors que l'alternance continue aurait redonné la main à p2.
    (['p1', 'p1'] as const).forEach((winner) => {
      starters.push(match.players[match.currentLeg.startingPlayerIndex].id);
      if (match.players[match.currentPlayerIndex].id !== winner) match = submitTurn(match, 0, 3);
      match = submitTurn(match, 40, 2);
    });
    starters.push(match.players[match.currentLeg.startingPlayerIndex].id);

    expect(match.setsWon).toEqual({ p1: 1, p2: 0 });
    expect(starters).toEqual(['p2', 'p1', 'p1']);
  });

  it('Triathlon (X01 d’une manche) conserve l’ordre issu du tirage au bull', () => {
    const triathlonConfig = { ...buildDoublesConfig({ team1: ID.J2, team2: ID.J3 }), legsToWin: 1, initialStartingTeamId: 'team2' as const };
    expect(observeOrder(createMatch(players, triathlonConfig))).toEqual(['J3', 'J2', 'J4', 'J1']);
  });

  it('sans équipe de départ résolue, l’ordre de saisie n’entraîne plus deux volées consécutives d’une même équipe', () => {
    const match = createMatch(players, buildDoublesConfig({ team1: ID.J1, team2: ID.J4 }));
    expect(match.players.map((player) => LABEL_BY_ID[player.id])).toEqual(['J1', 'J2', 'J3', 'J4']);
    expect(observeOrder(match)).toEqual(['J1', 'J4', 'J2', 'J3']);
  });
});
