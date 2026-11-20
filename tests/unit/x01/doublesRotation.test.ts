import { describe, expect, it } from 'vitest';

import { createMatch, resolveMatchStart, submitTurn, undoTurn } from '../../../src/application/scoring/matchLifecycle';
import { buildCheckoutConfirmResult, cloneMatchState } from '../../../src/features/x01/scoring/matchSubmission';
import { buildSetupConfig, buildSetupPlayers } from '../../../src/features/game-setup/setupModel';
import type { GameConfig, MatchMode, MatchState } from '../../../types';

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
  overrides: Partial<{ matchMode: MatchMode; legsToWin: number; setsToWin: number; startingScore: number }> = {},
): GameConfig =>
  buildSetupConfig({
    startingScore: overrides.startingScore ?? 101,
    checkIn: 'Open',
    checkOut: 'Double',
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

  it('continue l’alternance au changement de set (règle maison : pas de remise à zéro)', () => {
    let match = startDoublesMatch('J1', { matchMode: 'SETS', legsToWin: 2, setsToWin: 2 });
    const starters: Label[] = [];
    const orders: Label[][] = [];

    // Set 1 : équipe A 2-0 ; set 2 : équipe B 2-0 ; set 3 : équipe B mène 1-0.
    (['J2', 'J1', 'J4', 'J3', 'J3'] as Label[]).forEach((finisher) => {
      starters.push(legStarterLabel(match));
      orders.push(observeOrder(match));
      match = finishLegBy(match, finisher).next;
    });

    expect(starters).toEqual(['J1', 'J3', 'J1', 'J3', 'J1']);
    expect(orders[1]).toEqual(['J3', 'J1', 'J4', 'J2']);
    expect(orders[2]).toEqual(['J1', 'J3', 'J2', 'J4']);
    expect(match.setsWon).toEqual({ team1: 1, team2: 1 });
    expect(match.legsWon).toEqual({ team1: 0, team2: 1 });
    expect(legStarterLabel(match)).toBe('J3');
    expect(observeOrder(match)).toEqual(['J3', 'J1', 'J4', 'J2']);
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
